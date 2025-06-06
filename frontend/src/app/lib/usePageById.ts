import useSWR from "swr";
import { getPage } from "./pagesAPI";
import { useAuth } from "../components/auth/AuthProvider";

export function usePageById(pageId?: number) {
  const { token } = useAuth();
  const fetcher = () => getPage(pageId!, token);
  const { data, error, mutate, isLoading } = useSWR(
    pageId && token ? ["page", pageId, token] : null,
    fetcher
  );
  return { page: data || null, error, mutate, isLoading };
}
