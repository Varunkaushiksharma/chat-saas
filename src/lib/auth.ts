import { HttpError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Claimed = { id: string; email?: string; user_metadata: Record<string, unknown> };

// First visit after signup: find the user's business workspace, or create it.
async function resolveTenant(supabase: Awaited<ReturnType<typeof createClient>>, user: Claimed) {
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .order("tenant_id", { ascending: true }) // deterministic if an account ever has more than one
    .limit(1)
    .maybeSingle();
  if (membership?.tenant_id) return membership.tenant_id as string;

  const admin = createAdminClient();
  const name =
    (user.user_metadata?.business_name as string | undefined)?.trim() || user.email?.split("@")[0] || "My business";
  const { data: tenant, error } = await admin.from("tenants").insert({ name }).select("id").single();
  if (error) throw new Error(error.message);
  const { error: mErr } = await admin.from("tenant_members").insert({ tenant_id: tenant.id, user_id: user.id, role: "owner" });
  if (mErr) throw new Error(mErr.message);
  return tenant.id as string;
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
