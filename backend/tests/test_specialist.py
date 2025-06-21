import pytest
from pathlib import Path

@pytest.mark.anyio
async def test_specialist_sources(async_client, create_user, login_and_get_token, tmp_path):
    await create_user("builder@ex.com", "pass", "world builder")
    token = await login_and_get_token("builder@ex.com", "pass", "world builder")

    gw_payload = {"name": "W", "system": "dnd", "description": "d"}
    resp = await async_client.post("/gameworlds/", json=gw_payload, headers={"Authorization": f"Bearer {token}"})
    gw_id = resp.json()["id"]

    agent_payload = {"name": "Spec", "world_id": gw_id}
    resp = await async_client.post("/agents/", json=agent_payload, headers={"Authorization": f"Bearer {token}"})
    agent_id = resp.json()["id"]

    file_path = tmp_path / "doc.txt"
    file_path.write_text("hello world")

    with open(file_path, "rb") as f:
        resp = await async_client.post(
            f"/specialist_agents/{agent_id}/source_file",
            data={"name": "doc"},
            files={"file": ("doc.txt", f, "text/plain")},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 200
    source_id = resp.json()["id"]
    stored_path = Path(resp.json()["path"])
    assert stored_path.is_file()
    assert stored_path.read_text() == "hello world"

    resp = await async_client.get(
        f"/specialist_agents/{agent_id}/sources",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "doc"

    resp = await async_client.post(
        f"/specialist_agents/{agent_id}/rebuild_vectors",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["documents_indexed"] >= 1

    resp = await async_client.delete(
        f"/specialist_agents/{agent_id}/sources/{source_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["ok"] is True

from datetime import datetime, timezone
from unittest.mock import patch
from pydantic import BaseModel

class FakeAgent:
    world_id = 1
    personality = "helpful"
    specialist_update_date = datetime.now(timezone.utc)


@pytest.mark.anyio
async def test_specialist_chat(async_client, create_user, login_and_get_token):
    await create_user("spec@test.com", "pass", "writer")
    token = await login_and_get_token("spec@test.com", "pass", "writer")

    payload = {"messages": [{"role": "user", "content": "Hello"}]}

    async def fake_chat(session, agent_id, messages):
        return {"answer": "<p>Hi</p>", "sources": [{"name": "Doc"}]}

    with patch("app.api.api_specialist.chat_with_specialist", side_effect=fake_chat), \
         patch("app.api.api_specialist.get_agent", return_value=FakeAgent()):
        resp = await async_client.post(
            "/specialist_agents/1/chat",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 200
    assert resp.json()["answer"].startswith("<p>")


@pytest.mark.anyio
async def test_specialist_chat_history(async_client, create_user, login_and_get_token, tmp_path):
    from app.config import settings

    settings.chat_history_dir = str(tmp_path / "{user_id}")

    user = await create_user("hist@test.com", "pass", "writer")
    token = await login_and_get_token("hist@test.com", "pass", "writer")

    payload = {"messages": [{"role": "user", "content": "Hello"}]}

    async def fake_chat(session, agent_id, messages):
        return {"answer": "<p>Hi</p>", "sources": []}

    with patch("app.api.api_specialist.chat_with_specialist", side_effect=fake_chat), \
         patch("app.api.api_specialist.get_agent", return_value=FakeAgent()):
        await async_client.post(
            "/specialist_agents/1/chat",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )

    hist_file = tmp_path / str(user["id"]) / "1.json"
    assert hist_file.is_file()

    resp = await async_client.get(
        "/specialist_agents/1/history",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["messages"][-1]["content"].startswith("<p>")

    resp = await async_client.delete(
        "/specialist_agents/1/history",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert not hist_file.exists()
