import useSWR from "swr";
import { listVectorJobs } from "./vectordbAPI";
import { useAuth } from "../components/auth/AuthProvider";

export function useVectorJobs() {
  const { token } = useAuth();
  const fetcher = () => listVectorJobs(token || "");
  const { data, error, mutate } = useSWR(
    token ? ["vector-jobs", token] : null,
    fetcher,
    { refreshInterval: 2000 }
  );
  return { jobs: data || [], error, mutate };
}
