import useSWR from "swr";
import { getPagesForConcept } from "./pagesAPI";
import { useAuth } from "../components/auth/AuthProvider";

export function usePagesForConcept(conceptId?: number) {
  const { token } = useAuth();
  const fetcher = () => getPagesForConcept(conceptId!, token);
  const { data, error, mutate, isLoading } = useSWR(
    conceptId && token ? ["pagesForConcept", conceptId, token] : null,
    fetcher
  );
  return { pages: data || [], error, mutate, isLoading };
}
