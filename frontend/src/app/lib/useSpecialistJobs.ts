import useSWR from "swr";
import { listVectorJobs } from "./specialistAPI";
import { useAuth } from "../components/auth/AuthProvider";

export function useSpecialistJobs() {
  const { token } = useAuth();
  const fetcher = () => listVectorJobs(token || "");
  const { data, error, mutate } = useSWR(
    token ? ["specialist-jobs", token] : null,
    fetcher,
    { refreshInterval: 2000 }
  );
  return { jobs: data || [], error, mutate };
}
