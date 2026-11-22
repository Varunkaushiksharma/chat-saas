import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireBot, requireUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireUser();
    await requireBot(supabase, id);
    const { data, error } = await supabase.from("bot_rules").select("id,type,value").eq("bot_id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ rules: data });
  });
}

const schema = z.object({
  type: z.enum(["forbid_topic", "always_handoff"]),
  value: z.string().trim().min(2, "Enter at least 2 characters").max(60),
});

export async function POST(req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const body = schema.parse(await req.json());
    const { supabase } = await requireUser();
    const bot = await requireBot(supabase, id);
    const { data, error } = await supabase
      .from("bot_rules")
      .insert({ bot_id: bot.id, tenant_id: bot.tenant_id, ...body })
      .select("id,type,value")
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ rule: data });
  });
}
