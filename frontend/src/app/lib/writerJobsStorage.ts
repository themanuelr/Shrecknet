export interface WriterJob {
  job_id?: string;
  id?: string;
  agent_id: number;
  page_id?: number;
  job_type?: string;
  pages?: any[];
  start_time?: string;
  end_time?: string;
}

export interface CompletedWriterJob {
  job_id: string;
  agent_id: number;
  page_id?: number;
  page_name: string;
  job_type: string;
  start_time?: string;
  end_time?: string;
  completed_at: string;
}

export function loadCompletedJobs(): CompletedWriterJob[] {
  const stored = localStorage.getItem("writer_completed_jobs");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      /* ignore */
    }
  }
  return [];
}

export function saveCompletedJobs(jobs: CompletedWriterJob[]) {
  localStorage.setItem("writer_completed_jobs", JSON.stringify(jobs));
}

export function markWriterJobCompleted(
  job: WriterJob,
  pageName: string = ""
): CompletedWriterJob[] {
  const current = loadCompletedJobs();
  const entry: CompletedWriterJob = {
    job_id: job.job_id || (job as any).id,
    agent_id: job.agent_id,
    page_id: job.page_id,
    page_name: pageName,
    job_type: job.job_type || "bulk_analyze",
    start_time: job.start_time,
    end_time: job.end_time,
    completed_at: new Date().toISOString(),
  };
  const filtered = current.filter((j) => j.job_id !== entry.job_id);
  const updated = [...filtered, entry];
  saveCompletedJobs(updated);
  return updated;
}
