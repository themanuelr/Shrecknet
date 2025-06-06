import useSWR from "swr";
import { getGameWorld } from "./gameworldsAPI";
import { useAuth } from "../components/auth/AuthProvider";

export function useWorld(worldId?: number) {
  const { token } = useAuth();
  const fetcher = () => getGameWorld(worldId!, token);
  const { data, error, mutate, isLoading } = useSWR(
    worldId && token ? ["gameworld", worldId, token] : null,
    fetcher
  );
  return { world: data || null, error, mutate, isLoading };
}
