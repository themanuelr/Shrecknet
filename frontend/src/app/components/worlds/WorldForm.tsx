import { useState, useEffect } from "react";
import Image from "next/image";
import { uploadImage } from "../../lib/uploadImage";
import { M3FloatingInput } from "../template/M3FloatingInput";
import { useTranslation } from "@/app/hooks/useTranslation";

async function uploadWorldLogo(file, worldName) {
  const safeWorldName = worldName.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "new_world";
  const customFileName = "world_logo";
  const imageUrl = await uploadImage(file, "worlds", safeWorldName, customFileName);
  // Append timestamp to bypass aggressive caching for the same filename
  return `${imageUrl}?t=${Date.now()}`;
}

export default function WorldForm({
  initialData,
  onSubmit,
  loading,
  error,        // <-- ADD THIS: parent error (from API/backend)
  worlds,
  onCancel,
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: initialData?.name || "",
    system: initialData?.system || "",
    description: initialData?.description || "",
    logoUrl: initialData?.logo || initialData?.logo_url || "",
    logo: null,
  });
  const [localError, setLocalError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Reset when editing a new world or closing
  useEffect(() => {
    setForm({
      name: initialData?.name || "",
      system: initialData?.system || "",
      description: initialData?.description || "",
      logoUrl: initialData?.logo || initialData?.logo_url || "",
      logo: null,
    });
    setLocalError("");
  }, [initialData]);

  function wordCount(html) {
    if (!html) return 0;
    return html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");
    // Local validation
    if (!form.name.trim() || !form.system.trim() || !form.description.trim()) {
      setLocalError(t("please_fill_fields"));
      return;
    }
    if (wordCount(form.description) > 50) {
      setLocalError(t("description_limit"));
      return;
    }
    if (
      (!initialData || form.name.trim().toLowerCase() !== initialData.name?.trim().toLowerCase()) &&
      (worlds || []).some(
        w => w.name.trim().toLowerCase() === form.name.trim().toLowerCase()
      )
    ) {
      setLocalError(t("duplicate_world"));
      return;
    }
    // Upload logo if a new file was picked
    let logoUrl = form.logoUrl || "/images/worlds/new_game.png";
    if (form.logo) {
      setUploading(true);
      try {
        logoUrl = await uploadWorldLogo(form.logo, form.name);
        setForm(f => ({ ...f, logo: null, logoUrl }));
      } catch (err) {
        setLocalError(t("image_upload_failed") + " " + err.message);
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    onSubmit({
      name: form.name,
      system: form.system,
      description: form.description,
      logo: logoUrl,
    });
  }

  return (
    <form
      className="flex flex-col gap-8 w-full"
      onSubmit={handleSubmit}
      autoComplete="off"
      style={{
        minWidth: "320px",
        maxWidth: "560px",
        width: "100%",
        margin: "0 auto",
      }}
    >
      {/* Error from parent (API/backend) or local */}
      {(error || localError) && (
        <div className="w-full bg-red-100 border border-red-300 rounded p-2 text-red-700 text-sm mb-2">
          {error || localError}
        </div>
      )}

      {/* World Name */}
      <M3FloatingInput
        label={t("world_name")}
        name="name"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        required
        disabled={loading || uploading}
        maxLength={60}
      />

      {/* Game System */}
      <M3FloatingInput
        label={t("game_system")}
        name="system"
        value={form.system}
        onChange={e => setForm(f => ({ ...f, system: e.target.value }))}
        required
        disabled={loading || uploading}
        maxLength={60}
        placeholder={t("game_system_placeholder")}
      />

      {/* Description */}
      <div>
        <span className="text-[var(--primary)] font-semibold text-base mb-2">{t("description_label")}</span>
        <textarea
          name="description"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full min-h-[80px] max-h-[210px] rounded-xl border-2 border-[var(--border)] px-4 py-3 bg-[var(--surface)] text-[var(--foreground)] placeholder-[var(--primary)]/60 focus:outline-none focus:border-[var(--primary)] text-base transition"
          placeholder={t("description_placeholder")}
          required
          disabled={loading || uploading}
          maxLength={4000}
        />
        <div className="text-xs text-right mt-1 text-[var(--primary)]/80">
          {wordCount(form.description)} / 50 words
        </div>
      </div>

      {/* Logo Upload */}
      <div>
        <span className="block text-[var(--primary)] font-semibold text-base mb-1">{t("world_logo")}</span>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            name="logo"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                setForm(f => ({
                  ...f,
                  logo: e.target.files[0],
                  logoUrl: URL.createObjectURL(e.target.files[0]),
                }));
              }
            }}
            className="block w-full rounded-xl border-2 border-[var(--primary)] px-2 py-2 bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition"
            disabled={loading || uploading}
          />
          {(form.logoUrl || form.logo) && (
            <Image
              src={form.logoUrl || "/images/default/worlds/logo.png"}
              alt="World logo"
              width={400}
              height={400}
              className="rounded-2xl border border-[var(--primary)] object-cover"
            />
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-6">
        <button
          type="button"
          className="px-6 py-2 bg-[var(--primary)]/10 text-[var(--primary)] font-semibold rounded-xl hover:bg-[var(--primary)]/20 transition text-lg"
          onClick={onCancel}
          disabled={loading || uploading}
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold rounded-xl shadow hover:bg-[var(--accent)] hover:text-[var(--background)] transition text-lg"
          disabled={loading || uploading}
        >
          {loading || uploading ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
