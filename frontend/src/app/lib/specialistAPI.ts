import { API_URL } from "./config";

export type SpecialistSource = {
  id?: number;
  agent_id?: number;
  name?: string;
  type: string;
  path?: string;
  url?: string;
  added_at?: string;
};

export async function listSources(agentId: number, token: string) {
  const res = await fetch(`${API_URL}/specialist_agents/${agentId}/sources`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw await res.text();
  return (await res.json()) as SpecialistSource[];
}

export async function addSource(agentId: number, data: Partial<SpecialistSource>, token: string) {
  const res = await fetch(`${API_URL}/specialist_agents/${agentId}/sources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.text();
  return (await res.json()) as SpecialistSource;
}

export async function deleteSource(agentId: number, sourceId: number, token: string) {
  const res = await fetch(`${API_URL}/specialist_agents/${agentId}/sources/${sourceId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw await res.text();
  return await res.json();
}

export async function startVectorJob(agentId: number, token: string) {
  const res = await fetch(`${API_URL}/specialist_agents/${agentId}/rebuild_vectors_async`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw await res.text();
  return await res.json();
}

export async function listVectorJobs(token: string) {
  const res = await fetch(`${API_URL}/specialist_agents/vector_jobs`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw await res.text();
  return await res.json();
}
