"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, ErrorNote, Field, Input, Textarea } from "@/components/ui";
import { api } from "@/lib/client-api";
import type { Bot } from "./types";

type Rule = { id: string; type: "forbid_topic" | "always_handoff"; value: string };

function RuleList({
  botId,
  type,
  title,
  help,
  placeholder,
  rules,
  reload,
}: {
  botId: string;
  type: Rule["type"];
  title: string;
  help: string;
  placeholder: string;
  rules: Rule[];
  reload: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const mine = rules.filter((r) => r.type === type);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api(`/api/bots/${botId}/rules`, { method: "POST", body: JSON.stringify({ type, value }) });
      setValue("");
      reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(id: string) {
    await api(`/api/bots/${botId}/rules/${id}`, { method: "DELETE" }).catch(() => {});
    reload();
  }

  return (
    <Card className="p-6">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{help}</p>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} maxLength={60} required />
        <Button type="submit" variant="secondary">Add</Button>
      </form>
      <div className="mt-3">
        <ErrorNote>{error}</ErrorNote>
      </div>
      {mine.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {mine.map((r) => (
            <span key={r.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-bg py-1 pl-3 pr-1 text-sm">
              {r.value}
              <button onClick={() => remove(r.id)} aria-label={`Remove ${r.value}`} className="grid size-5 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger">×</button>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

export function RulesTab({ bot, onSaved }: { bot: Bot; onSaved: (b: Bot) => void }) {
  const [rules, setRules] = useState<Rule[]>([]);
  const loadRules = useCallback(
    () => api<{ rules: Rule[] }>(`/api/bots/${bot.id}/rules`).then((r) => setRules(r.rules)).catch(() => {}),
    [bot.id],
  );
  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const [name, setName] = useState(bot.name);
  const [tone, setTone] = useState(bot.tone);
  const [instructions, setInstructions] = useState(bot.system_instructions);
  const [fallback, setFallback] = useState(bot.fallback_message);
  const [threshold, setThreshold] = useState(bot.confidence_threshold);
  const [domains, setDomains] = useState(bot.allowed_domains.join("\n"));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const { bot: b } = await api<{ bot: Bot }>(`/api/bots/${bot.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          tone,
          system_instructions: instructions,
          fallback_message: fallback,
          confidence_threshold: threshold,
          allowed_domains: domains.split(/[\n,]+/).map((d) => d.trim()).filter(Boolean),
        }),
      });
      onSaved(b);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <RuleList
        botId={bot.id}
        type="always_handoff"
        title="Always send to a human"
        help="If a customer's message contains any of these words, the bot stops and the chat goes to your inbox."
        placeholder="refund, complaint, cancel order…"
        rules={rules}
        reload={loadRules}
      />
      <RuleList
        botId={bot.id}
        type="forbid_topic"
        title="Never discuss"
        help="The bot politely declines when a message contains any of these words."
        placeholder="competitor, politics, medical advice…"
        rules={rules}
        reload={loadRules}
      />

      <form onSubmit={save}>
        <Card className="space-y-5 p-6">
          <h3 className="font-display text-lg font-semibold">Personality &amp; settings</h3>
          <Field label="Bot name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
          </Field>
          <Field label="About your business" hint="Shown to the bot as background. Keep it factual.">
            <Textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={2000} />
          </Field>
          <Field label="Tone of voice">
            <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="friendly and concise" maxLength={120} />
          </Field>
          <Field label="When the bot does not know" hint="This exact message is shown, then the chat goes to your inbox.">
            <Textarea rows={2} value={fallback} onChange={(e) => setFallback(e.target.value)} required maxLength={300} />
          </Field>
          <Field label={`How careful should it be? (${threshold.toFixed(2)})`} hint="Lower: answers more questions, with more risk of a loose answer. Higher: hands more chats to you.">
            <input type="range" min={0.3} max={0.8} step={0.05} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-brand" />
          </Field>
          <Field label="Websites allowed to use this bot" hint="One per line, e.g. myshop.com. Leave empty to allow any site (fine for testing, set it before launch).">
            <Textarea rows={3} value={domains} onChange={(e) => setDomains(e.target.value)} placeholder={"myshop.com\nwww.myshop.com"} />
          </Field>
          <ErrorNote>{error}</ErrorNote>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
            {saved && <Badge tone="good">Saved</Badge>}
          </div>
        </Card>
      </form>
    </div>
  );
}
