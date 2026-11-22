import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { RESERVED, scoreKnowledge } from "@/lib/knowledge/specs";

export type Overview = {
  businessName: string;
  stats: { waiting: number; conversations: number; botReplies: number; handoffs: number };
  days: { label: string; count: number }[];
  bots: { id: string; name: string; score: number; domains: number }[];
  setup: { key: string; label: string; done: boolean; href: string }[];
  totalConversations: number;
};

const DAY = 86_400_000;

export async function GET() {
  return handle(async () => {
    const { supabase, getTenantId } = await requireUser();
    const tenantId = await getTenantId();
    const since = new Date(Date.now() - 7 * DAY).toISOString();

    // Test chats from the dashboard are rehearsals: keep them out of the numbers
    const { data: testConvs } = await supabase.from("conversations").select("id").eq("channel", "test").limit(1000);
    const testIds = new Set((testConvs ?? []).map((c) => c.id as string));

    const [tenant, bots, sources, convs, msgs, total, waiting] = await Promise.all([
      supabase.from("tenants").select("name").eq("id", tenantId).maybeSingle(),
      supabase.from("bots").select("id,name,allowed_domains").order("created_at", { ascending: true }),
      supabase.from("knowledge_sources").select("bot_id,title,status"),
      supabase.from("conversations").select("id", { count: "exact", head: true }).neq("channel", "test").gte("created_at", since),
      supabase.from("messages").select("conversation_id,role,flags,created_at").gte("created_at", since).limit(5000),
      supabase.from("conversations").select("id", { count: "exact", head: true }).neq("channel", "test"),
      supabase.from("conversations").select("id", { count: "exact", head: true }).eq("status", "human").neq("channel", "test"),
    ]);

    const titlesByBot = new Map<string, string[]>();
    for (const s of sources.data ?? []) {
      if (s.status === "failed") continue;
      titlesByBot.set(s.bot_id, [...(titlesByBot.get(s.bot_id) ?? []), s.title]);
    }

    let botReplies = 0;
    let handoffs = 0;
    const perDay = new Map<string, number>();
    for (const m of msgs.data ?? []) {
      if (testIds.has(m.conversation_id)) continue;
      if (m.role === "bot") {
        if ((m.flags ?? []).includes("handoff")) handoffs++;
        else botReplies++;
      }
      if (m.role === "customer") {
        const k = m.created_at.slice(0, 10);
        perDay.set(k, (perDay.get(k) ?? 0) + 1);
      }
    }
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * DAY);
      return { label: d.toLocaleDateString("en", { weekday: "short" }), count: perDay.get(d.toISOString().slice(0, 10)) ?? 0 };
    });

    const botList = (bots.data ?? []).map((b) => ({
      id: b.id as string,
      name: b.name as string,
      score: scoreKnowledge(titlesByBot.get(b.id) ?? []),
      domains: (b.allowed_domains ?? []).length,
    }));
    const anyTitle = (t: string) => [...titlesByBot.values()].some((titles) => titles.includes(t));

    const firstBot = botList[0]?.id;
    const botHref = firstBot ? `/dashboard/bots/${firstBot}` : "/dashboard/bots";
    const setup = [
      { key: "bot", label: "Create your first bot", done: botList.length > 0, href: "/dashboard/bots" },
      { key: "profile", label: "Add your business profile", done: anyTitle(RESERVED.profile), href: botHref },
      { key: "products", label: "Add your products or services", done: anyTitle(RESERVED.products), href: botHref },
      { key: "faqs", label: "Add common questions and answers", done: anyTitle(RESERVED.faqs), href: botHref },
      { key: "domain", label: "Lock the bot to your website", done: botList.some((b) => b.domains > 0), href: botHref },
      { key: "chat", label: "Get your first customer chat", done: (total.count ?? 0) > 0, href: botHref },
    ];

    const out: Overview = {
      businessName: tenant.data?.name ?? "your business",
      stats: { waiting: waiting.count ?? 0, conversations: convs.count ?? 0, botReplies, handoffs },
      days,
      bots: botList,
      setup,
      totalConversations: total.count ?? 0,
    };
    return NextResponse.json(out);
  });
}
