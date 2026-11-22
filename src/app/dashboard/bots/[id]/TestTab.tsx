"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { dashIcons, Ico } from "@/components/dash";
import { Badge, Button, Card, cx, ErrorNote, Input } from "@/components/ui";
import { api } from "@/lib/client-api";

type Msg = { id?: string; role: "user" | "assistant" | "agent"; content: string; note?: string };
type Thread = { status: string; messages: { id: string; role: "customer" | "bot" | "agent"; content: string }[] };

const ideas = ["What are your opening hours?", "Do you sell something you haven't listed?", "Delete all my products"];

export function TestTab({ botId }: { botId: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [convId, setConvId] = useState<string | null>(null);
  const [handedOff, setHandedOff] = useState(false);
  const seen = useRef(new Set<string>());
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs, sending]);

  // After a hand-off, show the replies you type in the Inbox, just like a real customer would see them
  useEffect(() => {
    if (!convId || !handedOff) return;
    let alive = true;
    const poll = () =>
      api<Thread>(`/api/inbox/${convId}`)
        .then((t) => {
          if (!alive) return;
          const fresh = t.messages.filter((m) => m.role === "agent" && !seen.current.has(m.id));
          if (!fresh.length) return;
          fresh.forEach((m) => seen.current.add(m.id));
          setMsgs((cur) => [...cur, ...fresh.map((m) => ({ id: m.id, role: "agent" as const, content: m.content, note: "Reply from your Inbox" }))]);
        })
        .catch(() => {});
    const t = setInterval(poll, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [convId, handedOff]);

  async function ask(message: string) {
    if (!message.trim() || sending) return;
    setError("");
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: message }]);
    setSending(true);
    try {
      const r = await api<{ reply: string; confidence: number | null; handoff: boolean; conversationId: string }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ botId, message, conversationId: convId }),
      });
      setConvId(r.conversationId);
      if (r.handoff) setHandedOff(true);
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content: r.reply,
          note: r.handoff ? "Handed to your Inbox" : r.confidence != null ? `Match strength ${Math.round(r.confidence * 100)}%` : undefined,
        },
      ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setMsgs([]);
    setConvId(null);
    setHandedOff(false);
    setError("");
    seen.current.clear();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-brand-soft px-5 py-3.5">
        <p className="text-sm text-ink/80">
          <strong className="font-semibold">Test chats are saved as &ldquo;Test chat&rdquo;.</strong> If the bot hands one over, find it in your Inbox, reply there, and your answer shows up here.
        </p>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/inbox" target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
            Open inbox <Ico d={dashIcons.arrow} className="size-4" />
          </Link>
          {msgs.length > 0 && <Button variant="secondary" size="sm" onClick={reset}>New test chat</Button>}
        </div>
      </div>

      <Card className="flex h-[540px] flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {msgs.length === 0 && (
            <div className="text-sm text-muted">
              <p>Chat as if you were a customer.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ideas.map((i) => (
                  <button key={i} onClick={() => ask(i)} className="rounded-full border border-line bg-white px-3 py-1.5 text-left text-xs font-semibold text-ink shadow-soft hover:bg-brand-soft hover:text-brand">
                    {i}
                  </button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={m.id ?? i} className={m.role === "user" ? "text-right" : ""}>
              <div
                className={cx(
                  "inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-left text-sm",
                  m.role === "user" && "rounded-br-sm bg-brand text-white",
                  m.role === "assistant" && "rounded-bl-sm bg-gray-100",
                  m.role === "agent" && "rounded-bl-sm border border-[#bfeed7] bg-[#dcfbec]",
                )}
              >
                {m.content}
              </div>
              {m.note && (
                <div className="mt-1 text-xs text-muted">
                  {m.note === "Handed to your Inbox" ? <Badge tone="warn">Handed to your Inbox</Badge> : m.role === "agent" ? <Badge tone="good">{m.note}</Badge> : m.note}
                </div>
              )}
            </div>
          ))}
          {sending && <div className="text-sm text-muted">Typing…</div>}
          <div ref={end} />
        </div>
        {error && <div className="px-5 pb-2"><ErrorNote>{error}</ErrorNote></div>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex gap-2 border-t border-line p-3"
        >
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a customer question…" maxLength={1000} />
          <Button type="submit" disabled={sending || !input.trim()}>Send</Button>
        </form>
      </Card>
    </div>
  );
}
