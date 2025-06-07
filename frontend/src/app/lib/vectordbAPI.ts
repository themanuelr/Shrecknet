import { API_URL } from "./config";

export async function rebuildVectorDB(token: string, worldId: number) {
  const res = await fetch(`${API_URL}/vectordb/${worldId}/rebuild`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let err;
    try { err = await res.json(); }
    catch { err = await res.text(); }
    throw err;
  }
  return await res.json();
}
