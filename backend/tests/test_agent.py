import pytest
from unittest.mock import patch
from datetime import datetime, timezone
import json

@pytest.mark.anyio
async def test_chat_endpoint(async_client, create_user, login_and_get_token):
    await create_user("agent@test.com", "pass", "writer")
    token = await login_and_get_token("agent@test.com", "pass", "writer")

    chat_payload = {"messages": [{"role": "user", "content": "Hello"}]}

    class FakeAgent:
        world_id = 1
        personality = "kind"
        vector_db_update_date = datetime.now(timezone.utc)

    async def fake_chat(session, agent_id, messages):
        return "Hi"

    with patch("app.api.api_agent.get_agent", return_value=FakeAgent()), \
         patch("app.api.api_agent.chat_with_agent", side_effect=fake_chat):
        resp = await async_client.post(
            "/agents/1/chat",
            json=chat_payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["content"] == "Hi"


@pytest.mark.anyio
async def test_chat_history_saved(async_client, create_user, login_and_get_token, tmp_path):
    from app.config import settings

    settings.chat_history_dir = str(tmp_path / "{user_id}")

    user = await create_user("history@test.com", "pass", "writer")
    token = await login_and_get_token("history@test.com", "pass", "writer")

    payload = {"messages": [{"role": "user", "content": "Hello"}]}

    class FakeAgent:
        world_id = 1
        personality = "kind"
        vector_db_update_date = datetime.now(timezone.utc)

    async def fake_chat(session, agent_id, messages):
        return "Hi"

    with patch("app.api.api_agent.get_agent", return_value=FakeAgent()), \
         patch("app.api.api_agent.chat_with_agent", side_effect=fake_chat):
        resp = await async_client.post(
            "/agents/1/chat",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 200
    assert resp.json()["content"] == "Hi"

    hist_file = tmp_path / str(user["id"]) / "1.json"
    with open(hist_file) as f:
        data = json.load(f)
    assert data[-2:] == [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi"},
    ]

    resp = await async_client.get(
        "/agents/1/history",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["messages"][-1]["content"] == "Hi"


@pytest.mark.anyio
async def test_chat_test_endpoint(async_client, create_user, login_and_get_token):
    await create_user("agent@test2.com", "pass", "writer")
    token = await login_and_get_token("agent@test2.com", "pass", "writer")

    payload = {"messages": [{"role": "user", "content": "Hello"}]}

    class FakeAgent:
        world_id = 1
        vector_db_update_date = datetime.now(timezone.utc)

    fake_docs = [{"document": "Doc1"}, {"document": "Doc2"}]

    with patch("app.api.api_agent.get_agent", return_value=FakeAgent()), \
         patch("app.api.api_agent.crud_vectordb.query_world", return_value=fake_docs):
        resp = await async_client.post(
            "/agents/1/chat_test",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 200
    assert resp.json()["documents"] == fake_docs


@pytest.mark.anyio
async def test_agent_crud(async_client, create_user, login_and_get_token):
    # Create world builder user and login
    await create_user("builder@test.com", "pass", "world builder")
    token = await login_and_get_token("builder@test.com", "pass", "world builder")

    # Create a game world
    gw_payload = {"name": "World", "system": "dnd", "description": "desc"}
    resp = await async_client.post(
        "/gameworlds/",
        json=gw_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    gw_id = resp.json()["id"]

    # Create agent
    agent_payload = {
        "name": "Guide",
        "logo": "logo",
        "personality": "kind",
        "task": "helper",
        "world_id": gw_id,
    }
    resp = await async_client.post(
        "/agents/",
        json=agent_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    agent_id = resp.json()["id"]

    # List agents
    resp = await async_client.get(
        "/agents/",
        params={"world_id": gw_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert any(a["id"] == agent_id for a in resp.json())

    # Update agent
    resp = await async_client.patch(
        f"/agents/{agent_id}",
        json={"name": "Guide2"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Guide2"

    # Delete agent
    resp = await async_client.delete(
        f"/agents/{agent_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["ok"] is True

