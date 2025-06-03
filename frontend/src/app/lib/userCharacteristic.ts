import useSWR from "swr";
import { getCharacteristics } from "@/app/lib/characteristicsAPI";
import { useAuth } from "@/app/components/auth/AuthProvider";

export function useCharacteristics(gameworld_id) {
  const { token } = useAuth();
  const fetcher = () => getCharacteristics(token, { gameworld_id });
  const { data, error, isLoading, mutate } = useSWR(
    gameworld_id && token ? ["characteristics", gameworld_id, token] : null,
    fetcher
  );
  return { characteristics: data || [], error, isLoading, mutate };
}