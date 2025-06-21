import useSWR from "swr";
import { listNovelistJobs } from "./agentAPI";
import { useAuth } from "../components/auth/AuthProvider";

export function useNovelistJobs() {
  const { token } = useAuth();
  const fetcher = () => listNovelistJobs(token || "");
  const { data, error, mutate } = useSWR(
    token ? ["novelist-jobs", token] : null,
    fetcher,
    { refreshInterval: 2000 }
  );
  return { jobs: data || [], error, mutate };
}
