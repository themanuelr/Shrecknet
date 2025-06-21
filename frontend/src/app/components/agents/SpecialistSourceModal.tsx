"use client";
import { useState, useRef } from "react";
import ModalContainer from "../template/modalContainer";
import { M3FloatingInput } from "../template/M3FloatingInput";
import { uploadFile } from "../../lib/uploadFile";
import { addSource, deleteSource, SpecialistSource } from "../../lib/specialistAPI";
import { useAuth } from "../auth/AuthProvider";

export default function SpecialistSourceModal({ agentId, source, onClose, onSaved }) {
  const { token } = useAuth();
  const isEdit = !!source;
  const [form, setForm] = useState<SpecialistSource>({
    name: source?.name || "",
    type: source?.type || "link",
    path: source?.path,
    url: source?.url,
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<SpecialistSource> = {
        name: form.name,
        type: form.type,
      };
      if (form.type === "link") {
        payload.url = form.url;
      } else if (file) {
        const safeName = form.name?.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "source";
        const ext = file.name.split('.').pop();
        const uploaded = await uploadFile(file, `ai_specialist/${agentId}`, safeName);
        const relPath = uploaded.replace(/^\/uploads\//, "");
        payload.path = relPath.startsWith("ai_specialist") ? relPath : `ai_specialist/${agentId}/${safeName}.${ext}`;

        console.log("Payload path:" + payload.path)
      } else if (form.path) {
        payload.path = form.path;
      }
      await addSource(agentId, payload, token || "");
    } finally {
      setSaving(false);
      onSaved?.();
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !source?.id) return;
    setSaving(true);
    try {
      await deleteSource(agentId, source.id, token || "");
    } finally {
      setSaving(false);
      onSaved?.();
      onClose();
    }
  };

  return (
    <ModalContainer title={isEdit ? "Edit Source" : "Add Source"} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <M3FloatingInput
          label="Name"
          value={form.name || ""}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
        <div className="relative">
          <select
            className="peer w-full px-4 pt-6 pb-2 text-[var(--foreground)] bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] transition-colors text-base"
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          >
            <option value="link">link</option>
            <option value="file">file</option>
          </select>
          <label className="absolute left-3 top-1.5 text-base text-[var(--primary)] font-semibold pointer-events-none">
            Type
          </label>
        </div>
        {form.type === "link" ? (
          <M3FloatingInput
            label="URL"
            value={form.url || ""}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            required
          />
        ) : (
          <div>
            <label className="block text-[var(--primary)] font-semibold text-sm mb-1">File</label>
            <input
              type="file"
              ref={fileRef}
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-[var(--primary)] px-2 py-2 bg-[var(--surface-variant)] text-[var(--foreground)] focus:outline-none"
            />
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          {isEdit && (
            <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm" disabled={saving}>
              Delete
            </button>
          )}
          <button type="submit" className="px-5 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </ModalContainer>
  );
}
