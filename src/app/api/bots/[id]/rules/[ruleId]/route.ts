import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { requireBot, requireUser } from "@/lib/auth";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string; ruleId: string }> }) {
  return handle(async () => {
    const { id, ruleId } = await ctx.params;
    const { supabase } = await requireUser();
    await requireBot(supabase, id);
    const { error } = await supabase.from("bot_rules").delete().eq("id", ruleId).eq("bot_id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  });
}
