"use client";
import AuthGuard from "../components/auth/AuthGuard";
import DashboardLayout from "../components/DashboardLayout";
import { hasRole } from "../lib/roles";
import { useAuth } from "../components/auth/AuthProvider";
import { useState } from "react";
import ImportWorldModal from "../components/importexport/ImportWorldModal";
import { Download, Upload, Users2, Database } from "lucide-react";
import Link from "next/link";
import ExportWorldModal from "../components/importexport/ExportWorldModal";
import { useWorlds } from "../lib/userWorlds";
import { rebuildVectorDB } from "../lib/vectordbAPI";
import { getPagesForWorld } from "../lib/pagesAPI";

export default function UserManagementPage() {
  const { user, token } = useAuth();
  const { worlds } = useWorlds();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedWorldId, setSelectedWorldId] = useState("");
  const [vdbLoading, setVdbLoading] = useState(false);
  const [vdbProgress, setVdbProgress] = useState("");
  const [vdbError, setVdbError] = useState("");

  async function handleRebuild() {
    if (!selectedWorldId) return;
    setVdbLoading(true);
    setVdbError("");
    let pageCount = 0;
    try {
      const pages = await getPagesForWorld(Number(selectedWorldId), token || "");
      pageCount = pages.length;
    } catch (err) {
      // ignore count error
    }
    if (pageCount) {
      setVdbProgress(
        `Indexing ${pageCount} pages (est. 0.3s/page)...`
      );
    } else {
      setVdbProgress("Indexing pages...");
    }
    const start = Date.now();
    try {
      const res = await rebuildVectorDB(token || "", Number(selectedWorldId));
      const elapsed = (Date.now() - start) / 1000;
      const perPage = pageCount
        ? (elapsed / pageCount).toFixed(2)
        : elapsed.toFixed(2);
      setSuccess(
        `Vector DB updated! Indexed ${res.pages_indexed} pages (${perPage}s/page).`
      );
    } catch (err) {
      setVdbError("Failed to rebuild vector DB.");
    } finally {
      setVdbLoading(false);
      setVdbProgress("");
      setTimeout(() => {
        setSuccess("");
        setVdbError("");
      }, 3000);
    }
  }

  if (!hasRole(user?.role, "system admin")) {
    return (
      <DashboardLayout>
        <div className="p-10 text-2xl text-red-600 font-bold">Not authorized</div>
      </DashboardLayout>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 px-2 sm:px-6 py-8">
          <div className="mx-auto max-w-3xl w-full flex flex-col gap-8">
            {/* Title & feedback */}
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-2xl font-serif font-bold text-[var(--primary)] tracking-tight">
                System Settings
              </h1>
              <div className="flex flex-col gap-1 items-end">
                {success && (
                  <div className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-xl shadow z-[1000] text-sm animate-fade-in-out">
                    {success}
                  </div>
                )}
              </div>
            </div>

            {/* Import/Export Area */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm p-6 w-full flex flex-col sm:flex-row gap-6 items-center">
              <div className="flex flex-1 flex-col gap-2">
                <div className="text-[var(--primary)] font-bold text-lg mb-1">
                  Import / Export World
                </div>
                <div className="text-[var(--foreground)]/80 text-sm mb-3">
                  Import a new world (from JSON), or export the current world for backup or transfer.
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold bg-[var(--primary)] text-[var(--primary-foreground)]
                      shadow hover:bg-[var(--accent)] hover:text-[var(--background)] transition border border-[var(--primary)]"
                    onClick={() => setImportModalOpen(true)}
                  >
                    <Upload className="w-5 h-5" />
                    Import World
                  </button>
                  <button
                  type="button"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold border border-[var(--primary)] shadow transition
                    bg-transparent text-[var(--primary)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary-foreground)]"
                  onClick={() => setExportModalOpen(true)}
                >
                  <Download className="w-5 h-5" />
                  Export World
                </button>
                </div>
              </div>
              <ImportWorldModal
                open={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                onImported={() => {
                  setSuccess("World imported successfully!");
                  setImportModalOpen(false);
                  setTimeout(() => setSuccess(""), 2000);
                }}
              />
            <ExportWorldModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} />
            </div>

            {/* Vector DB Rebuild Area */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm p-6 w-full flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-6 h-6 text-[var(--primary)]" />
                <div className="text-[var(--primary)] font-bold text-lg">Vector Database</div>
              </div>
              <div className="text-[var(--foreground)]/80 text-sm">
                Rebuild the vector database for a selected world to update search indexes.
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-2 items-end">
                <select
                  className="flex-1 px-3 py-2 rounded-xl border border-[var(--primary)] bg-[var(--surface)] text-[var(--primary)] focus:outline-none"
                  value={selectedWorldId}
                  onChange={e => setSelectedWorldId(e.target.value)}
                  disabled={vdbLoading}
                >
                  <option value="">— Choose World —</option>
                  {worlds.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="px-5 py-2 rounded-xl font-bold border border-[var(--primary)] shadow transition bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent)] hover:text-[var(--background)] disabled:opacity-60"
                  onClick={handleRebuild}
                  disabled={vdbLoading || !selectedWorldId}
                >
                  {vdbLoading ? "Rebuilding..." : "Build Vector DB"}
                </button>
              </div>
              {vdbProgress && (
                <div className="text-sm text-[var(--primary)] mt-2">{vdbProgress}</div>
              )}
              {vdbError && (
                <div className="text-sm text-red-600 mt-2">{vdbError}</div>
              )}
            </div>

            {/* User Management Area */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm p-6 w-full flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-2">
                <Users2 className="w-6 h-6 text-[var(--primary)]" />
                <div className="text-[var(--primary)] font-bold text-lg">
                  User Management
                </div>
              </div>
              <div className="text-[var(--foreground)]/80 text-sm mb-3">
                Manage all users, roles and permissions.
              </div>
              <Link
                href="/user_management"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold bg-[var(--primary)] text-[var(--primary-foreground)]
                  shadow hover:bg-[var(--accent)] hover:text-[var(--background)] border border-[var(--primary)] transition w-fit"
              >
                <Users2 className="w-5 h-5" />
                Go to User Management
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
