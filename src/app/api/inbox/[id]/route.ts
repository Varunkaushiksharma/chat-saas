import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { requireUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

async function loadConversation(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], id: string) {
  const { data } = await supabase.from("conversations").select("id,tenant_id,status").eq("id", id).maybeSingle();
  if (!data) throw new HttpError("Conversation not found", 404);
  return data as { id: string; tenant_id: string; status: "bot" | "human" | "closed" };
}

export async function GET(_req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireUser();
    const conv = await loadConversation(supabase, id);
    const { data, error } = await supabase
      .from("messages")
      .select("id,role,content,confidence,created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    return NextResponse.json({ status: conv.status, messages: data });
  });
}

// Human agent replies. The conversation stays in "human" mode so the bot is quiet.
const replySchema = z.object({ content: z.string().trim().min(1).max(2000) });

export async function POST(req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { content } = replySchema.parse(await req.json());
    const { supabase } = await requireUser();
    const conv = await loadConversation(supabase, id);
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: id, tenant_id: conv.tenant_id, role: "agent", content });
    if (error) throw new Error(error.message);
    if (conv.status !== "human") await supabase.from("conversations").update({ status: "human" }).eq("id", id);
    return NextResponse.json({ ok: true });
  });
}

const statusSchema = z.object({ status: z.enum(["bot", "human", "closed"]) });

export async function PATCH(req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { status } = statusSchema.parse(await req.json());
    const { supabase } = await requireUser();
    await loadConversation(supabase, id);
    const { error } = await supabase.from("conversations").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, status });
  });
}
