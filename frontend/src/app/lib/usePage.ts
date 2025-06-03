// app/hooks/usePages.ts
import useSWR from "swr";
import { getPages } from "@/app/lib/pagesAPI";
import { useAuth } from "@/app/components/auth/AuthProvider";

// Pass no params for all pages, or { gameworld_id } for current world only
export function usePages(params = {}) {
  const { token } = useAuth();
  const key = token ? ["pages", JSON.stringify(params), token] : null;
  const fetcher = (token: string, params: unknown) => getPages(token, params);

  const { data, error, mutate, isLoading } = useSWR(
    key,
    () => fetcher(token, params)
  );
  return {
    pages: data || [],
    error,
    mutate,
    isLoading,
  };
}
