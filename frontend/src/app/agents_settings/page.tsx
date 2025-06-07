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

export default function AgentsSettingsPage() {
  const { user, token } = useAuth();
  const { agents, mutate, isLoading, error } = useAgents();
  const { worlds } = useWorlds();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [success, setSuccess] = useState("");
  const [vdbLoading, setVdbLoading] = useState(false);

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
    setVdbLoading(true);
    try {
      await rebuildVectorDB(token || "", agent.world_id);
      setSuccess("Vector DB updated!");
    } catch (err) {
      setSuccess("Failed to rebuild vector DB");
    } finally {
      setVdbLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
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
              <button
                className="px-4 py-2 rounded-xl font-bold bg-[var(--primary)] text-[var(--primary-foreground)] shadow"
                onClick={handleCreate}
              >
                + Add Agent
              </button>
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
