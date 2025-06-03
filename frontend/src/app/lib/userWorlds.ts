import useSWR from "swr";
import { getGameWorlds } from "../lib/gameworldsAPI";
import { useAuth } from "../components/auth/AuthProvider";

export function useWorlds() {
    const { token } = useAuth();
    // console.log("Current token in useWorlds:", token);
    // Only fetch when token exists
    const fetcher = (t: string) => getGameWorlds(t);
  
    const { data, error, mutate, isLoading } = useSWR(
      token ? ["gameworlds", token] : null,
      () => fetcher(token)
    );
  
    return {
      worlds: data || [],
      error,
      mutate,     // call mutate() to refresh after create/edit
      isLoading,
    };
  }
  