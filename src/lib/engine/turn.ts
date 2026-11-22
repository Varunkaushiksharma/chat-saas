import type { SupabaseClient } from "@supabase/supabase-js";
import { answerQuestion } from "@/lib/engine/answer";

export type TurnResult = { reply: string; conversationId: string; handoff: boolean; confidence: number | null };

/**
 * One customer message -> saved conversation -> bot reply (or silence if a human has taken over).
 * Shared by the public website widget and the dashboard "Test" chat so they behave identically.
 * `db` decides who is acting: the service role (widget) or the signed-in user (dashboard, RLS applies).
 */
export async function runTurn(
  db: SupabaseClient,
  bot: { id: string; tenant_id: string },
  opts: { message: string; conversationId?: string | null; channel: "web" | "test"; customerRef: string },
): Promise<TurnResult> {
  // Find the conversation (it must belong to this bot) or start a new one
  let convId = opts.conversationId ?? null;
  let status = "bot";
  if (convId) {
    const { data: conv } = await db.from("conversations").select("id,status").eq("id", convId).eq("bot_id", bot.id).maybeSingle();
    if (conv) status = conv.status;
    else convId = null;
  }
  if (!convId) {
    const { data: conv, error } = await db
      .from("conversations")
      .insert({ tenant_id: bot.tenant_id, bot_id: bot.id, channel: opts.channel, customer_ref: opts.customerRef })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    convId = conv.id as string;
  }

  // History comes from the database, never from the browser
  const { data: past } = await db
    .from("messages")
    .select("role,content")
    .eq("conversation_id", convId)
    .order("created_at", { ascending: false })
    .limit(8);
  const history = (past ?? [])
    .reverse()
    .map((m) => ({
      role: (m.role === "customer" ? "user" : "assistant") as "user" | "assistant",
      content: m.content as string,
    }));

  await db.from("messages").insert({ conversation_id: convId, tenant_id: bot.tenant_id, role: "customer", content: opts.message });

  // Already handed to a human: the bot stays quiet
  if (status === "human") {
    return { reply: "A team member will reply to you here soon.", conversationId: convId, handoff: true, confidence: null };
  }

  const result = await answerQuestion({ botId: bot.id, message: opts.message, history });

  await Promise.all([
    db.from("messages").insert({
      conversation_id: convId,
      tenant_id: bot.tenant_id,
      role: "bot",
      content: result.reply,
      confidence: result.confidence,
      flags: result.handoff ? ["handoff"] : [],
    }),
    result.handoff ? db.from("conversations").update({ status: "human" }).eq("id", convId) : Promise.resolve(),
  ]);

  return { reply: result.reply, conversationId: convId, handoff: result.handoff, confidence: result.confidence };
}
