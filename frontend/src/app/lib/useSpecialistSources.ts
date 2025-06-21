import useSWR from "swr";
import { listSources, SpecialistSource } from "./specialistAPI";
import { useAuth } from "../components/auth/AuthProvider";

export function useSpecialistSources(agentId: number) {
  const { token } = useAuth();
  const fetcher = () => listSources(agentId, token || "");
  const { data, error, mutate } = useSWR(
    token && agentId ? ["specialist-sources", agentId, token] : null,
    fetcher
  );
  return { sources: (data as SpecialistSource[]) || [], error, mutate };
}
