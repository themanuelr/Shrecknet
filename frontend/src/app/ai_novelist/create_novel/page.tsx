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
import { startNovelJob } from "../../lib/agentAPI";
import { useNovelistJobs } from "../../lib/useNovelistJobs";

function CreateNovelPageContent() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const agentId = Number(searchParams.get("agent") || 0);
  const { agent } = useAgentById(agentId);
  const { agents } = useAgents();
  const { jobs } = useNovelistJobs();

  const [text, setText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [example, setExample] = useState("");
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
    const res = await startNovelJob(
      agentId,
      { text, instructions, example: example || null, helper_agents: helpers },
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
            <h1 className="text-2xl font-bold mb-2 text-indigo-700">AI Novelist</h1>
            {agent && <div className="text-md text-indigo-600">Using {agent.name}</div>}
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your source text here"
              className="w-full h-40 p-2 border border-indigo-200 rounded"
            />
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Instructions for the novelist"
              className="w-full h-24 p-2 border border-indigo-200 rounded"
            />
            <textarea
              value={example}
              onChange={e => setExample(e.target.value)}
              placeholder="Optional writing style example"
              className="w-full h-24 p-2 border border-indigo-200 rounded"
            />
            <div>
              <label className="font-semibold">Helper Agents:</label>
              <select
                multiple
                value={helpers.map(String)}
                onChange={e => {
                  const opts = Array.from(e.target.selectedOptions).map(o => Number(o.value));
                  setHelpers(opts);
                }}
                className="w-full border border-indigo-200 rounded p-2 h-32"
              >
                {agents
                  .filter(a => a.world_id === agent?.world_id && a.id !== agent?.id)
                  .map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
              </select>
            </div>
            <button
              onClick={handleStart}
              className="px-4 py-2 rounded bg-indigo-600 text-white font-semibold self-start"
            >
              Start Novel Job
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
