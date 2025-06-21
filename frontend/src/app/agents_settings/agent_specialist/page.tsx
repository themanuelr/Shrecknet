"use client";
import { useState } from "react";
import { Bot, Sparkles, Wand2, Search } from "lucide-react";
import AuthGuard from "../../components/auth/AuthGuard";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../components/auth/AuthProvider";
import { hasRole } from "../../lib/roles";
import { useAgents } from "../../lib/useAgents";
import { useWorlds } from "../../lib/userWorlds";
import { useSpecialistJobs } from "../../lib/useSpecialistJobs";
import { useSpecialistSources } from "../../lib/useSpecialistSources";
import { startVectorJob } from "../../lib/specialistAPI";
import AgentModal from "../../components/agents/AgentModal";
import SpecialistSourceModal from "../../components/agents/SpecialistSourceModal";

// ----- NPC Guide -----
const npcQuotes = [
  "Welcome, archivist! Your specialists await new knowledge.",
  "A tidy archive is a powerful tool.",
  "Feed your specialists well, and they will answer wisely.",
];
function GuildmasterGuide({ status, quote, flavor }) {
  return (
    <div className="flex gap-4 items-center rounded-xl p-4 mb-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-white shadow border border-indigo-100">
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 bg-indigo-200 rounded-full flex items-center justify-center shadow-inner text-indigo-700 text-3xl border-4 border-indigo-300">
          🧙‍♂️
        </div>
        <span className="text-xs text-indigo-600 mt-1 font-mono">Archivist</span>
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

// ----- Avatar -----
function AgentAvatar({ name, logo }) {
  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-700 shadow-inner border-2 border-indigo-200 overflow-hidden">
      {logo ? (
        <img src={logo} alt={name} className="object-cover w-full h-full" onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.parentNode.textContent = initials; }} />
      ) : (
        initials
      )}
    </div>
  );
}

// ----- Job Status -----
function JobStatusScroll({ jobs }) {
  if (!jobs || !jobs.length) return null;
  const active = jobs.filter(j => j.status === "queued" || j.status === "processing" || j.status === "running");
  const finished = jobs.filter(j => j.status === "done" || j.status === "error").slice(-3);

  const render = job => {
    if (job.status === "processing" || job.status === "running") return (<><span className="animate-pulse">⏳</span> Running</>);
    if (job.status === "queued") return (<><span>🕓</span> Queued</>);
    if (job.status === "done") return (<><span>✅</span> Done</>);
    if (job.status === "error") return (<><span>❌</span> Error</>);
    return <>🔄 {job.status}</>;
  };

  const renderProgress = job => {
    if (job.progress) {
      return <div className="text-xs text-indigo-700 ml-5">{job.progress}</div>;
    }
    return null;
  };

  const renderDocs = job => {
    if (job.documents_indexed !== undefined && job.documents_indexed !== null) {
      return (
        <div className="text-xs text-gray-700 ml-5">
          Documents indexed: <span className="font-semibold">{job.documents_indexed}</span>
        </div>
      );
    }
    return null;
  };

  const renderTime = job => {
    const start = job.start_time ? new Date(job.start_time) : null;
    const end = job.end_time ? new Date(job.end_time) : null;
    let dur = "";
    if (start && end) {
      const diff = (end.getTime() - start.getTime()) / 1000;
      dur = ` (${Math.round(diff)}s)`;
    }
    return (
      <div className="text-xs text-gray-500 ml-5">
        Start: {start ? start.toLocaleString() : "?"}
        {end && <> | End: {end.toLocaleString()}{dur}</>}
      </div>
    );
  };

  return (
    <div className="bg-purple-50 border border-indigo-200 rounded-xl p-2 mt-2 shadow-inner">
      <div className="font-semibold text-yellow-900 mb-1 flex items-center gap-1">
        <Wand2 className="w-4 h-4 text-yellow-600" /> Vector Update Progress
      </div>
      {active.length > 0 && (
        <>
          <div className="font-semibold text-indigo-700">Active Jobs:</div>
          <ul className="pl-3 text-sm text-yellow-900 mb-2">
            {active.map((j, idx) => (
              <li key={j.job_id || idx} className="mb-1">
                {render(j)}
                {renderProgress(j)}
                {renderTime(j)}
              </li>
            ))}
          </ul>
        </>
      )}
      {finished.length > 0 && (
        <>
          <div className="font-semibold text-indigo-700 mt-2">Recent Jobs:</div>
          <ul className="pl-3 text-sm text-yellow-900">
            {finished.map((j, idx) => (
              <li key={j.job_id || idx} className="mb-1">
                {render(j)}
                {renderDocs(j)}
                {renderTime(j)}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ----- Source Cards -----
function SourceCard({ source, onEdit }) {
  return (
    <div className="border border-indigo-100 bg-white rounded-xl p-3 shadow flex flex-col">
      <div className="font-semibold text-indigo-800">{source.name}</div>
      <div className="text-sm break-all">
        {source.type === "link" ? source.url : source.path}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Added: {new Date(source.added_at).toLocaleString()}
      </div>
      <button className="mt-2 text-indigo-600 text-xs self-end" onClick={() => onEdit(source)}>
        Edit
      </button>
    </div>
  );
}

// ----- Main Page -----
export default function SpecialistSettingsPage() {
  const { user, token } = useAuth();
  const { agents, mutate } = useAgents();
  const { worlds } = useWorlds();
  const { jobs } = useSpecialistJobs();
  const [modalOpen, setModalOpen] = useState(false);
  const [sourceModal, setSourceModal] = useState<{agentId:number, source:any}|null>(null);
  const [selectedAgent, setSelectedAgent] = useState(null as any);
  const [success, setSuccess] = useState("");
  const [npcFlavor, setNpcFlavor] = useState("Manage your specialist agents and their sources here.");
  const [npcQuote] = useState(npcQuotes[Math.floor(Math.random()*npcQuotes.length)]);

  if (!hasRole(user?.role, "world builder") && !hasRole(user?.role, "system admin")) {
    return (
      <DashboardLayout>
        <div className="p-10 text-2xl text-red-600 font-bold">Not authorized</div>
      </DashboardLayout>
    );
  }

  const specialists = agents.filter(a => a.task === "specialist");
  const jobsByAgent = jobs.reduce<Record<number, any[]>>((acc,j)=>{ if(!acc[j.agent_id]) acc[j.agent_id]=[]; acc[j.agent_id].push(j); return acc; },{});

  async function handleRebuild(agentId:number) {
    setNpcFlavor("Rebuilding vectors...");
    await startVectorJob(agentId, token||"");
    setNpcFlavor("Job queued!");
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full text-indigo-900 px-2 sm:px-6 py-8">
          <div className="mx-auto max-w-5xl w-full">
            <GuildmasterGuide status={success} quote={npcQuote} flavor={npcFlavor} />

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-5">
              <div className="flex gap-2">
                <button className="flex gap-2 items-center px-5 py-2 rounded-xl font-bold bg-indigo-600 text-white shadow hover:bg-indigo-800 border border-indigo-500 transition" onClick={()=>{setSelectedAgent(null);setModalOpen(true);}}>
                  <Sparkles className="w-5 h-5" /> Add Agent
                </button>
              </div>
              <div className="flex items-center gap-2 bg-white border border-indigo-200 px-4 py-2 rounded-xl shadow-inner w-full sm:w-[340px]">
                <Search className="w-5 h-5 text-indigo-400" />
                <input className="bg-transparent outline-none flex-1 text-base text-indigo-700 placeholder-indigo-400" placeholder="Search agents..." onChange={()=>{}} />
              </div>
            </div>

            <div className="space-y-6">
              {specialists.map(agent => {
                const { sources } = useSpecialistSources(agent.id);
                return (
                  <div key={agent.id} className="border border-indigo-100 bg-white/80 rounded-2xl shadow p-4">
                    <div className="flex items-center gap-4">
                      <AgentAvatar name={agent.name} logo={agent.logo} />
                      <div className="flex-1">
                        <div className="font-bold text-indigo-800">{agent.name}</div>
                        <div className="text-sm text-indigo-700 opacity-70">
                          World: <span className="font-semibold">{worlds?.find(w => w.id === agent.world_id)?.name || "???"}</span>
                        </div>
                        {agent.specialist_update_date && (
                          <div className="text-sm text-indigo-700 opacity-70">
                            Vector DB updated: <span className="font-semibold">{new Date(agent.specialist_update_date).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-800 transition text-sm shadow" onClick={()=>{setSelectedAgent(agent);setModalOpen(true);}}>Edit</button>
                        <button className="px-3 py-1 rounded-lg font-semibold text-purple-700 bg-purple-200 hover:bg-yellow-300 transition text-sm shadow border border-purple-300" onClick={()=>handleRebuild(agent.id)}>Rebuild Vector</button>
                        <button className="px-3 py-1 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-800 transition text-sm shadow" onClick={()=>setSourceModal({agentId:agent.id,source:null})}>Add Source</button>
                      </div>
                    </div>
                    {jobsByAgent[agent.id] && <JobStatusScroll jobs={jobsByAgent[agent.id]} />}
                    {sources && sources.length > 0 && (
                      <div className="mt-3 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {sources.map(src => (
                          <SourceCard key={src.id} source={src} onEdit={(s)=>setSourceModal({agentId:agent.id,source:s})} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {modalOpen && (
              <AgentModal
                agent={selectedAgent}
                onClose={()=>setModalOpen(false)}
                onSave={()=>{mutate();setModalOpen(false);}}
                onDelete={()=>{mutate();setModalOpen(false);}}
                worlds={worlds}
              />
            )}
            {sourceModal && (
              <SpecialistSourceModal
                agentId={sourceModal.agentId}
                source={sourceModal.source}
                onClose={()=>setSourceModal(null)}
                onSaved={()=>{}}
              />
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
