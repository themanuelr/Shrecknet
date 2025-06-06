import useSWR from "swr";
import { getConcept } from "./conceptsAPI";
import { useAuth } from "../components/auth/AuthProvider";

export function useConceptById(conceptId?: number) {
  const { token } = useAuth();
  const fetcher = () => getConcept(conceptId!, token);
  const { data, error, mutate, isLoading } = useSWR(
    conceptId && token ? ["concept", conceptId, token] : null,
    fetcher
  );
  return { concept: data || null, error, mutate, isLoading };
}
