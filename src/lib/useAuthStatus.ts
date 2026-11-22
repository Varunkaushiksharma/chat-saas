"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type AuthStatus = "loading" | "in" | "out";

/**
 * Who is signed in, for pages that are shared by everyone (so the server can't know).
 * Asks the browser, and updates live if you sign in or out.
 */
export function useAuthStatus(): AuthStatus {
  const [status, setStatus] = useState<AuthStatus>("loading");
  useEffect(() => {
    const supabase = createClient();
    let alive = true;
    supabase.auth.getSession().then(({ data }) => alive && setStatus(data.session ? "in" : "out"));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setStatus(session ? "in" : "out"));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return status;
}
