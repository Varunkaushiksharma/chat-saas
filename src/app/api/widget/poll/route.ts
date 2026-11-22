import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/ratelimit";
import { createAdminClient } from "@/lib/supabase/admin";

// Public endpoint: lets the widget show human-agent replies and restore history.
const schema = z.object({ key: z.string().min(8).max(64), conversationId: z.string().uuid() });

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: cors(req.headers.get("origin")) });
}

export async function GET(req: Request) {
  const headers = cors(req.headers.get("origin"));
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (!rateLimit(`poll:${ip}`, 60, 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });

  const url = new URL(req.url);
  const parsed = schema.safeParse({
    key: url.searchParams.get("key"),
    conversationId: url.searchParams.get("conversationId"),
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400, headers });

  const db = createAdminClient();
  const { data: bot } = await db.from("bots").select("id").eq("public_key", parsed.data.key).maybeSingle();
  if (!bot) return NextResponse.json({ error: "Unknown bot" }, { status: 404, headers });

  // Conversation must belong to this bot (the key alone is not enough to read others)
  const { data: conv } = await db
    .from("conversations")
    .select("id,status")
    .eq("id", parsed.data.conversationId)
    .eq("bot_id", bot.id)
    .maybeSingle();
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404, headers });

  const { data: messages } = await db
    .from("messages")
    .select("id,role,content")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true })
    .limit(100);

  return NextResponse.json({ status: conv.status, messages: messages ?? [] }, { headers });
}
