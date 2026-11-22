import { NextResponse } from "next/server";
import { z } from "zod";
import { runTurn } from "@/lib/engine/turn";
import { rateLimit } from "@/lib/ratelimit";
import { createAdminClient } from "@/lib/supabase/admin";

// Public endpoint used by the embeddable widget (any website).
// Security: bot is identified by its public key, tenant/bot ids never come from
// the client, optional allowed-domains check, rate limits, input size caps.

const schema = z.object({
  key: z.string().min(8).max(64),
  message: z.string().trim().min(1).max(1000),
  conversationId: z.string().uuid().nullish(),
});

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: cors(req.headers.get("origin")) });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const headers = cors(origin);
  const fail = (error: string, status: number) =>
    NextResponse.json({ error }, { status, headers });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
    if (!rateLimit(`ip:${ip}`, 20, 60_000)) return fail("Too many messages, slow down.", 429);

    const body = schema.safeParse(await req.json().catch(() => null));
    if (!body.success) return fail("Invalid request", 400);
    const { key, message, conversationId } = body.data;

    const db = createAdminClient();
    const { data: bot } = await db
      .from("bots")
      .select("id,tenant_id,allowed_domains,fallback_message")
      .eq("public_key", key)
      .maybeSingle();
    if (!bot) return fail("Unknown bot", 404);

    // Per-bot cap so one bot can't burn the whole Gemini quota
    if (!rateLimit(`bot:${bot.id}`, 120, 60_000)) return fail("Bot is busy, try again shortly.", 429);

    // Domain allow-list (empty list = allow all, useful while testing)
    if (bot.allowed_domains.length > 0) {
      let host = "";
      try {
        host = origin ? new URL(origin).hostname : "";
      } catch {}
      // "www.myshop.com" and "myshop.com" count as the same site
      const bare = (h: string) => h.toLowerCase().replace(/^www\./, "");
      if (!bot.allowed_domains.some((d: string) => bare(d) === bare(host))) return fail("This website is not allowed", 403);
    }

    const r = await runTurn(db, bot, { message, conversationId, channel: "web", customerRef: ip });
    return NextResponse.json({ reply: r.reply, conversationId: r.conversationId, handoff: r.handoff }, { headers });
  } catch (e) {
    console.error("widget chat error:", (e as Error).message);
    return fail("Something went wrong. Please try again.", 500);
  }
}
