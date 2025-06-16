"use client";
import { useState } from "react";
import { Upload, Download, Users2, Bot, BookOpenText, Sparkles, Info, Wand2, Book, Search } from "lucide-react";
import ImportWorldModal from "../components/importexport/ImportWorldModal";
import ExportWorldModal from "../components/importexport/ExportWorldModal";
import AuthGuard from "../components/auth/AuthGuard";
import DashboardLayout from "../components/DashboardLayout";
import Link from "next/link";
import { hasRole } from "../lib/roles";
import { useAuth } from "../components/auth/AuthProvider";
import { useAgents } from "../lib/useAgents";
import { useWorlds } from "../lib/userWorlds";
import AgentModal from "../components/agents/AgentModal";
import { startVectorUpdate } from "../lib/vectordbAPI";
import { getPagesForWorld } from "../lib/pagesAPI";
import { useVectorJobs } from "../lib/useVectorJobs";

// ------- GUILDMASTER NPC GUIDE -------
const npcQuotes = [
  "Welcome to the Guildhall, worldbuilder! Here your agents await their next quest.",
  "A wise admin listens to their guides—and their Guild.",
  "Remember: a well-maintained archive is a happy archive.",
  "Need a new conversationalist? Add one, and let the stories flow.",
  "Our scribes and novelists await your guidance.",
  "Bulk rituals are best performed at dawn. Or with coffee.",
];
function GuildmasterGuide({ status, quote, flavor }) {
  // Use an image for the Guildmaster avatar, or just an emoji!
  return (
    <div className="flex gap-4 items-center rounded-xl p-4 mb-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-white shadow border border-indigo-100">
      {/* You can use a real image, or SVG, or just the Bot icon here */}
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 bg-indigo-200 rounded-full flex items-center justify-center shadow-inner text-indigo-700 text-3xl border-4 border-indigo-300">
          {/* <img src="/images/guildmaster.png" className="w-12 h-12 rounded-full" alt="Guildmaster" /> */}
          🧙‍♂️
        </div>
        <span className="text-xs text-indigo-600 mt-1 font-mono">Guildmaster</span>
      </div>
      <div className="flex-1">
        <div className="text-indigo-900 font-semibold italic">{quote}</div>
        <div className="text-xs text-indigo-700 mt-1">{flavor}</div>
        {status && (
          <div className="text-sm bg-indigo-200 text-indigo-900 rounded px-3 py-1 mt-2 w-fit font-semibold shadow-sm">{status}</div>
        )}
      </div>
    </div>
  );
}

// ------- AGENT AVATAR -------
function AgentAvatar({ name, logo }) {
  // If the logo exists, show it. Otherwise, show initials as a fallback.
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-700 shadow-inner border-2 border-indigo-200 overflow-hidden">
      {logo ? (
        <img
          src={logo}
          alt={name}
          className="object-cover w-full h-full"
          onError={(e) => {
            // fallback to initials if image fails to load
            e.currentTarget.style.display = "none";
            e.currentTarget.parentNode.textContent = initials;
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

// ------- JOB STATUS SCROLL -------
function JobStatusScroll({ jobs }) {
  if (!jobs || !jobs.length) return null;
  return (
    <div className="bg-purple-50 border border-indigo-200 rounded-xl p-2 mt-2 shadow-inner animate-pulse">
      <div className="font-semibold text-yellow-900 mb-1 flex items-center gap-1">
        <Wand2 className="w-4 h-4 text-yellow-600" /> Vector Update Progress
      </div>
      <ul className="pl-3 text-sm text-yellow-900">
        {jobs.map((job, idx) => (
          <li key={job.id || idx}>
            {job.status === "running" && (
              <>
                <span className="animate-pulse">⏳</span> Running: {job.progress || "In progress..."}
              </>
            )}
            {job.status === "finished" && (
              <>
                <span>✅</span> Done: {job.progress || "Complete"}
              </>
            )}
            {job.status === "error" && (
              <>
                <span>❌</span> Error: {job.progress || "Failed"}
              </>
            )}
            {!["running", "finished", "error"].includes(job.status) && (
              <>🔄 {job.status}</>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------- MAIN PAGE -------
export default function AgentsGuildhallPage() {
  const { user, token } = useAuth();
  const { agents, mutate, isLoading, error } = useAgents();
  const { worlds } = useWorlds();
  const { jobs, mutate: refreshJobs } = useVectorJobs();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [success, setSuccess] = useState("");
  const [updatingAgentId, setUpdatingAgentId] = useState<number | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string[]>([]);
  const [npcFlavor, setNpcFlavor] = useState(
    "You can add, edit, or send your agents on new tasks from here."
  );
  const [npcQuote] = useState(
    npcQuotes[Math.floor(Math.random() * npcQuotes.length)]
  );

  if (!hasRole(user?.role, "world builder") && !hasRole(user?.role, "system admin")) {
    return (
      <DashboardLayout>
        <div className="p-10 text-2xl text-red-600 font-bold">Not authorized</div>
      </DashboardLayout>
    );
  }

  // Filter/search logic
  const filtered = agents.filter((a) =>
    a.name?.toLowerCase().includes(search.toLowerCase())
  );
console.log("Agents:"+JSON.stringify(filtered))
  // Group jobs by agent
  const jobsByAgent = jobs
    .filter((j) => j.job_type === "update_vector_db")
    .reduce<Record<number, any[]>>((acc, j) => {
      if (!acc[j.agent_id]) acc[j.agent_id] = [];
      acc[j.agent_id].push(j);
      return acc;
    }, {});

  // Bulk vector update
  async function handleRebuildAll() {
    const conversational = agents.filter((a) => a.task === "conversational");
    if (conversational.length === 0) return;
    setBulkUpdating(true);
    setBulkStatus([]);
    setNpcFlavor("Guild ritual in progress: refreshing all conversational agents...");
    for (const ag of conversational) {
      setBulkStatus((s) => [...s, `Updating ${ag.name}...`]);
      try {
        await startVectorUpdate(token || "", ag.id);
        setBulkStatus((s) => [...s, `✅ ${ag.name}: job queued.`]);
      } catch (err) {
        setBulkStatus((s) => [...s, `❌ ${ag.name}: failed to queue.`]);
      }
    }
    refreshJobs();
    setBulkUpdating(false);
    setNpcFlavor("Guild ritual complete! All agents have been refreshed.");
  }

  // Individual vector update
  async function handleRebuild(agent) {
    setUpdatingAgentId(agent.id);
    setNpcFlavor(`Agent ${agent.name} is updating their knowledge...`);
    try {
      const pages = await getPagesForWorld(agent.world_id, token || "");
      const pageCount = pages.length;
      const estimated = Math.ceil(pageCount * 1.5);
      const proceed = window.confirm(
        `Rebuilding the vector DB will add ${pageCount} pages and may take around ${estimated} seconds. Continue?`
      );
      if (!proceed) {
        setUpdatingAgentId(null);
        setNpcFlavor("Action cancelled.");
        return;
      }
      await startVectorUpdate(token || "", agent.id);
      setSuccess("Vector DB update started");
      refreshJobs();
      setNpcFlavor(`Agent ${agent.name} is off to the archives!`);
    } catch (err) {
      setSuccess("Failed to rebuild vector DB");
      setNpcFlavor("Something went wrong with the ritual...");
    } finally {
      setUpdatingAgentId(null);
      setTimeout(() => setSuccess(""), 2000);
    }
  }

  // Modal openers/closers
  function handleCreate() {
    setSelectedAgent(null);
    setModalOpen(true);
    setNpcFlavor("Time to welcome a new agent into the Guild!");
  }
  function handleEdit(agent) {
    setSelectedAgent(agent);
    setModalOpen(true);
    setNpcFlavor(`Editing agent ${agent.name}...`);
  }
  function handleModalSave() {
    mutate();
    setModalOpen(false);
    setSuccess("Agent saved successfully!");
    setNpcFlavor("Success! The Guild welcomes the updated agent.");
    setTimeout(() => setSuccess(""), 2000);
  }
  function handleModalDelete() {
    mutate();
    setModalOpen(false);
    setSuccess("Agent deleted successfully!");
    setNpcFlavor("The Guild bid farewell to the departed agent.");
    setTimeout(() => setSuccess(""), 2000);
  }

  // -------- AGENT GROUP CARD RENDERER --------
  function AgentGuildTable({ title, icon, agents, task, canRebuild }) {
    return (
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span>{icon}</span>
          <h2 className="text-xl font-bold text-indigo-900 font-serif">{title}</h2>
        </div>
        <div className="rounded-2xl shadow bg-white/80 border border-indigo-100 p-2 sm:p-4">
          {agents.length === 0 && (
            <div className="text-indigo-400 italic text-sm p-3">No agents in this guild yet.</div>
          )}
          <div className="divide-y divide-indigo-50">
            {agents.map((agent) => (
              <div key={agent.id} className="flex flex-col gap-2 py-4">
                <div className="flex flex-row items-center gap-4">
                <AgentAvatar name={agent.name} logo={agent.logo} />
                  <div className="flex-1">
                    <div className="font-bold text-indigo-800">{agent.name}</div>
                    <div className="text-sm text-indigo-700 opacity-70">
                      World: <span className="font-semibold">{worlds?.find(w => w.id === agent.world_id)?.name || "???"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-800 transition text-sm shadow"
                      onClick={() => handleEdit(agent)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 rounded-lg font-semibold text-white bg-rose-600 hover:bg-rose-800 transition text-sm shadow"
                      onClick={() => {
                        setSelectedAgent(agent);
                        setModalOpen(true);
                        setNpcFlavor(`Are you sure you want to remove agent ${agent.name}?`);
                      }}
                    >
                      Delete
                    </button>
                    {canRebuild && (
                      <button
                        className="px-3 py-1 rounded-lg font-semibold text-indigo-700 bg-purple-200 hover:bg-yellow-300 transition text-sm shadow border border-purple-300"
                        onClick={() => handleRebuild(agent)}
                        disabled={updatingAgentId === agent.id}
                      >
                        {updatingAgentId === agent.id ? "Updating..." : "Rebuild Vector"}
                      </button>
                    )}
                  </div>
                </div>
                {/* Animated job status scroll for conversational agents */}
                {canRebuild && jobsByAgent[agent.id] && (
                  <JobStatusScroll jobs={jobsByAgent[agent.id]} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full text-indigo-900 px-2 sm:px-6 py-8">
          <div className="mx-auto max-w-5xl w-full">
            {/* Guildmaster NPC Guide */}
            <GuildmasterGuide
              status={success}
              quote={npcQuote}
              flavor={npcFlavor}
            />

            {/* Guild Rituals and search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-5">
              <div className="flex gap-2">
                <button
                  className="flex gap-2 items-center px-5 py-2 rounded-xl font-bold bg-indigo-600 text-white shadow hover:bg-indigo-800 border border-indigo-500 transition"
                  onClick={handleCreate}
                >
                  <Sparkles className="w-5 h-5" />
                  Add Agent
                </button>
                <button
                  className={`flex gap-2 items-center px-5 py-2 rounded-xl font-bold bg-purple-200 text-indigo-800 shadow border border-purple-300 hover:bg-purple-300 transition ${
                    bulkUpdating ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  onClick={handleRebuildAll}
                  disabled={bulkUpdating}
                >
                  <Wand2 className="w-5 h-5" />
                  {bulkUpdating ? "Ritual in Progress..." : "Update All Conversational Vectors"}
                </button>
              </div>
              {/* Scrying/search bar */}
              <div className="flex items-center gap-2 bg-white border border-indigo-200 px-4 py-2 rounded-xl shadow-inner w-full sm:w-[340px]">
                <Search className="w-5 h-5 text-indigo-400" />
                <input
                  className="bg-transparent outline-none flex-1 text-base text-indigo-700 placeholder-indigo-400"
                  placeholder="Scry for NPCs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Bulk status feedback */}
            {bulkStatus.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 mb-4 text-sm space-y-1">
                {bulkStatus.map((msg, i) => (
                  <div key={i}>{msg}</div>
                ))}
              </div>
            )}

            {/* All agent guilds */}
            <AgentGuildTable
              title="Conversationalists’ Table"
              icon={<Bot className="w-6 h-6 text-indigo-500" />}
              agents={filtered.filter((a) => a.task === "conversational")}
              task="conversational"
              canRebuild={true}
            />
            <AgentGuildTable
              title="Scribes’ Alcove"
              icon={<BookOpenText className="w-6 h-6 text-fuchsia-500" />}
              agents={filtered.filter((a) => a.task === "page writer")}
              task="page writer"
              canRebuild={false}
            />
            <AgentGuildTable
              title="Novelists’ Lounge"
              icon={<Book className="w-6 h-6 text-purple-500" />}
              agents={filtered.filter((a) => a.task === "story novelist")}
              task="story novelist"
              canRebuild={false}
            />

            {/* Modal for Add/Edit agent */}
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
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
