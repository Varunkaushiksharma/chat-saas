import { createClient } from "@supabase/supabase-js";

// Server-only. Bypasses RLS: only use in API routes/webhooks, and always
// derive tenant_id from a verified source (session or bot public key).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars are not set");
  return createClient(url, key, { auth: { persistSession: false } });
}
