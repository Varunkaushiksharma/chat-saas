import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireBot, requireUser } from "@/lib/auth";
import { runTurn } from "@/lib/engine/turn";
import { rateLimit } from "@/lib/ratelimit";

// Dashboard "Test" chat. It runs the exact same pipeline as the website widget, and the chat is saved
// as a "Test chat" so you can see a hand-off arrive in the Inbox and try replying to it.
const schema = z.object({
  botId: z.string().uuid(),
  message: z.string().trim().min(1).max(1000),
  conversationId: z.string().uuid().nullish(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = schema.parse(await req.json());
    const { supabase, user } = await requireUser();
    const bot = await requireBot(supabase, body.botId);
    if (!rateLimit(`test:${user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Slow down a little, then try again." }, { status: 429 });
    }
    const r = await runTurn(supabase, bot, {
      message: body.message,
      conversationId: body.conversationId,
      channel: "test",
      customerRef: "Dashboard test",
    });
    return NextResponse.json(r);
  });
}
