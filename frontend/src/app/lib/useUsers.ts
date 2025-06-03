import useSWR from "swr";
import { getUsers } from "./usersApi";
import { useAuth } from "../components/auth/AuthProvider";

export function useUsers() {
  const { token } = useAuth();

  const fetcher = (t: string) => getUsers(t);

  const { data, error, mutate, isLoading } = useSWR(
    token ? ["users", token] : null,
    () => fetcher(token)
  );

  return {
    users: data || [],
    error,
    mutate, // call mutate() to refresh after user edit/delete
    isLoading,
  };
}