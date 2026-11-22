import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireBot, requireUser } from "@/lib/auth";
import { appendFaq } from "@/lib/knowledge/faq";

const schema = z.object({
  question: z.string().trim().min(3, "Write the customer's question").max(300),
  answer: z.string().trim().min(2, "Write the answer").max(1500),
});

// "Teach the bot this answer": adds one FAQ (used by the Inbox when the owner replies to a customer).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { question, answer } = schema.parse(await req.json());
    const { supabase } = await requireUser();
    const bot = await requireBot(supabase, id);
    const r = await appendFaq(supabase, bot, question, answer);
    return NextResponse.json({ ok: true, ...r });
  });
}
