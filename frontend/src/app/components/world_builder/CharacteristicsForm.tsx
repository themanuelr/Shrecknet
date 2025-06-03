"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Combobox } from "@headlessui/react";
import { uploadImage } from "../../lib/uploadImage";
import { M3FloatingInput } from "../template/M3FloatingInput";
import { FileText, Hash, ImageIcon, File, Video, FileAudio, Link2, Calendar, BookOpen, List, Dot, Info } from "lucide-react";

// Add the new type here, with a different value ("foundry"):
const TYPE_OPTIONS = [
  { value: "text",     label: "Text",         icon: FileText,   subtitle: "Free text field" },
  { value: "numeric",  label: "Number",       icon: Hash,       subtitle: "Integer or decimal" },
  { value: "image",    label: "Image",        icon: ImageIcon,  subtitle: "Upload or link image" },
  { value: "pdf",      label: "PDF",          icon: File,       subtitle: "Upload a PDF file" },
  { value: "video",    label: "Video",        icon: Video,      subtitle: "YouTube/Vimeo URL" },
  { value: "audio",    label: "Audio",        icon: FileAudio,  subtitle: "Spotify, Soundcloud, etc." },
  { value: "link",     label: "Link",         icon: Link2,      subtitle: "URL to any website" },
  { value: "date",     label: "Date",         icon: Calendar,   subtitle: "Select a date" },  
  { value: "foundry",  label: "Foundry Character Sheet", icon: File, subtitle: "Upload on the value screen (.json)" },
  { value: "page_ref", label: "Page Reference", icon: BookOpen, subtitle: "Link to other pages" }
];

// --- MD3 Segmented Chip Selector (Single/List)
function ChipSelector({ value, onChange, disabled }) {
  return (
    <div className="flex gap-2 mt-2">
      <button
        type="button"
        className={`flex items-center gap-1 px-4 py-1.5 rounded-full border text-sm transition font-semibold
          ${!value ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow" : "bg-[var(--surface-variant)] text-[var(--primary)] border-[var(--primary)]/30"}
          hover:bg-[var(--primary)]/10
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
        `}
        onClick={() => onChange(false)}
        disabled={disabled}
      >
        <Dot className="w-4 h-4" />
        Single value
      </button>
      <button
        type="button"
        className={`flex items-center gap-1 px-4 py-1.5 rounded-full border text-sm transition font-semibold
          ${value ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow" : "bg-[var(--surface-variant)] text-[var(--primary)] border-[var(--primary)]/30"}
          hover:bg-[var(--primary)]/10
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
        `}
        onClick={() => onChange(true)}
        disabled={disabled}
      >
        <List className="w-4 h-4" />
        List of values
      </button>
    </div>
  );
}

// --- Helper: upload characteristic logo
async function uploadCharacteristicLogo(file, charName) {
  const safeCharName = charName.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "new_characteristic";
  const customFileName = "characteristic_logo";
  return await uploadImage(file, "characteristics", safeCharName, customFileName);
}

export default function CharacteristicForm({
  initialData,
  onSubmit,
  loading,
  onCancel,
  concepts = [],
}) {
  const isEditMode = !!initialData;

  const initialFormState = {
    name: initialData?.name || "",
    type: initialData?.type || "text",
    is_list: initialData?.is_list ?? false,
    logoUrl: initialData?.logo || "",
    logo: null,
    ref_concept_id: initialData?.ref_concept_id ?? null,
  };
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [conceptFilter, setConceptFilter] = useState("");
  const [success, setSuccess] = useState("");

  // Concept filtering for the page_ref type
  const filteredConcepts = Array.isArray(concepts)
    ? (!conceptFilter
        ? concepts
        : concepts.filter(c => c.name.toLowerCase().includes(conceptFilter.toLowerCase())))
    : [];

  useEffect(() => {
    setForm({
      name: initialData?.name || "",
      type: initialData?.type || "text",
      is_list: initialData?.is_list ?? false,
      logoUrl: initialData?.logo || "",
      logo: null,
      ref_concept_id: initialData?.ref_concept_id ?? null,
    });
    setError("");
    setConceptFilter("");
  }, [initialData]);

  // --- Type grid click handler
  const handleTypeSelect = (type) => {
    setForm(f => ({
      ...f,
      type,
      ref_concept_id: type === "page_ref" ? f.ref_concept_id : null
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.type) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.type === "page_ref" && !form.ref_concept_id) {
      setError("You must select which concept type this references.");
      return;
    }

    let logoUrl = form.logoUrl?.trim() || "/images/default/characteristics/logo.png";
    if (form.logo) {
      setUploading(true);
      try {
        logoUrl = await uploadCharacteristicLogo(form.logo, form.name);
        setForm(f => ({ ...f, logoUrl, logo: null }));
      } catch (err) {
        setError("Image upload failed: " + err.message);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    await onSubmit({
      name: form.name,
      type: form.type,
      is_list: form.is_list,
      logo: logoUrl,
      ref_concept_id: form.type === "page_ref" ? form.ref_concept_id : null,
    });

    // Reset form after creation if not editing
    if (!isEditMode) {
      setForm({
        name: "",
        type: "text",
        is_list: false,
        logoUrl: "",
        logo: null,
        ref_concept_id: null,
      });
      setSuccess("Characteristic created!");
      setTimeout(() => setSuccess(""), 1400);
    }
  }

  // --- Get logo for preview (show default if empty) ---
  const logoPreview = form.logoUrl?.trim() || "/images/default/characteristics/logo.png";

  return (
    <form
      className="flex flex-col gap-10 w-full max-w-2xl mx-auto mt-3 bg-[var(--surface)]/70 p-8 rounded-2xl border border-[var(--primary)]/10 shadow-lg"
      onSubmit={handleSubmit}
      autoComplete="off"
      style={{ minWidth: "350px", width: "100%" }}
    >
      {/* Title */}
      <div className="flex items-center gap-3 mb-2">
        <Info className="w-6 h-6 text-[var(--primary)]" />
        <span className="text-2xl font-bold text-[var(--primary)]">Create/Edit Characteristic</span>
      </div>
      {error && (
        <div className="w-full bg-red-100 border border-red-300 rounded p-2 text-red-700 text-sm text-center mb-2">
          {error}
        </div>
      )}
      {success && (
        <div className="w-full bg-green-100 border border-green-300 rounded p-2 text-green-700 text-sm text-center mb-2">
          {success}
        </div>
      )}

      {/* Name field */}
      <div>
        <M3FloatingInput
          label="Characteristic Name"
          name="name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          maxLength={50}
          disabled={loading || uploading}
          autoFocus
        />
      </div>

      {/* Single/List chip selector */}
      <div>
        <span className="block font-semibold text-[var(--primary)] mb-1">Cardinality</span>
        <span className="text-xs text-[var(--primary)]/70 mb-1">Should this characteristic allow a single value or a list?</span>
        <ChipSelector
          value={form.is_list}
          onChange={val => setForm(f => ({ ...f, is_list: val }))}
          disabled={loading || uploading}
        />
      </div>

      {/* Type selection: Icon grid */}
      <div>
        <span className="block font-semibold text-[var(--primary)] mb-2">Data Type</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {TYPE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const selected = form.type === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => handleTypeSelect(opt.value)}
                className={`
                  flex flex-col items-center justify-center gap-1 p-4 rounded-2xl border
                  text-[var(--primary)]
                  ${selected ? "bg-[var(--primary)]/10 border-[var(--primary)] shadow" : "bg-[var(--surface-variant)] border-[var(--primary)]/20"}
                  hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/40 transition
                  focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
                  cursor-pointer
                  min-h-[92px]
                `}
                disabled={loading || uploading}
                title={opt.subtitle}
              >
                <Icon className={`w-6 h-6 ${selected ? "text-[var(--primary)]" : "text-[var(--primary)]/70"}`} />
                <span className="text-base font-medium">{opt.label}</span>
                <span className="text-xs text-[var(--primary)]/60 mt-1">{opt.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Concept selector for page_ref */}
      {form.type === "page_ref" && (
        <div>
          <span className="block font-semibold text-[var(--primary)] mb-1">Reference Concept</span>
          <Combobox
            value={form.ref_concept_id ?? ""}
            onChange={val => setForm(f => ({ ...f, ref_concept_id: val }))}
          >
            <div className="relative">
              <Combobox.Input
                className="w-full rounded-xl border border-[var(--primary)] px-4 py-3 bg-[var(--surface-variant)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-base transition"
                placeholder="Search concepts..."
                onChange={e => setConceptFilter(e.target.value)}
                displayValue={(id) => {
                  const c = concepts.find(c => c.id === id);
                  return c ? c.name : "";
                }}
              />
              <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-[var(--surface-variant)] shadow-lg z-20 border border-[var(--primary)]">
                {filteredConcepts.length === 0 && (
                  <div className="px-4 py-2 text-[var(--primary)]/80">No concepts found.</div>
                )}
                {filteredConcepts.map(concept => (
                  <Combobox.Option key={concept.id} value={concept.id} className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-[var(--accent)]/20">
                    <Image
                      src={concept.logo || "/images/pages/concept/concept.png"}
                      alt=""
                      width={400}
                      height={400}
                      className="rounded border border-[var(--primary)] object-cover"
                    />
                    <span>{concept.name}</span>
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
          {form.ref_concept_id && (
            <div className="flex items-center gap-2 mt-2 ml-1">
              <Image
                src={
                  concepts.find(c => c.id === form.ref_concept_id)?.logo ||
                  "/images/pages/concept/concept.png"
                }
                alt=""
                width={400}
                height={400}
                className="rounded border border-[var(--primary)] object-cover"
              />
              <span className="font-semibold text-[var(--primary)]">
                {concepts.find(c => c.id === form.ref_concept_id)?.name || ""}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Logo Upload */}
      <div>
        <span className="block font-semibold text-[var(--primary)] mb-1">Characteristic Logo (optional)</span>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            name="logo"
            onChange={async e => {
              if (e.target.files && e.target.files[0]) {
                setUploading(true);
                try {
                  const uploadedUrl = await uploadCharacteristicLogo(e.target.files[0], form.name);
                  setForm(f => ({
                    ...f,
                    logo: null,
                    logoUrl: uploadedUrl,
                  }));
                } catch (err) {
                  setError("Image upload failed: " + err.message);
                }
                setUploading(false);
              }
            }}
            className="block w-full rounded-xl border border-[var(--primary)] px-2 py-2 bg-[var(--surface-variant)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
            disabled={loading || uploading}
          />
          <Image
            src={logoPreview}
            alt="Characteristic logo"
            width={400}
            height={400}
            className="rounded-lg border border-[var(--primary)] object-cover"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6">
        {onCancel && (
          <button
            type="button"
            className="px-6 py-2 bg-[var(--primary)]/10 text-[var(--primary)] font-semibold rounded-xl hover:bg-[var(--primary)]/20 transition text-base"
            onClick={onCancel}
            disabled={loading || uploading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-7 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold rounded-xl shadow hover:bg-[var(--accent)] hover:text-[var(--background)] transition text-base"
          disabled={loading || uploading}
        >
          {loading || uploading ? "Saving..." : initialData ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
