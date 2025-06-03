// app/lib/gameworldAPI.ts
import { API_URL } from "./config";

// GET all worlds (requires token)
export async function getGameWorlds(token: string) {
  const res = await fetch(`${API_URL}/gameworlds/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Could not fetch worlds");
  return await res.json();
}

// GET a specific world (requires token)
export async function getGameWorld(id: number, token: string) {
  const res = await fetch(`${API_URL}/gameworlds/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("World not found");
  return await res.json();
}

// CREATE world (requires token)
export async function createGameWorld(data: unknown, token: string) {
  const res = await fetch(`${API_URL}/gameworlds/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// UPDATE world (requires token)
export async function updateGameWorld(id: number, data: unknown, token: string) {
  const res = await fetch(`${API_URL}/gameworlds/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// DELETE world (requires token)
export async function deleteGameWorld(id: number, token: string) {
  const res = await fetch(`${API_URL}/gameworlds/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}
