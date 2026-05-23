import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthContext } from "@/contexts/AuthContext";

export function useAuth(required = true) {
  const router = useRouter();
  const auth = useAuthContext();

  useEffect(() => {
    if (required && !auth.loading && !auth.user) {
      router.replace("/login");
    }
  }, [auth.loading, auth.user, required, router]);

  return auth;
}
