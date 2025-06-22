"use client";
import { useState } from "react";
import ModalContainer from "../template/modalContainer";
import { exportVectorDB } from "../../lib/specialistAPI";
import { downloadBlob } from "../../lib/importExportAPI";
import { useAuth } from "../auth/AuthProvider";

export default function ExportVectorDBModal({ agent, onClose }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    setLoading(true);
    setError("");
    try {
      const blob = await exportVectorDB(agent.id, token || "");
      downloadBlob(blob, `agent_${agent.id}_vectordb.json`);
      onClose();
    } catch (err) {
      setError("Failed to export vector DB");
    } finally {
      setLoading(false);
    }
  }

  if (!agent) return null;

  return (
    <ModalContainer title="Export Vector DB" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--foreground)]">
          Download the vector database for <b>{agent.name}</b> as a JSON file.
        </p>
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-5 py-2 rounded-xl font-bold bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent)] transition"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? "Exporting..." : "Download"}
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
      </div>
    </ModalContainer>
  );
}
