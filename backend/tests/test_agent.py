import pytest
from unittest.mock import patch

@pytest.mark.anyio
async def test_chat_endpoint(async_client, create_user, login_and_get_token):
    await create_user("agent@test.com", "pass", "writer")
    token = await login_and_get_token("agent@test.com", "pass", "writer")

    chat_payload = {"messages": [{"role": "user", "content": "Hello"}]}
    with patch("app.crud.crud_agent.OpenAI") as MockOpenAI, \
         patch("app.crud.crud_vectordb.query_world", return_value=[{"document": "info"}]):
        mock_client = MockOpenAI.return_value
        class Response:
            choices = [type("Choice", (), {"message": type("Message", (), {"content": "Hi"})()})()]

        mock_client.chat.completions.create.return_value = Response()
        resp = await async_client.post(
            "/agents/1/chat",
            json=chat_payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["response"] == "Hi"


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

