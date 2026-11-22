import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Abuse limits for the PUBLIC chat widget, stored in the database.
 *
 * The in-memory limiter (lib/ratelimit.ts) only sees one server instance, and on Vercel every request
 * can land on a different instance. These counters live in Postgres, so they hold everywhere. They exist
 * to stop a bored visitor, or a bot, from burning the AI quota that every other visitor shares.
 */
export const LIMITS = {
  messagesPerWorkspacePerHour: 300, // across all visitors of one business
  messagesPerConversation: 40, // one chat can't go on forever
  newChatsPerIpPerHour: 12, // one connection can't open endless chats
};

const HOUR = 3_600_000;

export type Verdict = { ok: true } | { ok: false; message: string };

export async function checkWidgetLimits(
  db: SupabaseClient,
  bot: { id: string; tenant_id: string },
  opts: { ip: string; conversationId?: string | null },
): Promise<Verdict> {
  const since = new Date(Date.now() - HOUR).toISOString();
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);

  const [perWorkspace, perConversation, perIp] = await Promise.all([
    count(
      db.from("messages").select("id", { count: "exact", head: true }).eq("tenant_id", bot.tenant_id).eq("role", "customer").gte("created_at", since),
    ),
    opts.conversationId
      ? count(db.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", opts.conversationId).eq("role", "customer"))
      : Promise.resolve(0),
    opts.conversationId
      ? Promise.resolve(0)
      : count(db.from("conversations").select("id", { count: "exact", head: true }).eq("customer_ref", opts.ip).gte("created_at", since)),
  ]);

  if (perWorkspace >= LIMITS.messagesPerWorkspacePerHour) {
    return { ok: false, message: "This assistant is very busy right now. Please try again in a little while." };
  }
  if (perConversation >= LIMITS.messagesPerConversation) {
    return { ok: false, message: "This chat has gotten long. Please contact the business directly for more help." };
  }
  if (perIp >= LIMITS.newChatsPerIpPerHour) {
    return { ok: false, message: "Too many new chats from your connection. Please try again later." };
  }
  return { ok: true };
}
