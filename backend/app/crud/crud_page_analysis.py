from sqlalchemy.ext.asyncio import AsyncSession
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from typing import Dict, List

from app.config import settings
from app.models.model_page import Page
from app.models.model_agent import Agent
from app.models.model_concept import Concept
from app.crud import crud_page, crud_concept


def _valid_name(name: str) -> bool:
    if not name:
        return False
    n = name.lower()
    invalid = ["not explicitly", "not mentioned", "no extra", "não há menção", "nao ha mencao", "none"]
    for term in invalid:
        if term in n:
            return False
    return True


async def _choose_concept(llm: ChatOpenAI, name: str, content: str, options: List[Concept]) -> str:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Choose the most appropriate concept for the given name. Respond with the concept name only."),
        (
            "user",
            "Name: {name}\nOptions: {opts}\nExcerpt: {text}\nAnswer with only one concept name.",
        ),
    ])
    opts = "; ".join([f"{c.name}: {c.description or ''}" for c in options])
    chain = prompt | llm
    resp = await chain.ainvoke({"name": name, "opts": opts, "text": content[:1000]})
    return resp.content.strip()


async def analyze_page(session: AsyncSession, agent: Agent, page: Page):
    """Analyze page content and return concept-based page suggestions."""
    concepts = await crud_concept.get_concepts(
        session, gameworld_id=page.gameworld_id, auto_generated=True
    )
    concepts_by_id: Dict[int, Concept] = {c.id: c for c in concepts}
    existing_pages = await crud_page.get_pages(session, gameworld_id=page.gameworld_id)
    page_map = {(p.concept_id, p.name.lower()): True for p in existing_pages}

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
    docs = text_splitter.split_text(page.content or "")

    llm = ChatOpenAI(api_key=settings.openai_api_key or "sk-test", model=settings.open_ai_model)

    suggestions_by_name: Dict[str, List[dict]] = {}
    for concept in concepts:
        found: set[str] = set()
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                f"List all unique {concept.name} mentioned in the text. {concept.description or ''} Return a comma separated list.",
            ),
            ("user", "{text}"),
        ])
        chain = prompt | llm
        for chunk in docs:
            resp = await chain.ainvoke({"text": chunk})
            names = [n.strip() for n in resp.content.split(',') if n.strip()]
            found.update(names)
        for name in sorted(found):
            if not _valid_name(name):
                continue
            exists = (concept.id, name.lower()) in page_map
            entry = {
                "name": name,
                "concept_id": concept.id,
                "concept": concept.name,
                "exists": exists,
            }
            suggestions_by_name.setdefault(name, []).append(entry)

    final_suggestions: List[dict] = []
    for name, entries in suggestions_by_name.items():
        if len(entries) == 1:
            final_suggestions.append(entries[0])
            continue
        option_concepts = [concepts_by_id[e["concept_id"]] for e in entries]
        best = await _choose_concept(llm, name, page.content or "", option_concepts)
        chosen = next((e for e in entries if e["concept"] == best), entries[0])
        final_suggestions.append(chosen)

    return {"suggestions": final_suggestions}

