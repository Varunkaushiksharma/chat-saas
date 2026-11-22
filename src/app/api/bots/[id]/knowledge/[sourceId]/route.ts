import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { requireBot, requireUser } from "@/lib/auth";
import { ingestKnowledge } from "@/lib/knowledge/ingest";

type Ctx = { params: Promise<{ id: string; sourceId: string }> };

// Read one entry back (used to re-open a section in its form).
export async function GET(_req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id, sourceId } = await ctx.params;
    const { supabase } = await requireUser();
    await requireBot(supabase, id);
    const { data: source } = await supabase.from("knowledge_sources").select("id,title").eq("id", sourceId).eq("bot_id", id).maybeSingle();
    if (!source) throw new HttpError("Entry not found", 404);
    const { data: chunks, error } = await supabase
      .from("kb_chunks")
      .select("content,created_at")
      .eq("source_id", sourceId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return NextResponse.json({ title: source.title, text: (chunks ?? []).map((c) => c.content).join("\n\n") });
  });
}

const replaceSchema = z.object({
  title: z.string().trim().min(1).max(120),
  text: z.string().trim().min(1, "Add some text").max(60_000),
  mode: z.enum(["auto", "paragraphs"]).default("paragraphs"),
});

// Replace an entry's content (edit a section).
export async function PUT(req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id, sourceId } = await ctx.params;
    const body = replaceSchema.parse(await req.json());
    const { supabase } = await requireUser();
    const bot = await requireBot(supabase, id);
    const r = await ingestKnowledge(supabase, bot, { ...body, replaceSourceId: sourceId });
    return NextResponse.json({ ok: true, ...r });
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id, sourceId } = await ctx.params;
    const { supabase } = await requireUser();
    await requireBot(supabase, id);
    // chunks are removed automatically (ON DELETE CASCADE)
    const { error } = await supabase.from("knowledge_sources").delete().eq("id", sourceId).eq("bot_id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  });
}
