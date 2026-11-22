import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export type InboxItem = {
  id: string;
  status: "bot" | "human" | "closed";
  channel: string;
  botName: string;
  lastMessage: string;
  lastRole: "customer" | "bot" | "agent" | null;
  lastAt: string;
  needsReply: boolean;
};

export async function GET() {
  return handle(async () => {
    const { supabase } = await requireUser();
    const { data: convs, error } = await supabase
      .from("conversations")
      .select("id,status,channel,created_at,bots(name)")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    if (!convs?.length) return NextResponse.json({ conversations: [] });

    const { data: msgs } = await supabase
      .from("messages")
      .select("conversation_id,role,content,created_at")
      .in("conversation_id", convs.map((c) => c.id))
      .order("created_at", { ascending: false })
      .limit(600);

    const last = new Map<string, { role: InboxItem["lastRole"]; content: string; created_at: string }>();
    for (const m of msgs ?? []) if (!last.has(m.conversation_id)) last.set(m.conversation_id, m);

    const items: InboxItem[] = convs.map((c) => {
      const l = last.get(c.id);
      const bot = c.bots as unknown as { name: string } | { name: string }[] | null;
      return {
        id: c.id,
        status: c.status,
        channel: c.channel,
        botName: (Array.isArray(bot) ? bot[0]?.name : bot?.name) ?? "Bot",
        lastMessage: l?.content ?? "",
        lastRole: l?.role ?? null,
        lastAt: l?.created_at ?? c.created_at,
        // handed to a human and no human has answered yet
        needsReply: c.status === "human" && l?.role !== "agent",
      };
    });
    items.sort((a, b) => Number(b.needsReply) - Number(a.needsReply) || b.lastAt.localeCompare(a.lastAt));
    return NextResponse.json({ conversations: items });
  });
}
