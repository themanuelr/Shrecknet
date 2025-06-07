import useSWR from "swr";
import { getAgents } from "./agentAPI";
import { useAuth } from "../components/auth/AuthProvider";

export function useAgents(world_id?: number) {
  const { token } = useAuth();
  const fetcher = () => getAgents(token || "", { world_id });
  const { data, error, mutate, isLoading } = useSWR(
    token ? ["agents", world_id || "all", token] : null,
    fetcher
  );
  return { agents: data || [], error, mutate, isLoading };
}
