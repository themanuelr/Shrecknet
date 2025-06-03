import useSWR from "swr";
import { getConcepts } from "@/app/lib/conceptsAPI";
import { useAuth } from "@/app/components/auth/AuthProvider";

export function useConcepts(gameworld_id) {
  const { token } = useAuth();
  const fetcher = () => getConcepts(token, { gameworld_id });
  const { data, error, isLoading, mutate } = useSWR(
    gameworld_id && token ? ["concepts", gameworld_id, token] : null,
    fetcher
  );
  return { concepts: data || [], error, isLoading, mutate };
}