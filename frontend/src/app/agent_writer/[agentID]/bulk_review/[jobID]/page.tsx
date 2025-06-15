"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import AuthGuard from "../../../components/auth/AuthGuard";
import { useAuth } from "../../../components/auth/AuthProvider";
import { getBulkJob } from "../../../lib/agentAPI";

export default function BulkReview() {
  const { agentID, jobID } = useParams();
  const { token } = useAuth();
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    if (!jobID || !token) return;
    getBulkJob(jobID as string, token)
      .then((data) => setJob(data))
      .catch((e) => console.error(e));
  }, [jobID, token]);

  const suggestions = job?.suggestions || [];

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6 text-[var(--foreground)]">
          <h1 className="text-2xl font-bold mb-4">Bulk Suggestions</h1>
          {suggestions.length === 0 ? (
            <p>No suggestions ready.</p>
          ) : (
            <ul className="list-disc pl-4 space-y-2">
              {suggestions.map((s: any, idx: number) => (
                <li key={idx}>
                  {s.name} ({s.concept}) - from {s.source_page_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
