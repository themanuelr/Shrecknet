import useSWR from "swr";
import { getCharacteristicsForConcept } from "./characteristicsAPI";
import { useAuth } from "../components/auth/AuthProvider";

export function useCharacteristicsForConcept(conceptId?: number) {
  const { token } = useAuth();
  const fetcher = () => getCharacteristicsForConcept(conceptId!, token);
  const { data, error, mutate, isLoading } = useSWR(
    conceptId && token ? ["characteristicsForConcept", conceptId, token] : null,
    fetcher
  );
  return { characteristics: data || [], error, mutate, isLoading };
}
