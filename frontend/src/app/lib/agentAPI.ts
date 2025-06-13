import { API_URL } from "./config";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function getAgents(
  token: string,
  params: { world_id?: number } = {}
) {
  const query = new URLSearchParams();
  if (params.world_id !== undefined)
    query.append("world_id", params.world_id.toString());
  const res = await fetch(`${API_URL}/agents/?${query.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Could not fetch agents");
  return await res.json();
}

export async function createAgent(data: unknown, token: string) {
  const res = await fetch(`${API_URL}/agents/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function updateAgent(id: number, data: unknown, token: string) {
  const res = await fetch(`${API_URL}/agents/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function deleteAgent(id: number, token: string) {
  const res = await fetch(`${API_URL}/agents/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function chatWithAgent(
  agentId: number,
  messages: ChatMessage[],
  token: string
) {
  const res = await fetch(`${API_URL}/agents/${agentId}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) throw await res.text();

  const data = await res.json();
  return data.content || "";
}

export async function chatTest(
  agentId: number,
  messages: ChatMessage[],
  token: string
) {
  const res = await fetch(`${API_URL}/agents/${agentId}/chat_test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}
