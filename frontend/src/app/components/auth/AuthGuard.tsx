"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      sessionStorage.setItem("redirectAfterLogin", pathname);
      router.replace("/");
    }
  }, [isLoggedIn, loading, pathname, router]);

  if (loading) {
    return <div className="w-full text-center py-10 text-purple-900">Loading...</div>;
  }
  if (!isLoggedIn) {
    return null;
  }
  return <>{children}</>;
}