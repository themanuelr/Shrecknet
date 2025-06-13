from sqlalchemy.ext.asyncio import AsyncSession
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate

from app.config import settings
from app.models.model_page import Page
from app.models.model_agent import Agent
from app.models.model_concept import Concept
from app.crud import crud_page, crud_concept


async def analyze_page(session: AsyncSession, agent: Agent, page: Page):
    """Analyze page content and return concept-based page suggestions."""
    concepts = await crud_concept.get_concepts(session, gameworld_id=page.gameworld_id, auto_generated=True)
    existing_pages = await crud_page.get_pages(session, gameworld_id=page.gameworld_id)
    page_map = {(p.concept_id, p.name.lower()): True for p in existing_pages}

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
    docs = text_splitter.split_text(page.content or "")

    llm = ChatOpenAI(api_key=settings.openai_api_key or "sk-test", model=settings.open_ai_model)

    suggestions: list[dict] = []
    for concept in concepts:
        found: set[str] = set()
        prompt = ChatPromptTemplate.from_messages([
            ("system", f"List all unique {concept.name} mentioned in the text. {concept.description or ''} Return a comma separated list."),
            ("user", "{text}")
        ])
        chain = prompt | llm
        for chunk in docs:
            resp = await chain.ainvoke({"text": chunk})
            names = [n.strip() for n in resp.content.split(',') if n.strip()]
            found.update(names)
        for name in sorted(found):
            exists = (concept.id, name.lower()) in page_map
            suggestions.append({
                "name": name,
                "concept_id": concept.id,
                "concept": concept.name,
                "exists": exists,
            })
    return {"suggestions": suggestions}

