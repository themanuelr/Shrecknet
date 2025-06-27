import { API_URL } from "./config";

export async function createBackup(token: string): Promise<Blob> {
  const res = await fetch(`${API_URL}/backup/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to create backup");
  return await res.blob();
}

export async function importBackup(token: string, file: File): Promise<{ ok: boolean }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/backup/import`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to import backup");
  return await res.json();
}
