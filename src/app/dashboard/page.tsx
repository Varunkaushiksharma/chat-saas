"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Overview } from "../api/overview/route";
import { Bar, Ico, dashIcons } from "@/components/dash";
import { Badge, Button, Card, cx, ErrorNote } from "@/components/ui";
import { api } from "@/lib/client-api";
import { strengthLabel } from "@/lib/knowledge/specs";

function Stat({ label, value, note, chip, icon, delay }: { label: string; value: number; note: string; chip: string; icon: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl border border-line bg-white p-5 shadow-soft transition-shadow hover:shadow-lift"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <span className={cx("grid size-10 place-items-center rounded-xl", chip)}>
          <Ico d={icon} className="size-5" />
        </span>
      </div>
      <p className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight">{value.toLocaleString()}</p>
      <p className="mt-2 text-xs font-medium text-muted">{note}</p>
    </motion.div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function OverviewPage() {
  const [d, setD] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Overview>("/api/overview")
      .then(setD)
      .catch((e) => setError(e.message));
  }, []);

  if (!d) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Overview</h1>
        <div className="mt-6"><ErrorNote>{error}</ErrorNote></div>
        {!error && <p className="mt-4 text-sm font-medium text-muted">Loading…</p>}
      </div>
    );
  }

  const done = d.setup.filter((s) => s.done).length;
  const allDone = done === d.setup.length;
  const max = Math.max(1, ...d.days.map((x) => x.count));
  const weekTotal = d.days.reduce((a, b) => a + b.count, 0);
  const answered = d.stats.botReplies + d.stats.handoffs;
  const rate = answered ? Math.round((d.stats.botReplies / answered) * 100) : null;
  const firstBot = d.bots[0];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand">{greeting()}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">{d.businessName}</h1>
          <p className="mt-1 text-muted">Here&apos;s how your assistant did in the last 7 days.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/inbox">
            <Button variant="secondary"><Ico d={dashIcons.inbox} className="size-4" /> Inbox</Button>
          </Link>
          <Link href={firstBot ? `/dashboard/bots/${firstBot.id}` : "/dashboard/bots"}>
            <Button><Ico d={dashIcons.plus} className="size-4" /> Add knowledge</Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Waiting for you" value={d.stats.waiting} note={d.stats.waiting ? "Customers need a person" : "Nobody is waiting"} chip="bg-pop-yellow text-ink" icon={dashIcons.inbox} delay={0} />
        <Stat label="Chats this week" value={d.stats.conversations} note={`${d.totalConversations.toLocaleString()} in total`} chip="bg-brand text-white" icon={dashIcons.chat} delay={0.05} />
        <Stat label="Answered by bot" value={d.stats.botReplies} note={rate === null ? "No replies yet" : `${rate}% of all replies`} chip="bg-pop-green text-ink" icon={dashIcons.bolt} delay={0.1} />
        <Stat label="Handed to you" value={d.stats.handoffs} note="The bot passed these on" chip="bg-pop-pink text-ink" icon={dashIcons.user} delay={0.15} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-5">
              <div>
                <h2 className="font-display text-lg font-extrabold tracking-tight">{allDone ? "You're all set" : "Get set up"}</h2>
                <p className="mt-0.5 text-sm text-muted">{allDone ? "Everything is in place. Nice work." : `${done} of ${d.setup.length} done. A few more steps make your bot much better.`}</p>
              </div>
              <div className="flex w-44 items-center gap-3">
                <Bar value={(done / d.setup.length) * 100} className="flex-1" />
                <span className="text-xs font-bold">{Math.round((done / d.setup.length) * 100)}%</span>
              </div>
            </div>
            <ul className="divide-y divide-line">
              {d.setup.map((s) => (
                <li key={s.key}>
                  <Link href={s.href} className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-gray-50">
                    <span className={cx("grid size-6 shrink-0 place-items-center rounded-full border", s.done ? "border-transparent bg-pop-green" : "border-gray-300 bg-white")}>
                      {s.done && <Ico d={dashIcons.check} className="size-3.5" />}
                    </span>
                    <span className={cx("flex-1 text-sm font-semibold", s.done && "text-muted line-through")}>{s.label}</span>
                    {!s.done && <Ico d={dashIcons.arrow} className="size-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-ink" />}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg font-extrabold tracking-tight">Customer messages</h2>
              <p className="text-sm font-medium text-muted">{weekTotal} in the last 7 days</p>
            </div>
            {weekTotal === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-muted">
                No customer messages yet. Add the chat to your website and they will show up here.
              </p>
            ) : (
              <div className="mt-6 flex h-44 items-end gap-3">
                {d.days.map((day, i) => {
                  const last = i === d.days.length - 1;
                  return (
                    <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-2" title={`${day.label}: ${day.count}`}>
                      <span className="text-xs font-bold opacity-0 transition-opacity group-hover:opacity-100">{day.count}</span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(day.count ? 6 : 3, (day.count / max) * 100)}%` }}
                        transition={{ delay: 0.15 + i * 0.05, duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
                        className={cx("w-full rounded-lg transition-colors", last ? "bg-brand" : "bg-brand/20 group-hover:bg-brand/40")}
                      />
                      <span className={cx("text-[11px] font-semibold", last ? "text-ink" : "text-muted")}>{day.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="font-display text-lg font-extrabold tracking-tight">Your bots</h2>
              <Link href="/dashboard/bots" className="text-sm font-semibold text-brand hover:underline">View all</Link>
            </div>
            {d.bots.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted">You haven&apos;t created a bot yet.</p>
                <Link href="/dashboard/bots" className="mt-4 inline-block"><Button>Create your first bot</Button></Link>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {d.bots.map((b) => (
                  <li key={b.id}>
                    <Link href={`/dashboard/bots/${b.id}`} className="block px-6 py-4 transition-colors hover:bg-gray-50">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft font-display text-sm font-extrabold text-brand">{b.name.slice(0, 1).toUpperCase()}</span>
                          <span className="truncate font-semibold">{b.name}</span>
                        </span>
                        <Badge tone={b.score >= 60 ? "good" : b.score >= 30 ? "warn" : "neutral"}>{strengthLabel(b.score)}</Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Bar value={b.score} className="flex-1" color={b.score >= 60 ? "bg-pop-green" : b.score >= 30 ? "bg-pop-yellow" : "bg-pop-pink"} />
                        <span className="w-10 text-right text-xs font-bold">{b.score}%</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="rounded-2xl border border-line bg-brand-soft p-6">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-brand shadow-soft"><Ico d={dashIcons.bolt} className="size-5" /></span>
            <h3 className="mt-4 font-display text-lg font-extrabold tracking-tight">Make answers better</h3>
            <p className="mt-1.5 text-sm text-ink/75">
              The bot answers only from what you teach it. Add your business profile, prices, policies and FAQs, then check the questions it couldn&apos;t answer.
            </p>
            <Link href={firstBot ? `/dashboard/bots/${firstBot.id}` : "/dashboard/bots"} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
              Open knowledge <Ico d={dashIcons.arrow} className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
