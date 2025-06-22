"use client";
export const dynamic = "force-dynamic";
import DashboardLayout from "../../components/DashboardLayout";
import AuthGuard from "../../components/auth/AuthGuard";
import { useAuth } from "../../components/auth/AuthProvider";
import { hasRole } from "../../lib/roles";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAgentById } from "../../lib/useAgentById";
import { useAgents } from "../../lib/useAgents";
import { usePages } from "../../lib/usePage";
import { startNovelJob } from "../../lib/agentAPI";
import { useNovelistJobs } from "../../lib/useNovelistJobs";
import RichEditor from "../../components/editor/RichEditor";
import Image from "next/image";
import Link from "next/link";

const AGENT_PERSONALITIES: Record<string, string> = {
  "Lorekeeper Lyra": "“A tale untold is a world unseen. Let’s weave a new legend!”",
  "Archivist Axion": "“Every saga begins with a spark. Ready when you are!”",
  "Chronicle": "“Words are the threads of fate. Let me spin them for you.”",
  default: "“I am here to craft stories from your world’s lore.”",
};

function NovelistJobStatus({ agentId, jobs }: { agentId: number; jobs: any[] }) {
  const agentJobs = jobs.filter(j => j.agent_id === agentId);
  if (agentJobs.length === 0) return null;

  const running = agentJobs.filter(j => j.status !== "done");
  const waiting = agentJobs.filter(j => j.status === "done" && j.action_needed === "review");
  const recent = agentJobs
    .filter(j => j.status === "done" && j.action_needed !== "review")
    .sort((a, b) => new Date(b.end_time || b.start_time || 0).getTime() - new Date(a.end_time || a.start_time || 0).getTime())
    .slice(0, 3);

  function Row({ job }: { job: any }) {
    const duration = job.start_time && job.end_time
      ? Math.round((new Date(job.end_time).getTime() - new Date(job.start_time).getTime()) / 1000) + "s"
      : "-";
    return (
      <tr className="border-t border-indigo-100 text-sm">
        <td className="p-1 font-semibold">{job.status === "done" ? "Needs Review" : job.status}</td>
        <td className="p-1">{job.start_time ? new Date(job.start_time).toLocaleString() : "-"}</td>
        <td className="p-1">{job.end_time ? new Date(job.end_time).toLocaleString() : "-"}</td>
        <td className="p-1">{duration}</td>
        <td className="p-1">
          {job.status === "done" && (
            <Link className="text-indigo-700 underline" href={`/ai_novelist/review/${job.job_id}?agent=${agentId}`}>Review</Link>
          )}
        </td>
      </tr>
    );
  }

  const all = [...running, ...waiting, ...recent];

  return (
    <div className="overflow-x-auto border border-indigo-200 rounded-xl bg-white/90 shadow">
      <table className="min-w-full text-indigo-800">
        <thead>
          <tr className="text-left">
            <th className="p-1">Status</th>
            <th className="p-1">Started</th>
            <th className="p-1">Ended</th>
            <th className="p-1">Duration</th>
            <th className="p-1"></th>
          </tr>
        </thead>
        <tbody>
          {all.map(j => <Row key={j.job_id} job={j} />)}
        </tbody>
      </table>
    </div>
  );
}

function CreateNovelPageContent() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const agentId = Number(searchParams.get("agent") || 0);
  const { agent } = useAgentById(agentId);
  const { agents } = useAgents();
  const { jobs } = useNovelistJobs();
  const { pages } = usePages(agent ? { gameworld_id: agent.world_id } : {});

  const [text, setText] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "manual">("manual");
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [example, setExample] = useState<number | "">("");
  const [helpers, setHelpers] = useState<number[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!agent) return;
    // default helpers: other agents in same world except this one
    const related = agents.filter(a => a.world_id === agent.world_id && a.id !== agent.id);
    setHelpers(related.map(a => a.id));
  }, [agent, agents]);

  async function handleStart() {
    if (!agentId || !text.trim()) return;
    const exampleText = pages?.find(p => p.id === example)?.content || null;
    const res = await startNovelJob(
      agentId,
      { text, instructions, example: exampleText, helper_agents: helpers },
      token || ""
    );
    setJobId(res.job_id);
    router.push(`/ai_novelist/review/${res.job_id}?agent=${agentId}`);
  }

  if (!hasRole(user?.role, "writer")) {
    return (
      <DashboardLayout>
        <div className="p-10 text-2xl text-red-600 font-bold">Not authorized</div>
      </DashboardLayout>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full text-indigo-900 px-2 sm:px-6 py-10">
          <div className="mx-auto max-w-3xl flex flex-col gap-6">
            <h1 className="text-3xl font-bold text-indigo-700 mb-2">AI Novelist</h1>
            {agent && (
              <div className="flex items-center gap-4 bg-gradient-to-br from-indigo-100 via-purple-50 to-white border border-indigo-200 rounded-2xl p-4 shadow">
                <Image src={agent.logo || "/images/default/avatars/logo.png"} alt={agent.name} width={64} height={64} className="w-16 h-16 rounded-full object-cover border-2 border-indigo-300" />
                <div>
                  <h2 className="text-2xl font-bold text-indigo-800 mb-1">{agent.name}</h2>
                  <div className="italic text-indigo-600 mb-1">{AGENT_PERSONALITIES[agent.name] || AGENT_PERSONALITIES.default}</div>
                  <div className="text-sm text-indigo-700">How can I help you craft this story?</div>
                </div>
              </div>
            )}
            <NovelistJobStatus agentId={agentId} jobs={jobs} />
            <div>
              <div className="flex gap-2 mb-2">
                <button
                  className={`px-3 py-1 rounded-xl border ${inputMode === 'manual' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700'} text-sm`}
                  onClick={() => setInputMode('manual')}
                >Write/Paste</button>
                <button
                  className={`px-3 py-1 rounded-xl border ${inputMode === 'upload' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700'} text-sm`}
                  onClick={() => setInputMode('upload')}
                >Upload File</button>
              </div>
              {inputMode === 'manual' ? (
                <RichEditor value={text} onChange={setText} onSave={() => {}} onCancel={undefined} showSaveButtons={false} />
              ) : (
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept=".txt,.md,.markdown,.pdf"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadName(file.name);
                      const reader = new FileReader();
                      reader.onload = ev => setText(ev.target?.result as string);
                      reader.readAsText(file);
                    }}
                    className="border border-indigo-200 rounded p-2"
                  />
                  {uploadName && (
                    <div className="text-sm text-indigo-700">Loaded {uploadName} ({text.split(/\s+/).filter(Boolean).length} words)</div>
                  )}
                  {text && (
                    <pre className="whitespace-pre-wrap max-h-40 overflow-auto p-2 border border-indigo-200 rounded bg-white">
                      {text.slice(0,500)}{text.length > 500 ? '...' : ''}
                    </pre>
                  )}
                </div>
              )}
            </div>
            <div>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="Instructions for the novelist"
                className="w-full h-24 p-2 border border-indigo-200 rounded"
              />
              {instructions && (
                <div className="mt-1 flex items-center gap-2 text-sm text-indigo-700">
                  {agent?.logo ? (
                    <Image src={agent.logo} alt={agent.name} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-200 text-indigo-800 text-xs">{agent?.name.slice(0,1)}</span>
                  )}
                  <span>Sounds great! I'll keep that in mind.</span>
                </div>
              )}
            </div>
            <div>
              <label className="font-semibold">Style Example (optional):</label>
              <select
                className="w-full border border-indigo-200 rounded p-2"
                value={example}
                onChange={e => setExample(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">None</option>
                {pages?.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold">Helper Agents:</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {agents
                  .filter(a => a.world_id === agent?.world_id && a.id !== agent?.id && a.task === 'conversational')
                  .map(a => (
                    <label key={a.id} className={`flex items-center gap-2 border rounded-xl p-2 cursor-pointer ${helpers.includes(a.id) ? 'bg-indigo-100 border-indigo-300' : 'bg-white border-indigo-200'}`}> 
                      <input
                        type="checkbox"
                        className="accent-indigo-600"
                        checked={helpers.includes(a.id)}
                        onChange={e => {
                          if (e.target.checked) setHelpers(h => [...h, a.id]);
                          else setHelpers(h => h.filter(id => id !== a.id));
                        }}
                      />
                      {a.logo ? (
                        <Image src={a.logo} alt={a.name} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 text-xs">{a.name.slice(0,1)}</span>
                      )}
                      <span className="text-sm text-indigo-800">{a.name}</span>
                    </label>
                  ))}
              </div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-sm text-indigo-800 space-y-1">
              <div><strong>Source:</strong> {text ? `${text.split(/\s+/).length} words` : 'None'}</div>
              <div><strong>Style Example:</strong> {example ? pages?.find(p => p.id === example)?.name : 'None'}</div>
              <div><strong>Helpers:</strong> {helpers.length}</div>
            </div>
            <button
              onClick={handleStart}
              className="px-4 py-2 rounded bg-indigo-600 text-white font-semibold self-start mt-2"
            >
              Let’s begin the tale!
            </button>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

export default function CreateNovelPage() {
  return (
    <Suspense>
      <CreateNovelPageContent />
    </Suspense>
  );
}
