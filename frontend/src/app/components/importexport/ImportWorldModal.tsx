"use client";
import { useState } from "react";
import ModalContainer from "../template/modalContainer";
import { importWorld } from "../../lib/importExportAPI";
import { uploadImage } from "../../lib/uploadImage";
import { useAuth } from "../auth/AuthProvider";
import { importWorldZip } from "../../lib/importWorldZip"; // <- your jszip helper
import Image from "next/image";
export default function ImportWorldModal({ open, onClose, onImported }) {
  const { token } = useAuth();  
  const [importData, setImportData] = useState<unknown>(null);
  const [editedWorld, setEditedWorld] = useState<unknown>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(""); // progress for ZIP handling

  function reset() {
    setImportData(null);
    setEditedWorld(null);
    setError("");
    setSuccess(false);
    setLogoUploading(false);
    setProgress("");
  }

  // Handle file selection & parse JSON or ZIP
  async function handleFileChange(e) {
    reset();
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      if (f.name.endsWith(".zip")) {
        setProgress("Reading ZIP file...");
        // 1. Extract and upload images, get world.json
        const jsonString = await importWorldZip(f);
        setProgress("Parsing world.json...");
        const data = JSON.parse(jsonString);
        setImportData(data);
        setEditedWorld(data.world ? { ...data.world } : null);
        setProgress("");
      } else if (f.name.endsWith(".json")) {
        setProgress("Reading JSON...");
        const text = await f.text();
        const data = JSON.parse(text);
        setImportData(data);
        setEditedWorld(data.world ? { ...data.world } : null);
        setProgress("");
      } else {
        throw new Error("File must be a .json or .zip");
      }
    } catch (err) {
      setError("Invalid file: " + err?.message);
      setImportData(null);
      setProgress("");
    }
  }

  // Update editable fields
  function handleEditField(field, value) {
    setEditedWorld((w) => ({ ...w, [field]: value }));
  }

  // Handle logo upload (optional override)
  async function handleLogoChange(e) {
    const imageFile = e.target.files?.[0];
    if (!imageFile || !editedWorld?.name) return;
    setLogoUploading(true);
    try {
      const url = await uploadImage(
        imageFile,
        "worlds",
        editedWorld.name,
        undefined
      );
      handleEditField("logo", url);
    } catch (err) {
      setError("Logo upload failed: " + err.message);
    } finally {
      setLogoUploading(false);
    }
  }

  // Submit: convert edited JSON to File, send to backend
  async function handleImport() {
    if (!importData || !editedWorld) return;
    setLoading(true);
    setError("");
    // Update world fields in importData
    const newData = { ...importData, world: { ...editedWorld } };
  
    try {
      await importWorld(token, newData); // <--- send the JSON object directly!
      setSuccess(true);
      setTimeout(() => {
        setLoading(false);
        if (onImported) onImported();
        reset();
      }, 1200);
    } catch (err) {
      setError(
        typeof err === "object" && err?.detail
          ? err.detail
          : "Failed to import world."
      );
      setLoading(false);
    }
  }

  if (!open) return null;

  const world = editedWorld || {};
  const concepts = importData?.concepts || [];
  const characteristics = importData?.characteristics || [];

  return (
    <ModalContainer
      title="Import World"
      onClose={onClose}
      className="max-w-2xl"
    >
      <form
        className="flex flex-col gap-6 w-full"
        onSubmit={e => { e.preventDefault(); handleImport(); }}
      >
        {/* File input */}
        <label className="text-[var(--primary)] font-semibold mb-1">
          Choose a .zip or .json file to import:
        </label>
        <input
          type="file"
          accept=".zip,.json,application/zip,application/json"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full rounded-xl border-2 border-[var(--primary)] px-4 py-2 bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition"
        />

        {/* Progress or error display */}
        {progress && (
          <div className="mb-2 px-3 py-2 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            {progress}
          </div>
        )}
        {error && (
          <div className="mb-2 px-3 py-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Editable Preview content */}
        {importData && editedWorld && (
          <div className="bg-[var(--surface-variant)]/60 rounded-xl border border-[var(--border)] px-4 py-3 mb-3">
            <div className="mb-2">
              <div className="font-semibold text-[var(--primary)] mb-1">World Info</div>
              <div className="pl-1 text-[var(--primary)]/90 text-sm grid gap-2">
                <div>
                  <b>Name:</b>{" "}
                  <input
                    type="text"
                    value={world.name || ""}
                    onChange={e => handleEditField("name", e.target.value)}
                    className="rounded px-2 py-1 bg-[var(--surface)] border border-[var(--primary)]/50 text-[var(--primary)] w-56"
                    disabled={loading}
                  />
                </div>
                <div>
                  <b>System:</b>{" "}
                  <input
                    type="text"
                    value={world.system || ""}
                    onChange={e => handleEditField("system", e.target.value)}
                    className="rounded px-2 py-1 bg-[var(--surface)] border border-[var(--primary)]/50 text-[var(--primary)] w-56"
                    disabled={loading}
                  />
                </div>
                <div>
                  <b>Description:</b>{" "}
                  <textarea
                    value={world.content || ""}
                    onChange={e => handleEditField("content", e.target.value)}
                    className="rounded px-2 py-1 bg-[var(--surface)] border border-[var(--primary)]/50 text-[var(--primary)] w-full min-h-[32px]"
                    disabled={loading}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <b>Logo:</b>
                  {world.logo && (
                    <Image
                    width={400}
                    height={400}
                    src={world.logo}
                    alt="Logo preview"
                    className="h-16 rounded shadow border mb-1 bg-white object-contain" />

                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    disabled={loading || logoUploading}
                    className="block rounded bg-[var(--surface)] px-2 py-1 border border-[var(--primary)]/50 text-[var(--primary)]"
                  />
                  {logoUploading && <span className="text-xs text-[var(--primary)]">Uploading...</span>}
                  <span className="text-xs">{world.logo}</span>
                </div>
                <div>
                  <b>Concepts:</b> {concepts.length} &nbsp; <b>Characteristics:</b> {characteristics.length}
                </div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-[var(--primary)] mb-1">Concepts & Characteristics</div>
              <div className="max-h-48 overflow-y-auto border border-[var(--primary)]/10 rounded p-2 bg-[var(--background)]/10">
                <ul className="list-disc ml-5 text-[var(--primary)]/80 text-sm">
                  {concepts.map((concept, idx) => (
                    <li key={idx} className="mb-1">
                      <b>{concept.name}</b>
                      <ul className="ml-6 text-xs">
                        {(concept.characteristics || []).map((cc, i) => {
                          const c = characteristics.find(ch => ch.id === cc.characteristic_id);
                          return (
                            <li key={i}>
                              {c ? c.name : `Characteristic #${cc.characteristic_id}`}
                              {cc.display_type ? (
                                <span className="ml-2 text-[var(--primary)]/60">({cc.display_type})</span>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-end mt-4">
          <button
            type="button"
            className="px-6 py-2 rounded-xl font-semibold bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition"
            onClick={() => { reset(); onClose(); }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-xl font-bold bg-[var(--primary)] text-[var(--primary-foreground)] shadow hover:bg-[var(--accent)] hover:text-[var(--background)] transition"
            disabled={loading || !importData}
          >
            {loading
              ? "Importing..."
              : success
              ? "Imported!"
              : "Confirm Import"
            }
          </button>
        </div>
        <div className="text-xs mt-2 text-[var(--primary)]/60">
          World creator and creation date will be set to the importing user/time.
        </div>
      </form>
    </ModalContainer>
  );
}
