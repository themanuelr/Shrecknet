import { API_URL } from "./config";
import type { ChatMessage, SourceLink } from "./agentAPI";
export type { ChatMessage };

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

export async function uploadSourceFile(agentId: number, name: string, file: File, token: string) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("file", file);
  const res = await fetch(`${API_URL}/specialist_agents/${agentId}/source_file`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
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

export async function chatWithSpecialist(
  agentId: number,
  messages: ChatMessage[],
  token: string
) {
  const res = await fetch(`${API_URL}/specialist_agents/${agentId}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw await res.text();
  return (await res.json()) as { answer: string; sources: SourceLink[] };
}

export async function getSpecialistHistory(agentId: number, token: string) {
  const res = await fetch(`${API_URL}/specialist_agents/${agentId}/history`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw await res.text();
  const data = await res.json();
  return data.messages || [];
}

export async function clearSpecialistHistory(agentId: number, token: string) {
  const res = await fetch(`${API_URL}/specialist_agents/${agentId}/history`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw await res.text();
  return await res.json();
}

export async function exportVectorDB(agentId: number, token: string) {
  const res = await fetch(`${API_URL}/specialist_agents/${agentId}/export_vectordb`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw await res.text();
  return await res.blob();
}

export async function importVectorDB(agentId: number, file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/specialist_agents/${agentId}/import_vectordb`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw await res.text();
  return await res.json();
}
