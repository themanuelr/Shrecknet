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
from app.crud import crud_characteristic
import json


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

async def generate_pages(session: AsyncSession, agent: Agent, page: Page, page_specs: List[dict]):
    """Generate full page data for selected suggestions."""
    llm = ChatOpenAI(api_key=settings.openai_api_key or "sk-test", model=settings.open_ai_model)
    generated = []

    # Preload existing pages in the same world to resolve page_ref values
    existing_pages = await crud_page.get_pages(session, gameworld_id=page.gameworld_id)

    def find_page_id(name: str, ref_concept_id: int | None = None) -> int | None:
        """Simple lookup for a page by (partial) name and optional concept."""
        if not name:
            return None
        name_l = name.lower()
        for p in existing_pages:
            if ref_concept_id is not None and p.concept_id != ref_concept_id:
                continue
            if name_l in p.name.lower() or p.name.lower() in name_l:
                return p.id
        return None

    for spec in page_specs:
        concept = await crud_concept.get_concept(session, spec["concept_id"])
        if not concept:
            continue
        characteristics = await crud_characteristic.get_characteristics_for_concept(session, concept.id)
        char_names = ", ".join(c.name for c in characteristics)
        prompt = ChatPromptTemplate.from_messages([
            ("system", "Extract characteristic values if present and create a short novelized description."),
            ("user", "Page name: {name}\nConcept: {concept}\nCharacteristics: {chars}\nText:\n{content}\nRespond in JSON with keys 'autogenerated_content' and 'values' (mapping characteristic name to value list)."),
        ])
        chain = prompt | llm
        resp = await chain.ainvoke({
            "name": spec["name"],
            "concept": concept.name,
            "chars": char_names,
            "content": page.content or "",
        })
        text = resp.content.strip()
        try:
            data = json.loads(text)
        except Exception:
            data = {"autogenerated_content": text, "values": {}}
        values = []
        vals = data.get("values", {}) if isinstance(data.get("values", {}), dict) else {}
        for c in characteristics:
            val = vals.get(c.name)
            if not val:
                continue
            val_list = val if isinstance(val, list) else [val]

            if c.type == "page_ref":
                ref_ids: List[str] = []
                for v in val_list:
                    pid = find_page_id(str(v), c.ref_concept_id)
                    if pid is not None:
                        ref_ids.append(str(pid))
                if ref_ids:
                    values.append({"characteristic_id": c.id, "value": ref_ids})
            else:
                values.append({"characteristic_id": c.id, "value": [str(v) for v in val_list]})
        generated.append({
            "name": spec["name"],
            "gameworld_id": page.gameworld_id,
            "concept_id": concept.id,
            "allow_crosslinks": True,
            "ignore_crosslink": False,
            "allow_crossworld": True,
            "updated_by_agent_id": agent.id,
            "autogenerated_content": data.get("autogenerated_content", ""),
            "values": values,
        })
    return {"pages": generated}
