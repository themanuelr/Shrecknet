"use client";
import { useState } from "react";
import AuthGuard from "../../components/auth/AuthGuard";
import DashboardLayout from "../../components/DashboardLayout";
import { useAgents } from "../../lib/useAgents";
import { useWorlds } from "../../lib/userWorlds";
import { useAuth } from "../../components/auth/AuthProvider";
import AgentModal from "../../components/agents/AgentModal";
import { useSpecialistJobs } from "../../lib/useSpecialistJobs";
import { useSpecialistSources } from "../../lib/useSpecialistSources";
import { addSource, deleteSource, startVectorJob } from "../../lib/specialistAPI";

function JobList({ agentId }) {
  const { jobs } = useSpecialistJobs();
  const list = jobs.filter((j) => j.agent_id === agentId);
  if (!list.length) return null;
  return (
    <div className="mt-2 text-sm bg-purple-50 p-2 rounded">
      <div className="font-semibold mb-1">Jobs</div>
      <ul className="list-disc ml-5">
        {list.map((j) => (
          <li key={j.job_id || j.start_time}>
            {j.status} {j.documents_indexed !== undefined && `- ${j.documents_indexed} docs`}
            {j.start_time && (
              <span className="ml-2 text-xs text-gray-600">
                {new Date(j.start_time).toLocaleString()}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SourcesManager({ agentId }) {
  const { token } = useAuth();
  const { sources, mutate } = useSpecialistSources(agentId);
  const [type, setType] = useState("link");
  const [value, setValue] = useState("");

  async function handleAdd() {
    if (!value) return;
    const payload: any = { type };
    if (type === "link") payload.url = value;
    else payload.path = value;
    await addSource(agentId, payload, token || "");
    setValue("");
    mutate();
  }

  async function handleDelete(id: number) {
    await deleteSource(agentId, id, token || "");
    mutate();
  }

  return (
    <div className="mt-2">
      <div className="font-semibold text-sm">Sources</div>
      <ul className="ml-4 list-disc text-sm">
        {sources.map((s: any) => (
          <li key={s.id} className="flex items-center gap-2">
            <span>{s.type === "link" ? s.url : s.path}</span>
            <button
              className="text-red-600 text-xs"
              onClick={() => handleDelete(s.id)}
            >
              delete
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 mt-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="border px-1 text-sm">
          <option value="link">link</option>
          <option value="file">file</option>
        </select>
        <input
          className="border flex-1 px-2 text-sm"
          placeholder={type === "link" ? "URL" : "Path"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="px-2 bg-indigo-600 text-white text-sm rounded" onClick={handleAdd}>add</button>
      </div>
    </div>
  );
}

export default function SpecialistSettingsPage() {
  const { agents, mutate } = useAgents();
  const { worlds } = useWorlds();
  const { token } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null as any);
  const { mutate: refreshJobs } = useSpecialistJobs();

  const specialists = agents.filter((a) => a.task === "specialist");

  function handleEdit(agent: any) {
    setSelected(agent);
    setModalOpen(true);
  }
  function handleCreate() {
    setSelected(null);
    setModalOpen(true);
  }
  function handleSave() {
    mutate();
    setModalOpen(false);
  }
  function handleDelete() {
    mutate();
    setModalOpen(false);
  }

  async function handleRebuild(id: number) {
    await startVectorJob(id, token || "");
    refreshJobs();
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full p-6 text-indigo-900">
          <h1 className="text-2xl font-bold mb-4">Specialist Agents</h1>
          <button className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded" onClick={handleCreate}>
            Add Agent
          </button>
          <div className="space-y-6">
            {specialists.map((a) => (
              <div key={a.id} className="border p-4 rounded-xl shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-lg">{a.name}</div>
                    <div className="text-sm">
                      World: {worlds.find((w) => w.id === a.world_id)?.name || ""}
                    </div>
                    {a.specialist_update_date && (
                      <div className="text-sm text-gray-600">
                        Vector DB updated: {new Date(a.specialist_update_date).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm bg-indigo-500 text-white rounded" onClick={() => handleEdit(a)}>
                      Edit
                    </button>
                    <button className="px-3 py-1 text-sm bg-purple-600 text-white rounded" onClick={() => handleRebuild(a.id)}>
                      Generate Vector DB
                    </button>
                  </div>
                </div>
                <JobList agentId={a.id} />
                <SourcesManager agentId={a.id} />
              </div>
            ))}
          </div>
          {modalOpen && (
            <AgentModal
              agent={selected}
              onClose={() => setModalOpen(false)}
              onSave={handleSave}
              onDelete={handleDelete}
              worlds={worlds}
            />
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
