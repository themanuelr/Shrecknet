"use client";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../../components/DashboardLayout";
import AuthGuard from "../../../components/auth/AuthGuard";
import { useAuth } from "../../../components/auth/AuthProvider";
import { useEffect, useState } from "react";
import { getWriterJob, startGenerateJob } from "../../../lib/agentAPI";

export default function SuggestionsPage() {
  const { agentID, jobID } = useParams();
  const { token } = useAuth();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!jobID || !token) return;
    getWriterJob(jobID as string, token)
      .then(setJob)
      .catch(() => {});
  }, [jobID, token]);

  if (!job) return <AuthGuard><DashboardLayout>Loading...</DashboardLayout></AuthGuard>;
  const suggestions = job.suggestions || [];

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6 text-[var(--foreground)] max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Suggestions</h1>
          {suggestions.length === 0 ? (
            <p>No suggestions.</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {suggestions.map((s: any, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <input type="checkbox" checked={selected.includes(s.name)} onChange={e => {
                    setSelected(sel => e.target.checked ? [...sel, s.name] : sel.filter(n => n!==s.name));
                  }} />
                  <span>{s.name} ({s.concept})</span>
                </li>
              ))}
            </ul>
          )}
          <button
            disabled={selected.length === 0}
            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-50"
            onClick={async () => {
              const pages = suggestions.filter((s:any)=>selected.includes(s.name)).map((s:any)=>({name:s.name, concept_id:s.concept_id}));
              const res = await startGenerateJob(Number(agentID), job.page_id, pages, token || "");
              router.push(`/agent_writer/${agentID}`);
            }}
          >Generate Pages</button>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
