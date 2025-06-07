import { API_URL } from "./config";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function chatWithAgent(
  worldId: number,
  messages: ChatMessage[],
  token: string
) {
  const res = await fetch(`${API_URL}/agents/${worldId}/chat`, {
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
