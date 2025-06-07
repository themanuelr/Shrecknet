import pytest
from unittest.mock import patch

@pytest.mark.anyio
async def test_chat_endpoint(async_client, create_user, login_and_get_token):
    await create_user("agent@test.com", "pass", "writer")
    token = await login_and_get_token("agent@test.com", "pass", "writer")

    chat_payload = {"messages": [{"role": "user", "content": "Hello"}]}
    with patch("app.crud.crud_agent.openai.ChatCompletion.create") as mock_create, \
         patch("app.crud.crud_vectordb.query_world", return_value=[{"document": "info"}]):
        mock_create.return_value = {"choices": [{"message": {"content": "Hi"}}]}
        resp = await async_client.post(
            "/agents/1/chat",
            json=chat_payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["response"] == "Hi"

