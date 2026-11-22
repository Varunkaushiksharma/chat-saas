import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireBot, requireUser } from "@/lib/auth";
import { ingestKnowledge } from "@/lib/knowledge/ingest";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  title: z.string().trim().min(1, "Add a title").max(120),
  text: z.string().trim().min(1, "Add some text").max(60_000, "Text is too long (max 60,000 characters)"),
  mode: z.enum(["auto", "paragraphs"]).default("auto"),
});

export async function POST(req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const body = schema.parse(await req.json());
    const { supabase } = await requireUser();
    const bot = await requireBot(supabase, id);
    const r = await ingestKnowledge(supabase, bot, body);
    return NextResponse.json({ ok: true, ...r });
  });
}

export async function GET(_req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireUser();
    await requireBot(supabase, id);
    const { data, error } = await supabase
      .from("knowledge_sources")
      .select("id,title,status,created_at")
      .eq("bot_id", id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ sources: data });
  });
}
