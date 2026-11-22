import { HttpError } from "@/lib/api";
import type { AuthedClient } from "@/lib/auth";
import { ingestKnowledge } from "@/lib/knowledge/ingest";
import { RESERVED, toBlock } from "@/lib/knowledge/specs";
import { getLLM } from "@/lib/llm";

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * Adds ONE question and answer to the bot's FAQs without touching (or re-reading) the other FAQs.
 * If the same question is already there, its answer is replaced instead of duplicated.
 */
export async function appendFaq(
  supabase: AuthedClient,
  bot: { id: string; tenant_id: string },
  questionRaw: string,
  answerRaw: string,
): Promise<{ replaced: boolean }> {
  const question = questionRaw.replace(/\s+/g, " ").trim();
  const answer = answerRaw.trim();
  if (!question || !answer) throw new HttpError("Write both a question and an answer.");
  const block = toBlock([["Question", question], ["Answer", answer]]);

  const { data: source } = await supabase.from("knowledge_sources").select("id").eq("bot_id", bot.id).eq("title", RESERVED.faqs).maybeSingle();
  if (!source) {
    await ingestKnowledge(supabase, bot, { title: RESERVED.faqs, text: block, mode: "paragraphs" });
    return { replaced: false };
  }

  const [vector] = await getLLM().embed([block], "document");
  const { data: chunks } = await supabase.from("kb_chunks").select("id,content").eq("source_id", source.id);
  const same = (chunks ?? []).find((c) => {
    const m = /^Question:\s*([\s\S]*?)(?:\n|$)/.exec(c.content as string);
    return m && norm(m[1]) === norm(question);
  });

  if (same) {
    const { error } = await supabase.from("kb_chunks").update({ content: block, embedding: vector }).eq("id", same.id);
    if (error) throw new Error(error.message);
    return { replaced: true };
  }
  const { error } = await supabase
    .from("kb_chunks")
    .insert({ source_id: source.id, tenant_id: bot.tenant_id, bot_id: bot.id, content: block, embedding: vector });
  if (error) throw new Error(error.message);
  await supabase.from("knowledge_sources").update({ status: "ready" }).eq("id", source.id);
  return { replaced: false };
}
