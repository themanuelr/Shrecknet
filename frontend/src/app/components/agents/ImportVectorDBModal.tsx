"use client";
import { useState } from "react";
import ModalContainer from "../template/modalContainer";
import { importVectorDB } from "../../lib/specialistAPI";
import { useAuth } from "../auth/AuthProvider";

export default function ImportVectorDBModal({ agent, onClose, onImported }) {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleImport(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      await importVectorDB(agent.id, file, token || "");
      onImported?.();
      onClose();
    } catch (err) {
      setError("Failed to import vector DB");
    } finally {
      setLoading(false);
    }
  }

  if (!agent) return null;

  return (
    <ModalContainer title="Import Vector DB" onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleImport}>
        <p className="text-sm text-[var(--foreground)]">
          Replace <b>{agent.name}</b>'s vector database with data from a JSON file.
        </p>
        <input
          type="file"
          accept=".json,application/json"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="rounded-xl border border-[var(--primary)] px-3 py-2 bg-[var(--surface)] text-[var(--primary)]"
          disabled={loading}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl font-bold bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent)] transition"
            disabled={loading || !file}
          >
            {loading ? "Importing..." : "Import"}
          </button>
          <button
            type="button"
            className="px-5 py-2 rounded-xl font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--primary)]"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalContainer>
  );
}
