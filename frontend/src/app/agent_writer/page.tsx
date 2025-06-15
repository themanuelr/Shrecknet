"use client";
import { useState, useEffect } from "react";
import AuthGuard from "../components/auth/AuthGuard";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../components/auth/AuthProvider";
import { hasRole } from "../lib/roles";
import { useAgents } from "../lib/useAgents";
import { useWorlds } from "../lib/userWorlds";
import { usePages } from "../lib/usePage";
import { useConcepts } from "../lib/useConcept";
import { startBulkAnalyze, getBulkJob, startAnalyzeJob } from "../lib/agentAPI";
import { useWriterJobs } from "../lib/useWriterJobs";
import Image from "next/image";
import Link from "next/link";

// Optional: agent "personalities" for flavor
const AGENT_PERSONALITIES: Record<string, string> = {
  "Lorekeeper Lyra": "“A tale untold is a world unseen. Let’s fill these pages with legend!”",
  "Archivist Axion": "“Every great saga begins with a single spark. Shall we kindle it together?”",
  "Chronicle": "“Let us chronicle your world for generations of adventurers!”",
  // fallback or generic:
  "default": "“I will help you turn knowledge into stories!”"
};

export default function AgentWriterPage() {
  const { user, token } = useAuth();
  const { agents, isLoading: agentsLoading } = useAgents();
  const { worlds } = useWorlds();
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const { pages } = usePages(selectedAgent ? { gameworld_id: selectedAgent.world_id } : {});
  const { concepts } = useConcepts(selectedAgent?.world_id);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const PAGE_SIZE = 10;
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const { jobs: writerJobs } = useWriterJobs();
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("writer_completed_jobs");
    if (stored) {
      try {
        setCompletedJobs(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const markJobCompleted = (job: any) => {
    const entry = {
      job_id: job.job_id || job.id,
      agent_id: job.agent_id,
      page_id: job.page_id,
      page_name: pages.find((p) => p.id === job.page_id)?.name || (job.pages ? job.pages.join(', ') : ''),
      job_type: job.job_type || 'bulk_analyze',
      start_time: job.start_time,
      end_time: job.end_time,
      completed_at: new Date().toISOString(),
    };
    const filtered = completedJobs.filter((j) => j.job_id !== entry.job_id);
    const updated = [...filtered, entry];
    saveCompleted(updated);
  };

  const saveCompleted = (data: any[]) => {
    setCompletedJobs(data);
    localStorage.setItem("writer_completed_jobs", JSON.stringify(data));
  };


  useEffect(() => {
    const interval = setInterval(() => {
      jobs.forEach((job) => {
        if (job.status === "done") return;
        getBulkJob(job.id, token)
          .then((data) => {
            setJobs((j) =>
              j.map((jj) => (jj.id === job.id ? { ...jj, ...data } : jj))
            );
          })
          .catch(() => {});
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [jobs, token]);

  if (!hasRole(user?.role, "world builder") && !hasRole(user?.role, "system admin")) {
    return (
      <DashboardLayout>
        <div className="p-10 text-2xl text-red-600 font-bold">Not authorized</div>
      </DashboardLayout>
    );
  }

  const writerAgents = agents.filter(a => a.task === "page writer");
  const worldsMap: Record<number, any> = {};
  worlds.forEach(w => { worldsMap[w.id] = w; });

  // --- Welcome to Scriptorium (before agent selected) ---
  if (!selectedAgent) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] px-2 sm:px-6 py-12">
            <div className="mx-auto max-2xl flex flex-col gap-6 items-center">
              {/* Scriptorium Hero */}
              <div className="w-full flex flex-col items-center gap-3 bg-gradient-to-br from-[#29196620] via-[#7b2ff25] to-[#36205a15] bg-white/15 rounded-2xl shadow-xl p-8 border-1 border-[var(--primary)]">
                <h1 className="text-3xl font-bold text-[var(--primary)] text-center">Welcome to the Scriptorium</h1>
                <p className="text-center text-lg text-[var(--foreground)]/80 mb-2">
                  Here, legendary AI Scribes await to help you <span className="font-semibold text-[var(--primary)]">craft new tales</span> and expand your tabletop world!
                </p>
                <p className="text-center text-[var(--foreground)]/80">
                  Select a Scribe below. Each Scribe will study the lore of your world and propose new stories, characters, or secrets to enrich your universe.<br/>
                  <span className="italic text-[var(--accent)]">The pen is yours, but the Scribe brings it to life.</span>
                </p>
              </div>
              </div>
              <div className="mx-auto max-w-2xl flex flex-col gap-6 items-center">
              {/* Agent Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-6 w-full">
                {agentsLoading ? (
                  <div className="col-span-2 text-center text-lg">Summoning Scribes...</div>
                ) : (
                  writerAgents.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAgent(a)}
                      className="flex flex-col items-center gap-2 p-6 rounded-2xl shadow-lg border-1 border-[var(--primary)] bg-[var(--card)] hover:scale-105 hover:shadow-2xl transition-all"
                    >
                      <Image src={a.logo || "/images/default/avatars/logo.png"} alt={a.name} width={100} height={100} className="rounded-full object-cover border-2 border-[var(--primary)] mb-2" />
                      <span className="text-xl font-bold text-[var(--primary)]">{a.name}</span>
                      <span className="text-sm text-[var(--foreground)]/70">{worldsMap[a.world_id]?.name}</span>
                      <span className="italic text-xs text-[var(--accent)] text-center">
                        {AGENT_PERSONALITIES[a.name] || AGENT_PERSONALITIES.default}
                      </span>
                    </button>
                  ))
                )}
              </div>
              </div>
           
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const conceptMap: Record<number, any> = {};
  concepts.forEach(c => { conceptMap[c.id] = c; });

  const pageMap: Record<number, any> = {};
  pages.forEach(p => { pageMap[p.id] = p; });

  const agentWriterJobs = writerJobs.filter(j => j.agent_id === selectedAgent.id);
  const runningJobs = agentWriterJobs.filter(j => j.status !== 'done');
  const waitingJobs = agentWriterJobs.filter(j => j.status === 'done' && !completedJobs.find(c => c.job_id === j.job_id));
  const doneJobs = completedJobs
    .filter(c => c.agent_id === selectedAgent.id)
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    .slice(0, 3);

  let filtered = pages.filter(
    p => p.name?.toLowerCase().includes(search.toLowerCase()) && p.content && p.content.trim() !== ""
  );

  filtered.sort((a, b) => {
    let va: any;
    let vb: any;
    if (sortField === "name") { va = a.name; vb = b.name; }
    else if (sortField === "concept") { va = conceptMap[a.concept_id]?.name || ""; vb = conceptMap[b.concept_id]?.name || ""; }
    else if (sortField === "autogenerated") { va = a.autogenerated_content ? 1 : 0; vb = b.autogenerated_content ? 1 : 0; }
    else { va = a.updated_at || ""; vb = b.updated_at || ""; }
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);

  function changeSort(field: string) {
    if (sortField === field) setSortAsc(!sortAsc); else { setSortField(field); setSortAsc(true); }
  }

  // --- After agent selected: the Agent's Scriptorium ---
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] px-2 sm:px-6 py-10">
          <div className="mx-auto max-w-5xl w-full flex flex-col gap-8">

            {/* Agent Greeting */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-[#29196620] via-[#7b2ff25] to-[#36205a15] bg-white/15 p-6 rounded-2xl shadow-xl border-1 border-[var(--primary)]">
              <Image src={selectedAgent.logo || "/images/default/avatars/logo.png"} alt={selectedAgent.name} width={160} height={160} className="w-50 h-50 rounded-full object-cover border-2 border-[var(--primary)] shadow" />
              <div className="flex-1 flex flex-col gap-1">
                <h2 className="text-2xl font-extrabold text-[var(--primary)] mb-1">{selectedAgent.name}</h2>
                <span className="text-md text-[var(--foreground)]/80 mb-1">{worldsMap[selectedAgent.world_id]?.name || ""}</span>
                <div className="italic text-[var(--accent)] mb-1">{AGENT_PERSONALITIES[selectedAgent.name] || AGENT_PERSONALITIES.default}</div>
                <p className="mb-1">I am your Scribe for <span className="font-semibold">{worldsMap[selectedAgent.world_id]?.name}</span>.  
                  <br/>Show me which stories, chronicles, or pages to read, and together we’ll forge new legends for your world!
                </p>
              </div>
              <button onClick={() => { setSelectedAgent(null); setSearch(""); }} className="mt-4 sm:mt-0 sm:ml-auto px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold shadow hover:bg-[var(--accent)] transition">
                Choose a Different Scribe
              </button>
            </div>

            {(runningJobs.length > 0 || waitingJobs.length > 0 || doneJobs.length > 0) && (
              <div className="overflow-x-auto border border-[var(--border)] rounded-xl bg-[var(--card)] shadow-sm">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--primary)]">
                      <th className="p-2">Status</th>
                      <th className="p-2">Page</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Started</th>
                      <th className="p-2">Ended</th>
                      <th className="p-2">Duration</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {runningJobs.map(job => (
                      <tr key={job.job_id} className="border-t border-[var(--border)]">
                        <td className="p-2 text-yellow-600">Running</td>
                        <td className="p-2">{pageMap[job.page_id]?.name || job.page_id}</td>
                        <td className="p-2">{job.job_type}</td>
                        <td className="p-2">{job.start_time ? new Date(job.start_time).toLocaleString() : '-'}</td>
                        <td className="p-2">-</td>
                        <td className="p-2">-</td>
                        <td className="p-2"></td>
                      </tr>
                    ))}
                    {waitingJobs.map(job => (
                      <tr key={job.job_id} className="border-t border-[var(--border)]">
                        <td className="p-2 text-blue-600">Waiting Review</td>
                        <td className="p-2">{pageMap[job.page_id]?.name || job.page_id}</td>
                        <td className="p-2">{job.job_type}</td>
                        <td className="p-2">{job.start_time ? new Date(job.start_time).toLocaleString() : '-'}</td>
                        <td className="p-2">{job.end_time ? new Date(job.end_time).toLocaleString() : '-'}</td>
                        <td className="p-2">{job.start_time && job.end_time ? Math.round((new Date(job.end_time).getTime() - new Date(job.start_time).getTime())/1000) + 's' : '-'}</td>
                        <td className="p-2">
                          {job.job_type === 'analyze_page' ? (
                            <Link className="text-blue-600 underline" href={`/agent_writer/${selectedAgent.id}/suggestions/${job.job_id}`}>Review suggestions</Link>
                          ) : (
                            <Link className="text-blue-600 underline" href={`/agent_writer/${selectedAgent.id}/review/${job.job_id}`}>Review pages</Link>
                          )}
                          <button onClick={() => markJobCompleted(job)} className="ml-2 text-xs text-[var(--foreground)] border border-[var(--border)] px-2 py-1 rounded">Mark done</button>
                        </td>
                      </tr>
                    ))}
                    {doneJobs.map(job => (
                      <tr key={job.job_id} className="border-t border-[var(--border)] text-[var(--muted-foreground)]">
                        <td className="p-2">Done</td>
                        <td className="p-2">{job.page_name}</td>
                        <td className="p-2">{job.job_type}</td>
                        <td className="p-2">{job.start_time ? new Date(job.start_time).toLocaleString() : '-'}</td>
                        <td className="p-2">{job.end_time ? new Date(job.end_time).toLocaleString() : '-'}</td>
                        <td className="p-2">{job.start_time && job.end_time ? Math.round((new Date(job.end_time).getTime() - new Date(job.start_time).getTime())/1000) + 's' : '-'}</td>
                        <td className="p-2"></td>
                      </tr>
                    ))}
                    {runningJobs.length === 0 && waitingJobs.length === 0 && doneJobs.length === 0 && (
                      <tr><td colSpan={7} className="p-2 text-center">No jobs</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pages = “Library of Lore” */}
            <div>
              <div className="flex flex-col sm:flex-row items-end gap-4 mt-10 mb-2">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1 text-[var(--primary)]">Library of Lore</h3>
                  <p className="text-[var(--foreground)]/80 mb-2">
                    These are the tomes and scrolls I can study. Choose which tales inspire our next creation!
                  </p>
                </div>
                <input
                  className="px-3 py-2 rounded-xl border border-[var(--primary)] bg-[var(--card-bg)] text-sm w-full sm:w-64"
                  placeholder="Search lore..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPageIndex(0); }}
                />
                <button
                  disabled={selectedPages.length === 0}
                  onClick={async () => {
                    const res = await startBulkAnalyze(selectedAgent.id, selectedPages, token || "");
                    const names = pages.filter(p => selectedPages.includes(p.id)).map(p => p.name);
                    setJobs(j => [...j, { id: res.job_id, pages: names, status: "queued" }]);
                    setSelectedPages([]);
                  }}
                  className="px-3 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm disabled:opacity-50"
                >
                  Process Selected
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[var(--border)] shadow-sm">
                <table className="min-w-full text-sm bg-[var(--card)]">
                  <thead>
                    <tr className="text-left text-[var(--primary)]">
                      <th className="w-8"></th>
                      <th className="w-25"></th>
                      {/* <th className="cursor-pointer">Image</th> */}
                      <th className="cursor-pointer" onClick={() => changeSort('name')}>Name</th>
                      <th className="cursor-pointer" onClick={() => changeSort('concept')}>Concept</th>
                      <th className="cursor-pointer" onClick={() => changeSort('autogenerated')}>Has AI Content?</th>
                      <th className="cursor-pointer" onClick={() => changeSort('updated_at')}>Updated</th>
                      {/* <th className="cursor-pointer" ></th> */}
                      <th className="w-48"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(p => (
                      <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--surface)] transition">
                        <td className="px-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedPages.includes(p.id)}
                            onChange={e => {
                              setSelectedPages(sp => e.target.checked ? [...sp, p.id] : sp.filter(id => id !== p.id));
                            }}
                          />
                        </td>
                        <td className="py-2">
                          <Image src={p.logo || "/images/pages/concept/concept.png"} alt={p.name} width={64} height={64} className="w-20 h-20 rounded object-cover px-2" />
                        </td>
                        <td className="py-2 font-semibold">{p.name}</td>
                        <td className="py-2">{conceptMap[p.concept_id]?.name || ""}</td>
                        <td className="py-2 text-center">{p.autogenerated_content ? 'Yes' : 'No'}</td>
                        <td className="py-2">{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '-'}</td>
                        <td className="py-2 px-2 text-right">
                          <button
                            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold hover:bg-[var(--accent)] transition"
                            onClick={async () => {
                              const res = await startAnalyzeJob(selectedAgent.id, p.id, token || "");
                              setJobs(j => [...j, { id: res.job_id, pages: [p.name], status: "queued" }]);
                            }}
                          >
                            Start Job
                          </button>
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-4">No lore found. Try a different search.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <button
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex(p => Math.max(0, p - 1))}
                  className="px-3 py-1 rounded-xl border border-[var(--primary)] text-[var(--primary)] disabled:opacity-50 font-semibold"
                >
                  Previous
                </button>
                <span className="text-sm">Page {pageIndex + 1} of {totalPages}</span>
                <button
                  disabled={pageIndex >= totalPages - 1}
                  onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))}
                  className="px-3 py-1 rounded-xl border border-[var(--primary)] text-[var(--primary)] disabled:opacity-50 font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
