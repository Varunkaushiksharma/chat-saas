import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireBot, requireUser } from "@/lib/auth";
import { ingestKnowledge } from "@/lib/knowledge/ingest";

export const maxDuration = 60;

const schema = z.object({
  pages: z
    .array(z.object({ url: z.string().max(500), title: z.string().max(200), text: z.string().min(40).max(12_000) }))
    .min(1)
    .max(6), // the dashboard sends a few at a time so it can show progress
});

function pathOf(url: string) {
  try {
    const u = new URL(url);
    return u.pathname === "/" ? "home" : u.pathname.replace(/\/$/, "");
  } catch {
    return "";
  }
}

// Adds website pages as knowledge, one entry per page. Importing the same page again REPLACES it,
// so re-importing a site simply refreshes it.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { pages } = schema.parse(await req.json());
    const { supabase } = await requireUser();
    const bot = await requireBot(supabase, id);

    const { data: existing } = await supabase.from("knowledge_sources").select("id,title").eq("bot_id", id);
    const byTitle = new Map((existing ?? []).map((s) => [s.title as string, s.id as string]));

    let added = 0;
    let replaced = 0;
    const failed: { title: string; error: string }[] = [];
    for (const p of pages) {
      const title = `Web: ${p.title.trim() || "Page"} · ${pathOf(p.url)}`.slice(0, 120);
      const text = `Page: ${p.url}\n\n${p.text}`;
      try {
        const replaceSourceId = byTitle.get(title);
        await ingestKnowledge(supabase, bot, { title, text, mode: "auto", replaceSourceId });
        if (replaceSourceId) replaced++;
        else added++;
      } catch (e) {
        failed.push({ title: p.title, error: (e as Error).message });
      }
    }
    return NextResponse.json({ added, replaced, failed });
  });
}
