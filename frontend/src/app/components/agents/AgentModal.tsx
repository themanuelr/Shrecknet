"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createAgent, updateAgent, deleteAgent } from "../../lib/agentAPI";
import { uploadImage } from "../../lib/uploadImage";
import { useAuth } from "../auth/AuthProvider";
import ModalContainer from "../template/modalContainer";
import { M3FloatingInput } from "../template/M3FloatingInput";

export default function AgentModal({ agent, onClose, onSave, onDelete, worlds }) {
  const { token } = useAuth();
  const isEdit = !!agent;
  const [form, setForm] = useState({
    name: "",
    logoUrl: "",
    logoFile: null as File | null,
    personality: "",
    task: "",
    world_id: worlds?.[0]?.id || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm({
      name: agent?.name || "",
      logoUrl: agent?.logo || "/uploads/default/avatars/logo.png",
      logoFile: null,
      personality: agent?.personality || "",
      task: agent?.task || "conversational",
      world_id: agent?.world_id || worlds?.[0]?.id || "",
    });
    setError("");
  }, [agent, worlds]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        logo: form.logoUrl,
        personality: form.personality,
        task: form.task,
        world_id: Number(form.world_id),
      };
      if (isEdit) {
        await updateAgent(agent.id, payload, token || "");
      } else {
        await createAgent(payload, token || "");
      }
      onSave?.();
    } catch (err) {
      setError(err?.detail || err?.message || "Failed to save agent");
      setSaving(false);
      return;
    }
    setSaving(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const worldId = form.world_id || worlds?.[0]?.id || "0";
      const safeName = (form.name || "agent")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 48);
      const url = await uploadImage(
        file,
        "agents",
        worldId.toString(),
        safeName || undefined
      );
      setForm(f => ({ ...f, logoUrl: url, logoFile: null }));
    } catch (err: any) {
      setError("Logo upload failed: " + (err?.message || err));
    }
    setUploading(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  async function handleDelete() {
    if (!isEdit) return;
    setSaving(true);
    setError("");
    try {
      await deleteAgent(agent.id, token || "");
      onDelete?.();
    } catch (err) {
      setError(err?.detail || err?.message || "Failed to delete agent");
      setSaving(false);
      return;
    }
    setSaving(false);
  }

  if (!worlds) return null;

  return (
    <ModalContainer title={isEdit ? "Edit Agent" : "Create Agent"} onClose={onClose}>
      {error && (
        <div className="bg-red-100 text-red-700 rounded-lg px-3 py-2 mb-3 text-sm">
          {error}
        </div>
      )}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <M3FloatingInput
          label="Name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
        
        <div>
          <label className="block text-[var(--primary)] font-semibold text-sm mb-1">
            Upload Logo
          </label>
          <input
            type="file"
            accept="image/*"
            ref={logoInputRef}
            onChange={handleLogoUpload}
            className="block w-full rounded-xl border border-[var(--primary)] px-2 py-2 bg-[var(--surface-variant)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
            disabled={saving || uploading}
          />
          
        </div>
        <M3FloatingInput
          label="Personality"
          value={form.personality}
          onChange={e => setForm(f => ({ ...f, personality: e.target.value }))}
        />
        <div className="relative">
          <select
            className="peer w-full px-4 pt-6 pb-2 text-[var(--foreground)] bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] transition-colors text-base"
            value={form.task}
            onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
            required
          >
            <option value="conversational">conversational</option>
            <option value="page writer">page writer</option>
            <option value="story novelist">story novelist</option>
          </select>
          <label className="absolute left-3 top-1.5 text-base text-[var(--primary)] font-semibold pointer-events-none">
            Task
          </label>
        </div>
        <div className="relative">
          <select
            className="peer w-full px-4 pt-6 pb-2 text-[var(--foreground)] bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] transition-colors text-base"
            value={form.world_id}
            onChange={e => setForm(f => ({ ...f, world_id: e.target.value }))}
            required
          >
            {worlds.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <label className="absolute left-3 top-1.5 text-base text-[var(--primary)] font-semibold pointer-events-none">
            World
          </label>
        </div>
        <div className="flex gap-3 mt-4 justify-end">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm"
              disabled={saving}
            >
              Delete
            </button>
          )}
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </ModalContainer>
  );
}
