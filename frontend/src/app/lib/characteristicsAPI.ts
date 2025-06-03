// app/lib/characteristicsAPI.ts
import { API_URL } from "./config";

// GET all characteristics for a world (requires token)
export async function getCharacteristics(token: string, params: { gameworld_id: number }) {
  const query = new URLSearchParams();
  query.append("gameworld_id", params.gameworld_id.toString());
  const res = await fetch(`${API_URL}/characteristics/?${query.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Could not fetch characteristics");
  return await res.json();
}

// GET a specific characteristic
export async function getCharacteristic(id: number, token: string) {
  const res = await fetch(`${API_URL}/characteristics/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Characteristic not found");
  return await res.json();
}

// CREATE characteristic
export async function createCharacteristic(data: unknown, token: string) {

  console.log("Submitting characteristic with token:", token);

  const res = await fetch(`${API_URL}/characteristics/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// UPDATE characteristic
export async function updateCharacteristic(id: number, data: unknown, token: string) {
  const res = await fetch(`${API_URL}/characteristics/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// DELETE characteristic
export async function deleteCharacteristic(id: number, token: string) {
  const res = await fetch(`${API_URL}/characteristics/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// ---- ConceptCharacteristicLink management ----

// ADD characteristic to a concept
export async function addCharacteristicLink(concept_id: number, characteristic_id: number, order: number, token: string) {
  const res = await fetch(`${API_URL}/characteristics/link/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ concept_id, characteristic_id, order }),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// UPDATE link order
export async function updateCharacteristicLinkOrder(concept_id: number, characteristic_id: number, order: number, token: string) {
  const res = await fetch(`${API_URL}/characteristics/link/`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ concept_id, characteristic_id, order }),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// REMOVE characteristic from a concept
export async function removeCharacteristicLink(concept_id: number, characteristic_id: number, token: string) {
  // Uses query params for DELETE (body-less)
  const query = new URLSearchParams();
  query.append("concept_id", concept_id.toString());
  query.append("characteristic_id", characteristic_id.toString());
  const res = await fetch(`${API_URL}/characteristics/link/?${query.toString()}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// GET all characteristics for a concept, ordered
export async function getCharacteristicsForConcept(concept_id: number, token: string) {
  const res = await fetch(`${API_URL}/characteristics/concept/${concept_id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Could not fetch characteristics for concept");
  return await res.json();
}
