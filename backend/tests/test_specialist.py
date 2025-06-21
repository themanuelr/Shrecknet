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
