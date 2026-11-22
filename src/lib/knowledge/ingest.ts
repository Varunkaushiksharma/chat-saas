import { HttpError } from "@/lib/api";
import type { AuthedClient } from "@/lib/auth";
import { getLLM } from "@/lib/llm";
import { chunkText } from "@/lib/rag/chunk";

const MAX_CHUNKS = 200;
const MAX_PARAGRAPH = 4000;
const EMBED_BATCH = 50;

/** "paragraphs": every blank-line-separated paragraph is exactly one entry (used for structured sections). */
function splitParagraphs(text: string) {
  const parts = text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.some((p) => p.length > MAX_PARAGRAPH)) throw new HttpError("One entry is too long. Please shorten it.");
  return parts;
}

async function embedAll(chunks: string[]) {
  const llm = getLLM();
  const out: number[][] = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const vectors = await llm.embed(chunks.slice(i, i + EMBED_BATCH), "document");
    out.push(...vectors);
  }
  if (out.length !== chunks.length) throw new Error("Embedding count mismatch");
  return out;
}

/**
 * Turn text into searchable knowledge for a bot. With replaceSourceId the old content is swapped
 * only AFTER the new text has been embedded, so a failure never leaves the bot with nothing.
 */
export async function ingestKnowledge(
  supabase: AuthedClient,
  bot: { id: string; tenant_id: string },
  opts: { title: string; text: string; mode: "auto" | "paragraphs"; replaceSourceId?: string },
) {
  const chunks = opts.mode === "paragraphs" ? splitParagraphs(opts.text) : chunkText(opts.text);
  if (!chunks.length) throw new HttpError("There is nothing to add yet.");
  if (chunks.length > MAX_CHUNKS) throw new HttpError(`That is too much for one entry (max ${MAX_CHUNKS} pieces). Split it up.`);

  let sourceId = opts.replaceSourceId;
  if (sourceId) {
    const { data } = await supabase.from("knowledge_sources").select("id").eq("id", sourceId).eq("bot_id", bot.id).maybeSingle();
    if (!data) throw new HttpError("Entry not found", 404);
  } else {
    const { data, error } = await supabase
      .from("knowledge_sources")
      .insert({ tenant_id: bot.tenant_id, bot_id: bot.id, type: "text", title: opts.title, status: "pending" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    sourceId = data.id as string;
  }

  try {
    const vectors = await embedAll(chunks);

    if (opts.replaceSourceId) {
      const { error } = await supabase.from("kb_chunks").delete().eq("source_id", sourceId);
      if (error) throw new Error(error.message);
    }
    const base = Date.now();
    const rows = chunks.map((content, i) => ({
      source_id: sourceId,
      tenant_id: bot.tenant_id,
      bot_id: bot.id,
      content,
      embedding: vectors[i],
      created_at: new Date(base + i).toISOString(), // keeps the original order
    }));
    // insert in slices so large entries don't exceed request limits
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await supabase.from("kb_chunks").insert(rows.slice(i, i + 100));
      if (error) throw new Error(error.message);
    }
    await supabase.from("knowledge_sources").update({ status: "ready", title: opts.title }).eq("id", sourceId);
    return { sourceId, chunks: chunks.length };
  } catch (e) {
    if (!opts.replaceSourceId) await supabase.from("knowledge_sources").update({ status: "failed" }).eq("id", sourceId);
    throw e;
  }
}
