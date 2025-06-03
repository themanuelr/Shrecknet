// app/lib/conceptsAPI.ts
import { API_URL } from "./config";

// GET all concepts for a gameworld, with optional filters (requires token)
export async function getConcepts(
  token: string,
  params: {
    gameworld_id?: number;
    name?: string;
    auto_generated?: boolean;
    group?: string;
    display_on_world?: boolean;
  } = {}
) {
  const query = new URLSearchParams();
  if (params.gameworld_id !== undefined)
    query.append("gameworld_id", params.gameworld_id.toString());
  if (params.name) query.append("name", params.name);
  if (params.auto_generated !== undefined)
    query.append("auto_generated", params.auto_generated ? "true" : "false");
  if (params.group !== undefined && params.group !== null)
    query.append("group", params.group);
  if (params.display_on_world !== undefined)
    query.append("display_on_world", params.display_on_world ? "true" : "false");

  console.log("Query: "+query.toString())
  const res = await fetch(`${API_URL}/concepts/?${query.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Could not fetch concepts");
  return await res.json();
}

// GET a specific concept (requires token)
export async function getConcept(id: number, token: string) {
  const res = await fetch(`${API_URL}/concepts/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Concept not found");
  return await res.json();
}

// CREATE concept (requires token)
// Accepts all fields: name, group, display_on_world, etc.
export async function createConcept(data, token) {
  const res = await fetch(`${API_URL}/concepts/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// UPDATE concept (requires token)
export async function updateConcept(id: number, data: unknown, token: string) {
  const res = await fetch(`${API_URL}/concepts/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// DELETE concept (requires token)
export async function deleteConcept(id: number, token: string) {
  const res = await fetch(`${API_URL}/concepts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// GET all pages for a concept (optional RESTful alternative)
export async function getPagesForConcept(id: number, token: string) {
  console.log("Looking for id: "+ id)
  const res = await fetch(`${API_URL}/concepts/${id}/pages`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Could not fetch pages for concept");
  return await res.json();
}

// GET all unique groups for a world (useful for dropdowns/autocomplete)
export async function getConceptGroups(token: string, gameworld_id?: number) {
  const query = new URLSearchParams();
  if (gameworld_id !== undefined)
    query.append("gameworld_id", gameworld_id.toString());
  const res = await fetch(`${API_URL}/concepts/groups/?${query.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Could not fetch concept groups");
  return await res.json();
}
