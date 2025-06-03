import pytest

@pytest.mark.anyio
async def test_user_registration_and_login(async_client, create_user, login_and_get_token):
    # Register user
    user = await create_user("writer@test.com", "pass123", "writer")
    assert user["email"] == "writer@test.com"

    # Login
    token = await login_and_get_token("writer@test.com", "pass123", "writer")
    assert token

    # Authenticated endpoint
    resp = await async_client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "writer@test.com"

@pytest.mark.anyio
async def test_protected_route_requires_login(async_client):
    resp = await async_client.get("/users/me")
    assert resp.status_code == 401

@pytest.mark.anyio
async def test_role_restriction(async_client, create_user, login_and_get_token):
    
    user = await create_user("player@test.com", "pass123", "player")
    assert user["email"] == "player@test.com"

    token = await login_and_get_token("player@test.com", "pass123", "player")
    # Try to create a gameworld (needs World Builder)
    resp = await async_client.post("/gameworlds/", json={"name": "World1"}, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403  # Forbidden for 'player'