"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function GlobalAuthRedirect() {
  const { isLoggedIn, loading, setRedirectAfterLogin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isLoggedIn && pathname !== "/") {
      setRedirectAfterLogin(pathname);
      router.replace("/?firstLogin=1");
    }
  }, [loading, isLoggedIn, pathname, router, setRedirectAfterLogin]);

  return null;
}
