// app/lib/importExportAPI.ts
import { API_URL } from "./config";

// EXPORT world as ZIP (triggers a file download with images/logos via HTTP fetch)
export async function exportWorld(token: string, worldId: number): Promise<Blob> {
  // Get the origin of your frontend (e.g., https://yoursite.com)
  const frontendBaseUrl = window.location.origin;
  console.log("Front end: "+frontendBaseUrl)
  // Send as a query param
  const url = `${API_URL}/import_export/export/${worldId}?frontend_base_url=${encodeURIComponent(frontendBaseUrl)}`;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to export world");
  const blob = await res.blob();
  return blob;
}

// Helper: Trigger browser download of a blob with a given filename
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

// IMPORT world from a JSON file (send JSON, not FormData)
export async function importWorld(token: string, worldData: unknown): Promise<{ ok: boolean; new_world_id: number }> {
  const res = await fetch(`${API_URL}/import_export/import/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(worldData),
  });
  if (!res.ok) {
    let err;
    try { err = await res.json(); }
    catch { err = await res.text(); }
    throw err;
  }
  return await res.json();
}