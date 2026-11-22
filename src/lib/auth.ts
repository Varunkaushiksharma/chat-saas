import { HttpError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Claimed = { id: string; email?: string; user_metadata: Record<string, unknown> };

type Membership = { tenant_id: string; tenants: { created_at: string } | { created_at: string }[] | null };

// All of the user's workspaces, oldest first (ties broken by id), so every request agrees on the same one.
async function myWorkspaces(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("tenant_members").select("tenant_id,tenants(created_at)").eq("user_id", userId);
  return ((data ?? []) as unknown as Membership[])
    .map((m) => ({ id: m.tenant_id, at: String((Array.isArray(m.tenants) ? m.tenants[0] : m.tenants)?.created_at ?? "") }))
    .sort((x, y) => x.at.localeCompare(y.at) || x.id.localeCompare(y.id));
}

// First visit after signup: find the user's business workspace, or create it.
async function resolveTenant(supabase: Awaited<ReturnType<typeof createClient>>, user: Claimed) {
  const existing = await myWorkspaces(supabase, user.id);
  if (existing.length) return existing[0].id;

  const admin = createAdminClient();
  const name =
    (user.user_metadata?.business_name as string | undefined)?.trim() || user.email?.split("@")[0] || "My business";
  const { data: tenant, error } = await admin.from("tenants").insert({ name }).select("id").single();
  if (error) throw new Error(error.message);
  const { error: mErr } = await admin.from("tenant_members").insert({ tenant_id: tenant.id, user_id: user.id, role: "owner" });
  if (mErr) throw new Error(mErr.message);

  // A dashboard fires several requests at once on the first visit, so each may have just created one.
  // Everyone keeps the oldest and removes their own extra (deleting the workspace removes its membership too).
  const after = await myWorkspaces(supabase, user.id);
  const keeper = after[0]?.id ?? (tenant.id as string);
  if (keeper !== tenant.id) await admin.from("tenants").delete().eq("id", tenant.id);
  return keeper;
}

// Authenticates the request and returns a Supabase client that acts AS THE USER,
// so Row Level Security restricts every query to their own business.
//
// Speed: the sign-in token is verified locally (getClaims), with no network call to the auth server.
// The workspace lookup is lazy: most routes never need it (row-level security already scopes their
// data), so only call getTenantId() when you really need the id.
export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) throw new HttpError("Not signed in", 401);

  const user: Claimed = {
    id: claims.sub,
    email: claims.email as string | undefined,
    user_metadata: (claims.user_metadata ?? {}) as Record<string, unknown>,
  };

  let tenant: Promise<string> | null = null;
  const getTenantId = () => (tenant ??= resolveTenant(supabase, user));
  return { supabase, user, getTenantId };
}

export type AuthedClient = Awaited<ReturnType<typeof requireUser>>["supabase"];

// Loads a bot the current user owns (RLS hides everyone else's), or 404.
export async function requireBot(supabase: AuthedClient, botId: string) {
  const { data: bot } = await supabase.from("bots").select("*").eq("id", botId).maybeSingle();
  if (!bot) throw new HttpError("Bot not found", 404);
  return bot as {
    id: string;
    tenant_id: string;
    name: string;
    tone: string;
    system_instructions: string;
    fallback_message: string;
    confidence_threshold: number;
    public_key: string;
    allowed_domains: string[];
    created_at: string;
  };
}
