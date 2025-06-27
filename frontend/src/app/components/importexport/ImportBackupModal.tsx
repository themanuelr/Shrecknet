"use client";
import { useState } from "react";
import ModalContainer from "../template/modalContainer";
import { importBackup } from "../../lib/backupAPI";
import { useAuth } from "../auth/AuthProvider";
import { useTranslation } from "@/app/hooks/useTranslation";

export default function ImportBackupModal({ open, onClose, onImported }) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      await importBackup(token, file);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onImported) onImported();
        onClose();
      }, 1500);
    } catch (err) {
      setError(t("backup_failed"));
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <ModalContainer title={t("import_backup")} onClose={onClose} className="max-w-md">
      <div className="flex flex-col gap-4">
        <input
          type="file"
          accept=".zip"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="block w-full rounded-xl border-2 border-[var(--primary)] px-4 py-2 bg-[var(--surface)] text-[var(--foreground)]"
        />
        {error && <div className="text-red-700 text-sm">{error}</div>}
        {success && <div className="text-[var(--primary)] text-sm">{t("backup_imported")}</div>}
        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            className="px-5 py-2 rounded-xl font-semibold bg-[var(--primary)]/10 text-[var(--primary)]"
            onClick={onClose}
            disabled={loading}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            className="px-5 py-2 rounded-xl font-bold bg-[var(--primary)] text-[var(--primary-foreground)]"
            onClick={handleImport}
            disabled={loading || !file}
          >
            {loading ? t("backup_importing") : t("confirm_import")}
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}
