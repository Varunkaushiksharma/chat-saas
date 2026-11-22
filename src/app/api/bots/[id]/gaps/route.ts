import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { requireBot, requireUser } from "@/lib/auth";

// "Questions your bot couldn't answer": customer questions that ended in a hand-off because the
// knowledge had no good match (not the ones you deliberately route to a human with a keyword rule).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireUser();
    await requireBot(supabase, id);

    const { data: convs } = await supabase
      .from("conversations")
      .select("id")
      .eq("bot_id", id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (!convs?.length) return NextResponse.json({ gaps: [] });

    const { data: msgs } = await supabase
      .from("messages")
      .select("conversation_id,role,content,flags,confidence,created_at")
      .in("conversation_id", convs.map((c) => c.id))
      .order("created_at", { ascending: true })
      .limit(2000);

    const lastCustomer = new Map<string, string>();
    const found = new Map<string, { question: string; count: number; last: string }>();
    for (const m of msgs ?? []) {
      if (m.role === "customer") {
        lastCustomer.set(m.conversation_id, m.content);
      } else if (m.role === "bot" && (m.flags ?? []).includes("handoff") && (m.confidence ?? 0) < 0.999) {
        const q = lastCustomer.get(m.conversation_id);
        if (!q) continue;
        const key = q.trim().toLowerCase();
        const cur = found.get(key);
        found.set(key, { question: q.trim(), count: (cur?.count ?? 0) + 1, last: m.created_at });
      }
    }
    const gaps = [...found.values()].sort((a, b) => b.last.localeCompare(a.last)).slice(0, 12);
    return NextResponse.json({ gaps });
  });
}
