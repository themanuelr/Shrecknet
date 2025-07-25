"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { uploadImage } from "@/app/lib/uploadImage";
import ConceptCharacteristicsEditor from "./ConceptCharacteristicsEditor";
import { M3FloatingInput } from "../template/M3FloatingInput";
import { createConcept, updateConcept } from "@/app/lib/conceptsAPI";
import { useAuth } from "../auth/AuthProvider";
import { getCharacteristicsForConcept } from "@/app/lib/characteristicsAPI";
import {
  Info,
  Image as LucideImage,
  ClipboardList,
  Bot,
  Settings2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

// --- Toggle with global CSS class ---
function M3Switch({ checked, onChange, label, disabled, icon: Icon }) {
  return (
    <label className="flex items-center gap-3 select-none cursor-pointer text-[var(--primary)]">
      {Icon && <Icon className="w-5 h-5 mr-1" />}
      <span className="text-sm font-semibold">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="toggle ml-4"
      />
    </label>
  );
}

export default function ConceptForm({
  initialData = null,
  allCharacteristics = [],
  onSuccess,
  mode = "edit",
  world,
  loading: loadingProp = false,
  onCancel,
}) {
  const { token } = useAuth();

  // --- Logo input ref ---
  const logoInputRef = useRef(null);

  // Main form state
  const emptyForm = {
    name: "",
    group: "",
    description: "",
    logoUrl: "",
    logo: null,
    autoGenerated: false,
    autoGeneratedPrompt: "",
    displayOnWorld: false,
  };

  const [form, setForm] = useState(
    initialData
      ? {
          name: initialData.name || "",
          group: initialData.group || "",
          description: initialData.description || "",
          logoUrl: initialData.logo || "",
          logo: null,
          autoGenerated: initialData.auto_generated ?? false,
          autoGeneratedPrompt: initialData.auto_generated_prompt ?? "",
          displayOnWorld: initialData.display_on_world ?? false,
        }
      : emptyForm
  );

  // Characteristic links
  const [characteristicLinks, setCharacteristicLinks] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hydrate on initialData change
  useEffect(() => {
    async function hydrateLinks() {
      setForm(
        initialData
          ? {
              name: initialData.name || "",
              group: initialData.group || "",
              description: initialData.description || "",
              logoUrl: initialData.logo || "",
              logo: null,
              autoGenerated: initialData.auto_generated ?? false,
              autoGeneratedPrompt: initialData.auto_generated_prompt ?? "",
              displayOnWorld: initialData.display_on_world ?? false,
            }
          : emptyForm
      );
      // --- Always clear logo file input when switching ---
      if (logoInputRef.current) logoInputRef.current.value = "";

      if (!initialData?.id || !token) {
        setCharacteristicLinks([]);
        return;
      }
      try {
        const enriched = await getCharacteristicsForConcept(initialData.id, token);
        setCharacteristicLinks(enriched.map((char) => ({
          ...char,
          characteristic_id: char.id,
          display_type: char.display_type || "body",
          order: char.order ?? 0,
        })));
      } catch (err) {
        console.error("Failed to load concept links:", err);
        setCharacteristicLinks([]);
      }
    }

    hydrateLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id, token]);

  function wordCount(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function safeConceptName(name) {
    return (name || "concept")
      .trim()
      .replace(/[^a-zA-Z0-9_\-]/g, "_")
      .slice(0, 48); // Limit length if needed
  }


  function safeConceptName(name) {
    return (name || "concept")
      .trim()
      .replace(/[^a-zA-Z0-9_\-]/g, "_")
      .slice(0, 48);
  }

  async function handleLogoUpload(e) {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      try {
        const conceptFolder = safeConceptName(form.name);
        const uploadedUrl = await uploadImage(
          e.target.files[0],
          "concepts",
          conceptFolder,
          "logo"
        );
        setForm(f => ({ ...f, logoUrl: uploadedUrl, logo: null }));
      } catch (err) {
        setError("Logo upload failed: " + (err?.message || err));
      }
      setUploading(false);
      // Always clear input after upload
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  // Reset form
  function resetFormAndLinks() {
    setForm(emptyForm);
    setCharacteristicLinks([]);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  // Submit logic
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!form.name.trim() || !form.description.trim()) {
      setError("Please fill in all fields.");
      setSaving(false);
      return;
    }
    if (wordCount(form.description) > 50) {
      setError("Description can't be more than 50 words.");
      setSaving(false);
      return;
    }
    if (form.name.length > 40) {
      setError("Name can't be more than 40 characters.");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name,
      group: form.group || null,
      description: form.description,
      logo: form.logoUrl?.trim() || "/images/default/concepts/logo.png", // <-- default here!
      auto_generated: form.autoGenerated,
      auto_generated_prompt: form.autoGenerated ? form.autoGeneratedPrompt : "",
      display_on_world: form.displayOnWorld,
      gameworld_id: world?.id,
      characteristic_links: characteristicLinks.map((l) => ({
        characteristic_id: l.characteristic_id,
        display_type: l.display_type,
        order: l.order,
      })),
    };

    try {
      if (mode === "new" || !initialData?.id) {
        await createConcept(payload, token);
        setSuccess("Concept created!");
        resetFormAndLinks(); // <--- clears form and resets logo input!
      } else {
        await updateConcept(initialData.id, payload, token);
        setSuccess("Concept updated!");
      }
      setTimeout(() => setSuccess(""), 1600);
      onSuccess?.();
    } catch (err) {
      setError(
        err?.detail || err?.message || "Failed to save concept"
      );
    }
    setSaving(false);
  }

  // ---- Layout: Carded, Iconic Regions ----
  return (
    <form
      className="flex flex-col gap-10 w-full max-w-3xl mx-auto mt-4"
      onSubmit={handleSubmit}
      autoComplete="off"
      style={{ minWidth: "420px", width: "100%" }}
    >
      {/* Error / Success */}
      {error && (
        <div className="flex items-center gap-2 bg-red-100 border border-red-300 rounded-xl p-3 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-100 border border-green-300 rounded-xl p-3 text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4" /> {success}
        </div>
      )}

      {/* --- Region: Basic Info --- */}
      <section className="bg-[var(--surface-variant)]/50 rounded-2xl shadow-sm border border-[var(--primary)]/10 px-6 pt-5 pb-7 flex flex-col gap-7">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-bold text-[var(--primary)] text-lg">Basic Info</span>
        </div>
        <div className="flex gap-8">
          <div className="flex flex-col flex-1 gap-3">
            <M3FloatingInput
              label="Concept Name"
              name="name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              maxLength={40}
              disabled={saving || uploading || loadingProp}
              autoFocus
            />
            <M3FloatingInput
              label="Group (optional)"
              name="group"
              value={form.group}
              onChange={e => setForm(f => ({ ...f, group: e.target.value }))}
              maxLength={40}
              disabled={saving || uploading || loadingProp}
              placeholder="e.g. Characters, Items, etc."
            />
          </div>
          <div className="flex flex-col items-center gap-3 min-w-[130px]">
            <label className="block text-[var(--primary)] font-semibold text-sm mb-1 flex items-center gap-1">
              <LucideImage className="w-4 h-4" /> Logo
            </label>
            <input
              type="file"
              accept="image/*"
              name="logo"
              ref={logoInputRef}
              onChange={handleLogoUpload}
              className="block rounded-xl border border-[var(--primary)] px-2 py-2 bg-[var(--surface-variant)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition w-24"
              disabled={saving || uploading || loadingProp}
            />
            <Image
              src={form.logoUrl?.trim() || "/images/default/concepts/logo.png"}
              alt="Concept logo"
              width={100}
              height={100}
              className="rounded-xl border-2 border-[var(--primary)] object-cover"
            />
          </div>
        </div>
      </section>

      {/* --- Region: Description --- */}
      <section className="bg-[var(--surface-variant)]/40 rounded-2xl shadow-sm border border-[var(--primary)]/10 px-6 py-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-bold text-[var(--primary)] text-lg">Description</span>
        </div>
        <textarea
          className="mt-1 block w-full rounded-xl border border-[var(--primary)] px-3 py-3 text-[var(--foreground)] bg-[var(--surface)] placeholder-[var(--primary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-base transition"
          placeholder="Describe this concept (max 50 words)"
          value={form.description}
          maxLength={400}
          rows={3}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          required
          disabled={saving || uploading || loadingProp}
        />
        <span className="text-xs text-[var(--primary)]/70 block mt-1 text-right">
          {wordCount(form.description)} / 50 words
        </span>
      </section>

      {/* --- Region: Advanced & Automation --- */}
      <section className="bg-[var(--surface-variant)]/40 rounded-2xl shadow-sm border border-[var(--primary)]/10 px-6 py-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <Settings2 className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-bold text-[var(--primary)] text-lg">Advanced</span>
        </div>
        <div className="flex gap-8">
          <M3Switch
            checked={form.displayOnWorld}
            onChange={e => setForm(f => ({ ...f, displayOnWorld: e.target.checked }))}
            label="Display on World Page"
            disabled={saving || uploading || loadingProp}
            icon={ClipboardList}
          />
          <M3Switch
            checked={form.autoGenerated}
            onChange={e => setForm(f => ({ ...f, autoGenerated: e.target.checked }))}
            label="Allow Chatbots (auto-generate pages)"
            disabled={saving || uploading || loadingProp}
            icon={Bot}
          />
        </div>
        {/* Animated reveal */}
        <div
          className={`overflow-hidden transition-all duration-300 ${form.autoGenerated ? "max-h-[200px] opacity-100 mt-3" : "max-h-0 opacity-0"}`}
        >
          <label className="text-[var(--primary)] font-semibold text-sm flex items-center gap-2">
            <Bot className="w-4 h-4" /> Auto-generation Prompt <span className="text-xs text-[var(--primary)]/60 ml-2">(optional)</span>
          </label>
          <textarea
            className="mt-1 block w-full rounded-xl border border-[var(--primary)] px-3 py-2 text-[var(--foreground)] bg-[var(--surface)] placeholder-[var(--primary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-base transition"
            placeholder="Give the AI context for auto-generated pages (optional)"
            value={form.autoGeneratedPrompt}
            maxLength={400}
            rows={2}
            onChange={e => setForm(f => ({ ...f, autoGeneratedPrompt: e.target.value }))}
            disabled={!form.autoGenerated || saving || uploading || loadingProp}
          />
        </div>
      </section>

      {/* --- Region: Characteristics --- */}
      <section className="bg-[var(--surface-variant)]/40 rounded-2xl shadow-sm border border-[var(--primary)]/10 px-6 py-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-bold text-[var(--primary)] text-lg">Characteristics & Their Sections</span>
        </div>
        <ConceptCharacteristicsEditor
          allCharacteristics={allCharacteristics}
          initialLinks={characteristicLinks}
          onChange={setCharacteristicLinks}
          disabled={saving || uploading || loadingProp}
        />
      </section>

      {/* --- Actions --- */}
      <div className="flex justify-end gap-4 pt-3">
        {onCancel && (
          <button
            type="button"
            className="px-6 py-2 bg-[var(--primary)]/10 text-[var(--primary)] font-semibold rounded-xl hover:bg-[var(--primary)]/20 transition text-base"
            onClick={onCancel}
            disabled={saving || uploading || loadingProp}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-7 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold rounded-xl shadow hover:bg-[var(--accent)] hover:text-[var(--background)] transition text-base flex items-center gap-2"
          disabled={saving || uploading || loadingProp}
        >
          {(saving || uploading || loadingProp) && <Loader2 className="animate-spin w-4 h-4" />}
          {saving || uploading || loadingProp
            ? "Saving..."
            : mode === "new" ? "Create Concept" : "Update Concept"}
        </button>
      </div>
    </form>
  );
}
