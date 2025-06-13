import useSWR from "swr";
import { getAgent } from "./agentAPI";
import { useAuth } from "../components/auth/AuthProvider";

export function useAgentById(agentId?: number) {
  const { token } = useAuth();
  const fetcher = () => getAgent(agentId!, token);
  const { data, error, mutate, isLoading } = useSWR(
    agentId && token ? ["agent", agentId, token] : null,
    fetcher
  );
  return { agent: data || null, error, mutate, isLoading };
}
