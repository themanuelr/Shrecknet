import useSWR from "swr";
import { listWriterJobs } from "./agentAPI";
import { useAuth } from "../components/auth/AuthProvider";

export function useWriterJobs() {
  const { token } = useAuth();
  const fetcher = () => listWriterJobs(token || "");
  const { data, error, mutate } = useSWR(
    token ? ["writer-jobs", token] : null,
    fetcher,
    { refreshInterval: 2000 }
  );
  return { jobs: data || [], error, mutate };
}
