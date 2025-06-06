import pytest

WORLD_BUILDER = {    
    "nickname": "builder",
    "email": "wb1@example.com",
    "password": "secret123",
    "role": "world builder",
    "image_url":"no image"
}

PLAYER = {    
    "nickname": "player",
    "email": "player11@example.com",
    "password": "secret123",
    "role": "player",    
    "image_url":"no image"
}

WRITER = {    
    "nickname": "writer",    
    "email": "writer11@example.com",
    "password": "secret123",
    "role": "writer",    
    "image_url":"no image"
}

@pytest.mark.anyio
async def register_and_login(async_client, user_data):
    # Register user
    resp = await async_client.post("/user/", json=user_data)
    assert resp.status_code == 200, resp.text
    # Login
    resp = await async_client.post("/user/login", data={
        "username": user_data["email"], "password": user_data["password"]
    })
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return token

@pytest.mark.anyio
async def test_gameworld_create_and_rbac(async_client, create_user, login_and_get_token):
   
    wb_token = await register_and_login(async_client, WORLD_BUILDER)
    writer_token = await register_and_login(async_client, WRITER)
    player_token = await register_and_login(async_client, PLAYER)

    # print (f"WB Token: {wb_token}")

    # resp = await async_client.get("/users/me", headers={"Authorization": f"Bearer {wb_token}"})
    # print (f"RESP FROM ME: {resp.json()}")


    gameworld_payload = {"name": "Forgotten Realms", "system":"dnd", "description":"Not much!", "logo":"Logo url"}

    # Only world builder can create gameworld
    resp = await async_client.post("/gameworlds/", json=gameworld_payload, headers={"Authorization": f"Bearer {wb_token}"})
    
    assert resp.status_code == 200
    gameworld = resp.json()
    assert gameworld["name"] == "Forgotten Realms"
    gw_id = gameworld["id"]

    # Writer cannot create gameworld
    resp = await async_client.post(
        "/gameworlds/",
        json=gameworld_payload,
        headers={"Authorization": f"Bearer {writer_token}"}
    )
    assert resp.status_code == 403

    # Player cannot create gameworld
    resp = await async_client.post(
        "/gameworlds/",
        json=gameworld_payload,
        headers={"Authorization": f"Bearer {player_token}"}
    )
    assert resp.status_code == 403

    # Any logged-in user can list gameworlds
    resp = await async_client.get(
        "/gameworlds/",
        headers={"Authorization": f"Bearer {player_token}"}
    )
    assert resp.status_code == 200
    worlds = resp.json()
    assert any(gw["name"] == "Forgotten Realms" for gw in worlds)

    # Any logged-in user can get specific gameworld by id
    resp = await async_client.get(
        f"/gameworlds/{gw_id}",
        headers={"Authorization": f"Bearer {writer_token}"}
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Forgotten Realms"

    # Update gameworld (only world builder)
    resp = await async_client.patch(
        f"/gameworlds/{gw_id}",
        json={"name": "Forgotten Realms Revised"},
        headers={"Authorization": f"Bearer {wb_token}"}
    )

    print (f"RESP: {resp.json()}")
    
    assert resp.status_code == 200
    assert resp.json()["name"] == "Forgotten Realms Revised"

    # Writer cannot update
    resp = await async_client.patch(
        f"/gameworlds/{gw_id}",
        json={"name": "Writer's World"},
        headers={"Authorization": f"Bearer {writer_token}"}
    )
    assert resp.status_code == 403

    # Delete gameworld (only world builder)
    resp = await async_client.delete(
        f"/gameworlds/{gw_id}",
        headers={"Authorization": f"Bearer {wb_token}"}
    )
    assert resp.status_code == 200
    assert resp.json()["ok"] is True

    # Now it should be gone
    resp = await async_client.get(
        f"/gameworlds/{gw_id}",
        headers={"Authorization": f"Bearer {wb_token}"}
    )
    assert resp.status_code == 404

    # Player cannot delete (should be 403)
    # Let's re-create for this check
    resp = await async_client.post(
        "/gameworlds/",
        json=gameworld_payload,
        headers={"Authorization": f"Bearer {wb_token}"}
    )
    gw_id_new = resp.json()["id"]
    resp = await async_client.delete(
        f"/gameworlds/{gw_id_new}",
        headers={"Authorization": f"Bearer {player_token}"}
    )
    assert resp.status_code == 403