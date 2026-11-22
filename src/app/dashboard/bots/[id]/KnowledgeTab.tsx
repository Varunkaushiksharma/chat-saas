"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Bar, Drawer, Ico, Ring, dashIcons } from "@/components/dash";
import { Badge, Button, Card, cx, ErrorNote } from "@/components/ui";
import { api } from "@/lib/client-api";
import { RESERVED, scoreKnowledge, SECTION_WEIGHTS, strengthLabel, type SectionKey } from "@/lib/knowledge/specs";
import { DocEditor, FaqEditor, PoliciesEditor, ProductsEditor, ProfileEditor } from "./KnowledgeEditors";

type Source = { id: string; title: string; status: "pending" | "ready" | "failed" };
type Gap = { question: string; count: number };

const sections: { key: SectionKey; icon: string; color: string; why: string; covers: string }[] = [
  {
    key: "profile",
    icon: dashIcons.home,
    color: "bg-pop-yellow",
    why: "Who you are and how to reach you. These are the questions customers ask first.",
    covers: "About you, address, hours, phone, payments",
  },
  {
    key: "products",
    icon: dashIcons.tag,
    color: "bg-pop-pink",
    why: "Without prices the bot can only say \"I don't know\". Add what you sell and what it costs.",
    covers: "Name, price, availability, details",
  },
  {
    key: "policies",
    icon: dashIcons.shield,
    color: "bg-pop-green",
    why: "Delivery and return rules cause the most back and forth. Spell them out once.",
    covers: "Delivery, returns, payments, warranty, bookings",
  },
  {
    key: "faqs",
    icon: dashIcons.question,
    color: "bg-pop-orange",
    why: "Your exact answers to the questions you get again and again, in your own words.",
    covers: "Question and answer pairs",
  },
];

// readable names inside sentences ("Edit FAQs", not "Edit faqs")
const LOWER: Record<SectionKey, string> = { profile: "business profile", products: "products and services", policies: "policies", faqs: "FAQs" };

type Editing = { kind: SectionKey | "doc"; sourceId?: string; prefill?: string } | null;

export function KnowledgeTab({ botId }: { botId: string }) {
  const [sources, setSources] = useState<Source[] | null>(null);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [editing, setEditing] = useState<Editing>(null);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      Promise.all([
        api<{ sources: Source[] }>(`/api/bots/${botId}/knowledge`),
        api<{ gaps: Gap[] }>(`/api/bots/${botId}/gaps`).catch(() => ({ gaps: [] as Gap[] })),
      ])
        .then(([s, g]) => {
          setSources(s.sources);
          setGaps(g.gaps);
        })
        .catch((e) => setError((e as Error).message)),
    [botId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const good = (sources ?? []).filter((s) => s.status !== "failed");
  const byTitle = (t: string) => good.find((s) => s.title === t);
  const reserved = new Set<string>(Object.values(RESERVED));
  const docs = (sources ?? []).filter((s) => !reserved.has(s.title));
  const score = scoreKnowledge(good.map((s) => s.title));
  const next = sections.find((s) => !byTitle(RESERVED[s.key]));

  const close = () => setEditing(null);
  const saved = () => {
    setEditing(null);
    load();
  };

  async function removeDoc(id: string) {
    if (!confirm("Remove this entry? The bot will forget it.")) return;
    try {
      await api(`/api/bots/${botId}/knowledge/${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const drawerTitle = !editing
    ? ""
    : editing.kind === "doc"
      ? "Add a document"
      : editing.sourceId
        ? `Edit ${LOWER[editing.kind]}`
        : `Add ${LOWER[editing.kind]}`;
  const drawerHint: Record<string, string> = {
    profile: "The basics every customer asks about. Be specific: real numbers beat vague words.",
    products: "List what you sell. Even a short list lets the bot quote prices instead of guessing.",
    policies: "Write your real rules. The bot will repeat them exactly, so include numbers and conditions.",
    faqs: "Answer in your own words. Use the quick-add chips to start from common questions.",
    doc: "Anything else customers might ask about: brochures, price lists, guides, terms.",
  };

  return (
    <div className="space-y-8">
      <ErrorNote>{error}</ErrorNote>

      {/* strength */}
      <Card className="p-6 md:p-7">
        <div className="flex flex-wrap items-center gap-6">
          <Ring value={score} size={104} color={score >= 60 ? "#00c98d" : score >= 30 ? "#ffd60a" : "#ff5ca8"}>
            <span className="font-display text-3xl font-extrabold leading-none">{score}</span>
            <span className="block text-[10px] font-extrabold uppercase text-muted">of 100</span>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Knowledge strength</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight">{strengthLabel(score)}</h2>
            <p className="mt-2 max-w-xl text-ink/75">
              {next
                ? `Next best step: add your ${LOWER[next.key]}. The more your bot knows, the fewer chats come to you.`
                : "Your bot knows the essentials. Keep adding documents and answers as new questions come up."}
            </p>
          </div>
          {next && (
            <Button onClick={() => setEditing({ kind: next.key })}>
              <Ico d={dashIcons.plus} className="size-4" /> Add {LOWER[next.key]}
            </Button>
          )}
        </div>
      </Card>

      {/* guided sections */}
      <div>
        <h3 className="font-display text-xl font-extrabold tracking-tight">What your bot needs to know</h3>
        <p className="mt-1 text-sm text-muted">Four short forms cover most of what customers ask. Each one makes the answers noticeably better.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {sections.map((s, i) => {
            const existing = byTitle(RESERVED[s.key]);
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.45 }}
                className="flex flex-col rounded-2xl border border-line bg-white shadow-soft transition-shadow hover:shadow-lift"
              >
                <div className="flex items-center justify-between gap-3 px-5 pt-5">
                  <span className="flex items-center gap-3 font-display text-lg font-extrabold tracking-tight">
                    <span className={cx("grid size-11 place-items-center rounded-xl text-ink", s.color)}><Ico d={s.icon} className="size-5" /></span>
                    {RESERVED[s.key]}
                  </span>
                  <Badge tone={existing ? "good" : "neutral"}>{existing ? "Added ✓" : `+${SECTION_WEIGHTS[s.key]} pts`}</Badge>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-sm text-ink/80">{s.why}</p>
                  <p className="mt-2 text-xs font-medium text-muted">Covers: {s.covers}</p>
                  <div className="mt-5 flex-1" />
                  <Button variant={existing ? "secondary" : "primary"} size="sm" className="w-fit" onClick={() => setEditing({ kind: s.key, sourceId: existing?.id })}>
                    <Ico d={existing ? dashIcons.pencil : dashIcons.plus} className="size-4" />
                    {existing ? "Edit" : "Add"}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* gaps */}
      {gaps.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-[#fff4eb] px-6 py-4">
            <h3 className="font-display text-xl font-extrabold tracking-tight">Questions your bot couldn&apos;t answer</h3>
            <p className="mt-0.5 text-sm text-ink/70">Real customers asked these and got handed to you. Answer them once and the bot handles them next time.</p>
          </div>
          <ul className="divide-y divide-line">
            {gaps.map((g) => (
              <li key={g.question} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                <div className="min-w-0">
                  <p className="truncate font-semibold">&ldquo;{g.question}&rdquo;</p>
                  {g.count > 1 && <p className="text-xs font-semibold text-muted">Asked {g.count} times</p>}
                </div>
                <Button size="sm" variant="secondary" onClick={() => setEditing({ kind: "faqs", sourceId: byTitle(RESERVED.faqs)?.id, prefill: g.question })}>
                  Answer this
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* extra documents */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-extrabold tracking-tight">Extra documents</h3>
            <p className="mt-1 text-sm text-muted">Brochures, price lists, guides, anything that doesn&apos;t fit the forms above.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setEditing({ kind: "doc" })}>
            <Ico d={dashIcons.plus} className="size-4" /> Add a document
          </Button>
        </div>
        <div className="mt-4">
          {sources === null ? (
            <p className="text-sm font-semibold text-muted">Loading…</p>
          ) : docs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 px-6 py-8 text-center text-sm text-muted">No extra documents yet.</div>
          ) : (
            <Card className="divide-y divide-line">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gray-100 text-muted"><Ico d={dashIcons.doc} className="size-4" /></span>
                    <span className="truncate font-semibold">{d.title}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <Badge tone={d.status === "ready" ? "good" : d.status === "failed" ? "danger" : "warn"}>
                      {d.status === "ready" ? "Learned" : d.status === "failed" ? "Failed" : "Learning"}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => removeDoc(d.id)}>Remove</Button>
                  </span>
                </div>
              ))}
            </Card>
          )}
        </div>
        {score > 0 && (
          <div className="mt-8">
            <Bar value={score} />
            <p className="mt-2 text-xs font-semibold text-muted">Tip: use the Test tab to ask your bot real questions after you add something.</p>
          </div>
        )}
      </div>

      <Drawer open={!!editing} onClose={close} title={drawerTitle} subtitle={editing ? drawerHint[editing.kind] : undefined}>
        {editing && (
          <>
            {editing.kind === "profile" && <ProfileEditor key="p" botId={botId} sourceId={editing.sourceId} onSaved={saved} onClose={close} />}
            {editing.kind === "products" && <ProductsEditor key="pr" botId={botId} sourceId={editing.sourceId} onSaved={saved} onClose={close} />}
            {editing.kind === "policies" && <PoliciesEditor key="po" botId={botId} sourceId={editing.sourceId} onSaved={saved} onClose={close} />}
            {editing.kind === "faqs" && <FaqEditor key="f" botId={botId} sourceId={editing.sourceId} prefill={editing.prefill} onSaved={saved} onClose={close} />}
            {editing.kind === "doc" && <DocEditor key="d" botId={botId} onSaved={saved} onClose={close} />}
          </>
        )}
      </Drawer>
    </div>
  );
}
