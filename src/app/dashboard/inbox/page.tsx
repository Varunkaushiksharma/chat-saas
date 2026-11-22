"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dashIcons, Ico } from "@/components/dash";
import { Badge, Button, Card, cx, Empty, ErrorNote, Field, Input, Textarea } from "@/components/ui";
import { api } from "@/lib/client-api";
import type { InboxItem } from "../../api/inbox/route";

type Message = { id: string; role: "customer" | "bot" | "agent"; content: string; created_at: string };
type Status = InboxItem["status"];

const statusTone = { bot: "good", human: "warn", closed: "neutral" } as const;
const statusLabel = { bot: "Bot handling", human: "Needs a human", closed: "Resolved" } as const;

// The customer message an owner reply was answering: the latest real question before it.
function guessQuestion(msgs: Message[], replyId: string) {
  const idx = msgs.findIndex((m) => m.id === replyId);
  const before = msgs.slice(0, idx).filter((m) => m.role === "customer");
  const good = [...before].reverse().find((m) => m.content.trim().length >= 8);
  return (good ?? before[before.length - 1])?.content.trim() ?? "";
}

function ago(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadList = useCallback(
    () =>
      api<{ conversations: InboxItem[] }>("/api/inbox")
        .then((r) => setItems(r.conversations))
        .catch((e) => setError(e.message)),
    [],
  );

  useEffect(() => {
    loadList();
    const t = setInterval(loadList, 8000);
    return () => clearInterval(t);
  }, [loadList]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Inbox</h1>
      <p className="mt-1 text-sm text-muted">Chats the bot handed to you appear first. Reply here and the customer sees it in their chat window.</p>
      <div className="mt-6">
        <ErrorNote>{error}</ErrorNote>
      </div>

      {items && items.length === 0 ? (
        <Empty title="No conversations yet">When customers chat with your bot on your website, the conversations will show up here.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-[320px_1fr]">
          <Card className={cx("max-h-[70vh] divide-y divide-line overflow-y-auto", selected && "hidden md:block")}>
            {items === null && <p className="p-4 text-sm text-muted">Loading…</p>}
            {items?.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={cx("block w-full px-4 py-3 text-left transition-colors hover:bg-bg", selected === c.id && "bg-brand-soft")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{c.botName}</span>
                  <span className="shrink-0 text-xs text-muted">{ago(c.lastAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted">{c.lastMessage || "(no messages)"}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge tone={c.needsReply ? "danger" : statusTone[c.status]}>{c.needsReply ? "Customer waiting" : statusLabel[c.status]}</Badge>
                  {c.channel === "test" && <Badge tone="info">Test chat</Badge>}
                </div>
              </button>
            ))}
          </Card>

          <div className={cx(!selected && "hidden md:block")}>
            {selected ? (
              <Thread key={selected} id={selected} onBack={() => setSelected(null)} onChanged={loadList} />
            ) : (
              <Card className="hidden h-60 place-items-center text-sm text-muted md:grid">Select a conversation</Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Thread({ id, onBack, onChanged }: { id: string; onBack: () => void; onChanged: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>("human");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);

  const [botId, setBotId] = useState("");
  const [teaching, setTeaching] = useState<{ id: string; question: string; answer: string } | null>(null);
  const [taughtIds, setTaughtIds] = useState<string[]>([]);
  const [teachSaving, setTeachSaving] = useState(false);

  const load = useCallback(
    () =>
      api<{ status: Status; botId: string; messages: Message[] }>(`/api/inbox/${id}`)
        .then((r) => {
          setStatus(r.status);
          setBotId(r.botId);
          setMessages(r.messages);
        })
        .catch((e) => setError(e.message)),
    [id],
  );

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      await api(`/api/inbox/${id}`, { method: "POST", body: JSON.stringify({ content: reply }) });
      setReply("");
      await load();
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function teach(e: React.FormEvent) {
    e.preventDefault();
    if (!teaching || !botId) return;
    setTeachSaving(true);
    setError("");
    try {
      await api(`/api/bots/${botId}/faqs`, { method: "POST", body: JSON.stringify({ question: teaching.question, answer: teaching.answer }) });
      setTaughtIds((ids) => [...ids, teaching.id]);
      setTeaching(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setTeachSaving(false);
    }
  }

  async function setTo(next: Status) {
    setError("");
    try {
      await api(`/api/inbox/${id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      await load();
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Card className="flex h-[70vh] flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-muted hover:text-ink md:hidden">← Back</button>
          <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>
        </div>
        <div className="flex gap-2">
          {status !== "bot" && <Button size="sm" variant="secondary" onClick={() => setTo("bot")}>Hand back to bot</Button>}
          {status !== "closed" && <Button size="sm" variant="secondary" onClick={() => setTo("closed")}>Mark resolved</Button>}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "customer" ? "" : "text-right"}>
            <p className="mb-0.5 text-[11px] text-muted">{m.role === "customer" ? "Customer" : m.role === "bot" ? "Bot" : "You"}</p>
            <div
              className={cx(
                "inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-left text-sm",
                m.role === "customer" && "rounded-bl-sm bg-bg",
                m.role === "bot" && "rounded-br-sm border border-line bg-card",
                m.role === "agent" && "rounded-br-sm bg-brand text-white",
              )}
            >
              {m.content}
            </div>
            {m.role === "agent" && botId && (
              <div className="mt-1">
                {taughtIds.includes(m.id) ? (
                  <span className="text-xs font-semibold text-[#067a4b]">Saved to your FAQs ✓</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTeaching({ id: m.id, question: guessQuestion(messages, m.id), answer: m.content })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    <Ico d={dashIcons.bolt} className="size-3" /> Teach the bot this answer
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={end} />
      </div>

      {teaching && (
        <form onSubmit={teach} className="space-y-3 border-t border-line bg-brand-soft/50 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Teach the bot this answer</p>
              <p className="text-xs text-muted">Next time a customer asks this, the bot can answer on its own. It is saved to your FAQs.</p>
            </div>
            <button type="button" aria-label="Close" onClick={() => setTeaching(null)} className="grid size-7 shrink-0 place-items-center rounded-lg text-muted hover:bg-white hover:text-ink">
              <Ico d={dashIcons.x} className="size-4" />
            </button>
          </div>
          <Field label="When a customer asks">
            <Input value={teaching.question} onChange={(e) => setTeaching({ ...teaching, question: e.target.value })} maxLength={300} required />
          </Field>
          <Field label="The bot answers">
            <Textarea rows={3} value={teaching.answer} onChange={(e) => setTeaching({ ...teaching, answer: e.target.value })} maxLength={1500} required />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={teachSaving}>{teachSaving ? "Saving…" : "Save to FAQs"}</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setTeaching(null)}>Cancel</Button>
          </div>
        </form>
      )}

      {error && <div className="px-4 pb-2"><ErrorNote>{error}</ErrorNote></div>}
      <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
        <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={status === "closed" ? "Replying will reopen this chat" : "Write a reply…"} maxLength={2000} />
        <Button type="submit" disabled={sending || !reply.trim()}>Send</Button>
      </form>
    </Card>
  );
}
