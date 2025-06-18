from sqlalchemy.ext.asyncio import AsyncSession
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from typing import Dict, List
from difflib import SequenceMatcher
import unicodedata

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
    invalid = ["not explicitly", "not mentioned", "no extra", "não há menção", "nao ha mencao", "none", "no unique", "mencionado", "no texto"]
    for term in invalid:
        if term in n:
            return False
    return True


def _normalize(text: str) -> str:
    """Return a lowercase version of the text without diacritics and extra spaces."""
    text = unicodedata.normalize("NFD", text or "")
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return " ".join(text.lower().split())


def _canonical(name: str) -> str:
    """Return a normalized version of the name without honorifics."""
    n = _normalize(name)
    titles = {"lord", "lady", "sir", "dame", "mr", "mrs", "ms"}
    words = [w for w in n.split() if w not in titles]
    return " ".join(words)


def _select_key(name: str, groups: Dict[str, List[dict]]) -> str:
    """Return the canonical key for grouping similar names."""
    canonical = _canonical(name)
    for k in list(groups.keys()):
        if k.startswith(canonical):
            groups[canonical] = groups.pop(k)
            return canonical
        if canonical.startswith(k):
            return k
    return canonical


def _find_existing_page(name: str, page_map: Dict[str, int]) -> int | None:
    """Find existing page id by canonical or fuzzy match."""
    key = _canonical(name)
    if key in page_map:
        return page_map[key]
    for k, pid in page_map.items():
        if key.startswith(k) or k.startswith(key):
            return pid
        if SequenceMatcher(None, key, k).ratio() > 0.85:
            return pid
    return None


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
    page_map = {_canonical(p.name): p.id for p in existing_pages}

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
    docs = text_splitter.split_text(page.content or "")

    llm = ChatOpenAI(api_key=settings.openai_api_key or "sk-test", model=settings.open_ai_model)

    suggestions_by_name: Dict[str, List[dict]] = {}
    for concept in concepts:
        found: set[str] = set()
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                f"Extract the exact names of any {concept.name} explicitly mentioned in the text. {concept.description or ''} Respond with a comma separated list of the names only. If none are present, reply with an empty string.",
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
            key = _select_key(name, suggestions_by_name)
            exists_id = _find_existing_page(key, page_map)
            entry = {
                "name": key,
                "concept_id": concept.id,
                "concept": concept.name,
                "exists": exists_id is not None,
            }
            if exists_id is not None:
                entry["target_page_id"] = exists_id
            suggestions_by_name.setdefault(key, []).append(entry)

    final_suggestions: List[dict] = []
    for name, entries in suggestions_by_name.items():
        if len(entries) == 1:
            entry = entries[0]
            entry["source_pages"] = [{"id": page.id, "name": page.name}]
            entry["source_page_updated"] = (
                page.updated_at.isoformat() if page.updated_at else ""
            )
            final_suggestions.append(entry)
            continue
        option_concepts = [concepts_by_id[e["concept_id"]] for e in entries]
        best = await _choose_concept(llm, name, page.content or "", option_concepts)
        chosen = next((e for e in entries if e["concept"] == best), entries[0])
        chosen["source_pages"] = [{"id": page.id, "name": page.name}]
        chosen["source_page_updated"] = (
            page.updated_at.isoformat() if page.updated_at else ""
        )
        final_suggestions.append(chosen)

    return {"suggestions": final_suggestions}

async def generate_pages(session: AsyncSession, agent: Agent, page: Page, page_specs: List[dict]):
    print (f" -- GENERATING PAGE!")
    """Generate full page data for selected suggestions.

    Each page spec may include ``source_page_ids`` which will be used to
    aggregate the text from those pages before sending it to the language model.
    """
    llm = ChatOpenAI(api_key=settings.openai_api_key or "sk-test", model=settings.open_ai_model)
    generated = []

    # Preload existing pages in the same world to resolve page_ref values
    existing_pages = await crud_page.get_pages(session, gameworld_id=page.gameworld_id)

    def find_page_id(name: str, ref_concept_id: int | None = None) -> int | None:
        """Lookup for a page by fuzzy name and optional concept."""
        if not name:
            return None
        target = _canonical(name)
        best_id: int | None = None
        best_ratio = 0.0
        for p in existing_pages:
            if ref_concept_id is not None and p.concept_id != ref_concept_id:
                continue
            candidate = _canonical(p.name)
            if not candidate:
                continue
            if target in candidate or candidate in target:
                return p.id
            ratio = SequenceMatcher(None, target, candidate).ratio()
            if ratio > 0.8 and ratio > best_ratio:
                best_ratio = ratio
                best_id = p.id
        return best_id

    for spec in page_specs:
        concept = await crud_concept.get_concept(session, spec["concept_id"])
        if not concept:
            continue
        characteristics = await crud_characteristic.get_characteristics_for_concept(session, concept.id)
        char_names = ", ".join(c.name for c in characteristics)
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are a skilled writer summarizing fantasy lore. Extract characteristic values found in the text and craft a short, well written narrative recount of the concept's story. Create the text using the same language as the given text. Respond only with valid JSON in the format {{\"autogenerated_content\": <text>, \"values\": {{<characteristic>: [<values>]}}}}. Do not include any other text."
            ),
            (
                "user",
                "Page name: {name}\nConcept: {concept}\nCharacteristics: {chars}\nText:\n{content}"
            ),
        ])
        chain = prompt | llm
        text_content = page.content or ""
        if spec.get("source_page_ids"):
            pieces = []
            for pid in spec["source_page_ids"]:
                sp = next((pp for pp in existing_pages if pp.id == pid), None)
                if sp and sp.content:
                    pieces.append(sp.content)
            if pieces:
                text_content = "\n\n---\n\n".join(pieces)

        resp = await chain.ainvoke({
            "name": spec["name"],
            "concept": concept.name,
            "chars": char_names,
            "content": text_content,
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
        print (f" -- GENERATING PAGE! + {generated}")
    return {"pages": generated}


async def analyze_pages_bulk(
    session: AsyncSession, agent: Agent, pages: List[Page]
) -> List[dict]:
    """Analyze multiple pages and merge suggestions by fuzzy page name.

    Instead of discarding similar suggestions, accumulate the pages they were
    found in so the reviewer can see every source."""

    all_suggestions: List[dict] = []
    for page in pages:
        result = await analyze_page(session, agent, page)
        for s in result.get("suggestions", []):
            entry = dict(s)
            entry["source_pages"] = [{"id": page.id, "name": page.name}]
            entry["source_page_updated"] = (
                page.updated_at.isoformat() if page.updated_at else ""
            )
            all_suggestions.append(entry)

    def _similar(a: str, b: str) -> bool:
        return SequenceMatcher(None, a.lower(), b.lower()).ratio() >= 0.6

    merged: List[dict] = []
    for sugg in all_suggestions:
        found = None
        for m in merged:
            if _similar(m["name"], sugg["name"]):
                found = m
                break
        if found:
            existing_ids = {p["id"] for p in found.get("source_pages", [])}
            for sp in sugg.get("source_pages", []):
                if sp["id"] not in existing_ids:
                    found.setdefault("source_pages", []).append(sp)
            cur_dt = sugg.get("source_page_updated", "")
            if cur_dt and cur_dt > found.get("source_page_updated", ""):
                found.update({k: v for k, v in sugg.items() if k != "source_pages"})
        else:
            merged.append(sugg)

    return merged
