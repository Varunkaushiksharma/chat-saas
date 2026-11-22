import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { requireBot, requireUser } from "@/lib/auth";
import { autofillFromPages } from "@/lib/knowledge/autofill";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

const schema = z.object({
  pages: z
    .array(z.object({ url: z.string().max(500), title: z.string().max(200), text: z.string().max(12_000) }))
    .min(1, "Pick at least one page")
    .max(40),
});

// The AI reads the chosen pages and proposes the Business profile, products, policies and FAQs.
// Nothing is saved here: the dashboard opens each form pre-filled so the owner can check it first.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { pages } = schema.parse(await req.json());
    const { supabase, user } = await requireUser();
    await requireBot(supabase, id);
    if (!rateLimit(`autofill:${user.id}`, 10, 10 * 60_000)) {
      throw new HttpError("You've used autofill a lot just now. Please wait a few minutes and try again.", 429);
    }
    try {
      return NextResponse.json(await autofillFromPages(pages));
    } catch (e) {
      const msg = (e as Error).message;
      if (/couldn't read/.test(msg)) throw new HttpError(msg, 502);
      console.error("autofill failed:", msg);
      throw new HttpError("The AI couldn't read those pages right now. Please try again in a moment.", 502);
    }
  });
}
