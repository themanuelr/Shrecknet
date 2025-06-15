import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function AgentGrid({
  agents,
  onEdit,
  onDelete,
  onRebuild,
  updatingAgentId,
  jobsByAgent,
}: {
  agents: any[];
  onEdit: (a: any) => void;
  onDelete: (a: any) => void;
  onRebuild: (a: any) => void;
  updatingAgentId?: number | null;
  jobsByAgent?: Record<number, any[]>;

}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {agents.map(agent => (
        <div
          key={agent.id}
          className="relative bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] shadow-xl flex flex-col items-center p-6"
        >
          <Image
            src={agent.logo || "/uploads/default/avatars/logo.png"}
            alt={agent.name}
            width={400}
            height={400}
            className="w-20 h-20 rounded-full object-cover mb-3"
          />
          <div className="text-lg font-bold text-[var(--primary)] mb-1 truncate w-full text-center">
            {agent.name}
          </div>
          <div className="text-xs text-[var(--foreground)]/70 mb-2">
            World ID: {agent.world_id}
          </div>
          {agent.vector_db_update_date && agent.task === "conversational" && (
            <div className="text-xs text-[var(--foreground)]/70 mb-2">
              Vector DB updated: {new Date(agent.vector_db_update_date).toLocaleString()}
            </div>
          )}
          <div className="flex gap-2 mt-1">
            <button
              className="px-3 py-1 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm shadow"
              onClick={() => onEdit(agent)}
            >
              Edit
            </button>
            <button
              className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm shadow"
              onClick={() => onDelete(agent)}
            >
              Delete
            </button>
          </div>
          {agent.task === "conversational" && (
            updatingAgentId === agent.id ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-[var(--primary)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Wait, I am updating the vector db...
              </div>
            ) : (
              <button
                className="mt-3 px-4 py-1 rounded-lg border border-[var(--primary)] text-[var(--primary)] text-sm hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition"
                onClick={() => onRebuild(agent)}
              >
                Update Vector DB
              </button>
            )
          )}

          {agent.task === "conversational" && jobsByAgent && (
            (() => {
              const jobs = jobsByAgent[agent.id] || [];
              const running = jobs.filter(j => j.status !== "done");
              const completed = jobs
                .filter(j => j.status === "done")
                .sort((a, b) =>
                  new Date(b.end_time || b.start_time).getTime() -
                  new Date(a.end_time || a.start_time).getTime(),
                )
                .slice(0, 3);
              const allJobs = [...running, ...completed];
              if (allJobs.length === 0) return null;
              return (
                <table className="mt-3 w-full text-xs border border-[var(--border)]">
                  <thead>
                    <tr className="bg-[var(--surface)]">
                      <th className="border px-1 py-0.5 text-left">Job</th>
                      <th className="border px-1 py-0.5 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allJobs.map(j => {
                      let status = j.status;
                      if (j.status === "done" && j.start_time && j.end_time) {
                        const dur = Math.round(
                          (new Date(j.end_time).getTime() -
                            new Date(j.start_time).getTime()) /
                            1000,
                        );
                        status += ` (${dur}s)`;
                      }
                      return (
                        <tr key={j.job_id}>
                          <td className="border px-1 py-0.5 truncate max-w-[80px]">
                            {j.job_id.slice(0, 8)}
                          </td>
                          <td className="border px-1 py-0.5">{status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()
          )}
        </div>
      ))}
    </div>
  );
}
