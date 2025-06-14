"use client";
import { useState } from "react";
import AuthGuard from "../components/auth/AuthGuard";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../components/auth/AuthProvider";
import { hasRole } from "../lib/roles";
import { useAgents } from "../lib/useAgents";
import { useWorlds } from "../lib/userWorlds";
import AgentGrid from "../components/agents/AgentGrid";
import AgentModal from "../components/agents/AgentModal";
import { rebuildVectorDB } from "../lib/vectordbAPI";
import { getPagesForWorld } from "../lib/pagesAPI";

export default function AgentsSettingsPage() {
  const { user, token } = useAuth();
  const { agents, mutate, isLoading, error } = useAgents();
  const { worlds } = useWorlds();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [success, setSuccess] = useState("");
  const [updatingAgentId, setUpdatingAgentId] = useState<number | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string[]>([]);

  if (!hasRole(user?.role, "world builder") && !hasRole(user?.role, "system admin")) {
    return (
      <DashboardLayout>
        <div className="p-10 text-2xl text-red-600 font-bold">Not authorized</div>
      </DashboardLayout>
    );
  }

  const filtered = agents.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase())
  );

  function handleCreate() {
    setSelectedAgent(null);
    setModalOpen(true);
  }

  function handleEdit(agent) {
    setSelectedAgent(agent);
    setModalOpen(true);
  }

  function handleModalSave() {
    mutate();
    setModalOpen(false);
    setSuccess("Agent saved successfully!");
    setTimeout(() => setSuccess(""), 2000);
  }

  function handleModalDelete() {
    mutate();
    setModalOpen(false);
    setSuccess("Agent deleted successfully!");
    setTimeout(() => setSuccess(""), 2000);
  }

  async function handleRebuild(agent) {
    setUpdatingAgentId(agent.id);
    try {
      const pages = await getPagesForWorld(agent.world_id, token || "");
      const pageCount = pages.length;
      const estimated = Math.ceil(pageCount * 1.5);
      const proceed = window.confirm(
        `Rebuilding the vector DB will add ${pageCount} pages and may take around ${estimated} seconds. Continue?`
      );
      if (!proceed) {
        setUpdatingAgentId(null);
        return;
      }
      const res = await rebuildVectorDB(token || "", agent.world_id);
      setSuccess(`Vector DB updated! ${res.pages_indexed} pages indexed.`);
      mutate();
    } catch (err) {
      setSuccess("Failed to rebuild vector DB");
    } finally {
      setUpdatingAgentId(null);
      setTimeout(() => setSuccess(""), 2000);
    }
  }

  async function handleRebuildAll() {
    const conversational = agents.filter(a => a.task === "conversational");
    const worldIds = Array.from(new Set(conversational.map(a => a.world_id)));
    if (worldIds.length === 0) return;
    setBulkUpdating(true);
    setBulkStatus([]);
    for (const wid of worldIds) {
      const worldName = worlds.find(w => w.id === wid)?.name || `World ${wid}`;
      setBulkStatus(s => [...s, `Updating ${worldName}...`]);
      try {
        const res = await rebuildVectorDB(token || "", wid);
        setBulkStatus(s => [
          ...s,
          `✅ ${worldName}: ${res.pages_indexed} pages indexed.`,
        ]);
      } catch (err) {
        setBulkStatus(s => [...s, `❌ ${worldName}: failed to update.`]);
      }
    }
    mutate();
    setBulkUpdating(false);
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 px-2 sm:px-6 py-8">
          <div className="mx-auto max-w-5xl w-full">
            <div className="flex items-center justify-between mb-7">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--primary)] tracking-tight">
                Agents Settings
              </h1>
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 rounded-xl font-bold bg-[var(--primary)] text-[var(--primary-foreground)] shadow"
                  onClick={handleCreate}
                >
                  + Add Agent
                </button>
                <button
                  className="px-4 py-2 rounded-xl font-bold border border-[var(--primary)] text-[var(--primary)] shadow"
                  onClick={handleRebuildAll}
                  disabled={bulkUpdating}
                >
                  {bulkUpdating ? "Updating..." : "Update All Vectors"}
                </button>
              </div>
            </div>
            <input
              className="px-4 py-2 rounded-xl border border-[var(--primary)] bg-[var(--card-bg)] text-[var(--foreground)] placeholder-[var(--primary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-base mb-6 w-full"
              placeholder="Search agents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {success && (
              <div className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-xl shadow mb-4 text-sm">
                {success}
              </div>
            )}
            {bulkStatus.length > 0 && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2 mb-4 text-sm space-y-1">
                {bulkStatus.map((msg, i) => (
                  <div key={i}>{msg}</div>
                ))}
              </div>
            )}
            {isLoading ? (
              <div className="text-lg text-[var(--primary)] animate-pulse">Loading agents...</div>
            ) : error ? (
              <div className="text-lg text-red-500">Error loading agents.</div>
            ) : (
              <AgentGrid
                agents={filtered}
                onEdit={handleEdit}
                onDelete={a => {
                  setSelectedAgent(a);
                  setModalOpen(true);
                }}
                onRebuild={handleRebuild}
                updatingAgentId={updatingAgentId}
              />
            )}
          </div>
          {modalOpen && (
            <AgentModal
              agent={selectedAgent}
              onClose={() => setModalOpen(false)}
              onSave={handleModalSave}
              onDelete={handleModalDelete}
              worlds={worlds}
            />
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
