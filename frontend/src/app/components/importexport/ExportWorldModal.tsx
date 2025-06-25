"use client";
import { useEffect, useState } from "react";
import ModalContainer from "../template/modalContainer";
import { exportWorld, downloadBlob } from "../../lib/importExportAPI";
import { getGameWorlds } from "@/app/lib/gameworldsAPI";
import { getConcepts } from "../../lib/conceptsAPI";
import { getCharacteristics } from "../../lib/characteristicsAPI";
import { useAuth } from "../auth/AuthProvider";
import Image from "next/image";
import { Download } from "lucide-react";
import { useTranslation } from "@/app/hooks/useTranslation";

export default function ExportWorldModal({ open, onClose }) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [worlds, setWorlds] = useState([]);
  const [selectedWorldId, setSelectedWorldId] = useState("");
  const [concepts, setConcepts] = useState([]);
  const [characteristics, setCharacteristics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Fetch all worlds once modal opens
  useEffect(() => {
    if (open && token) {
      setWorlds([]);
      setSelectedWorldId("");
      setConcepts([]);
      setCharacteristics([]);
      setError("");
      setSuccess("");
      getGameWorlds(token)
        .then(setWorlds)
        .catch(() => setError("Could not load worlds."));
    }
  }, [open, token]);

  // When world is selected, fetch concepts and characteristics
  useEffect(() => {
    if (selectedWorldId && token) {
      setLoading(true);
      Promise.all([
        getConcepts(token, { gameworld_id: selectedWorldId }),
        getCharacteristics(token, { gameworld_id: selectedWorldId }),
      ])
        .then(([c, ch]) => {
          setConcepts(c);
          setCharacteristics(ch);
          setLoading(false);
        })
        .catch(() => {
          setConcepts([]);
          setCharacteristics([]);
          setLoading(false);
          setError("Could not load world details.");
        });
    } else {
      setConcepts([]);
      setCharacteristics([]);
    }
  }, [selectedWorldId, token]);

  async function handleExport() {
    setDownloading(true);
    setError("");
    setSuccess("");
    try {
      // Export: receives a ZIP Blob from backend!
      const blob = await exportWorld(token, selectedWorldId);
      const world = worlds.find((w) => w.id === Number(selectedWorldId));
      downloadBlob(
        blob,
        `world_${selectedWorldId}_${world?.name || "export"}.zip`
      );
      setSuccess(t("export_started"));
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(t("export_failed") + " " + err);
    } finally {
      setDownloading(false);
    }
  }

  if (!open) return null;

  return (
    <ModalContainer title={t("export_world")} onClose={onClose} className="max-w-xl">
      <div className="flex flex-col gap-5">
        <div>
          <label className="block mb-1 text-[var(--primary)] font-semibold">
            {t("select_world_export")}
          </label>
          <select
            value={selectedWorldId}
            onChange={(e) => setSelectedWorldId(e.target.value)}
            disabled={loading || downloading}
            className="w-full px-4 py-2 rounded-xl border border-[var(--primary)] bg-[var(--surface)] text-[var(--primary)] focus:outline-none"
          >
            <option value="">{t("choose_world")}</option>
            {worlds.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        {selectedWorldId && (
          <div className="rounded-xl border border-[var(--primary)]/10 p-3 bg-[var(--surface-variant)]/30 flex gap-4 items-start">
            {/* Logo if present */}
            <div className="pt-1">
              {worlds.find((w) => w.id === Number(selectedWorldId))?.logo && (
                <Image
                  src={worlds.find((w) => w.id === Number(selectedWorldId)).logo}
                  alt="World Logo"
                  width={400}
                  height={400}
                  className="rounded shadow bg-white border object-contain"
                />
              )}
            </div>
            <div className="flex-1">
              <div className="font-bold text-[var(--primary)] text-lg">
                {worlds.find((w) => w.id === Number(selectedWorldId))?.name}
              </div>
              <div className="text-xs text-[var(--foreground)]/60">
                <b>Concepts:</b> {concepts.length} &nbsp;&nbsp;
                <b>Characteristics:</b> {characteristics.length}
              </div>
              <div className="text-xs mt-2 text-[var(--primary)]/80 italic">
                <b>{t("export_includes")}</b>
                <ul className="list-disc ml-6 text-xs mt-1">
                  <li>
                    {t("export_structure")}
                  </li>
                  <li>
                    <span className="text-[var(--primary)]">{t("export_images")}</span>
                  </li>
                  <li>
                    <span className="text-[var(--primary)]">{t("export_zip_file")}</span>
                  </li>
                </ul>
                <span className="block mt-2 text-[var(--primary)]/60">
                  <b>{t("export_no_pages")}</b>
                </span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 rounded px-4 py-2 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-xl shadow text-sm">
            {success}
          </div>
        )}
        {/* Actions */}
        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
          className="px-5 py-2 rounded-xl font-semibold bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 border transition"
          onClick={onClose}
          disabled={downloading}
        >
            {t("cancel")}
        </button>
          <button
            type="button"
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold shadow transition border
              ${downloading || !selectedWorldId
                ? "bg-[var(--primary)]/10 text-[var(--primary)]/60 cursor-not-allowed"
                : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent)] hover:text-[var(--background)]"
              }`}
            onClick={handleExport}
            disabled={downloading || !selectedWorldId}
          >
            <Download className="w-5 h-5" />
            {downloading ? t("exporting") : t("export_world_button")}
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}
