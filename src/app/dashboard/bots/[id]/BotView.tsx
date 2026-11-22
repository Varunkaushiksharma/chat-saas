"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cx, ErrorNote } from "@/components/ui";
import { api } from "@/lib/client-api";
import { InstallTab } from "./InstallTab";
import { KnowledgeTab } from "./KnowledgeTab";
import { RulesTab } from "./RulesTab";
import { TestTab } from "./TestTab";
import type { Bot } from "./types";

const tabs = [
  { id: "knowledge", label: "1. Knowledge" },
  { id: "rules", label: "2. Rules & settings" },
  { id: "test", label: "3. Test" },
  { id: "install", label: "4. Add to website" },
] as const;
type TabId = (typeof tabs)[number]["id"];

export function BotView() {
  const { id } = useParams<{ id: string }>();
  // set by "Create bot" when the owner typed their website: open the website import straight away
  const startUrl = useSearchParams().get("site") ?? undefined;
  const [bot, setBot] = useState<Bot | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabId>("knowledge");

  useEffect(() => {
    api<{ bot: Bot }>(`/api/bots/${id}`)
      .then((r) => setBot(r.bot))
      .catch((e) => setError(e.message));
  }, [id]);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard/bots" className="text-sm font-bold text-muted hover:text-ink">
        ← All bots
      </Link>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">{bot?.name ?? "…"}</h1>

      <div className="mt-6 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
              tab === t.id ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <ErrorNote>{error}</ErrorNote>
        {tab === "knowledge" && <KnowledgeTab botId={id} startUrl={startUrl} />}
        {bot && tab === "rules" && <RulesTab bot={bot} onSaved={setBot} />}
        {tab === "test" && <TestTab botId={id} />}
        {bot && tab === "install" && <InstallTab bot={bot} />}
      </div>
    </div>
  );
}
