"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, Empty, ErrorNote, Field, Input, Textarea } from "@/components/ui";
import { api } from "@/lib/client-api";

type Bot = { id: string; name: string; created_at: string };

export default function BotsPage() {
  const router = useRouter();
  const [bots, setBots] = useState<Bot[] | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [site, setSite] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ bots: Bot[] }>("/api/bots")
      .then((r) => setBots(r.bots))
      .catch((e) => setError(e.message));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { bot } = await api<{ bot: { id: string } }>("/api/bots", {
        method: "POST",
        body: JSON.stringify({ name, system_instructions: about }),
      });
      router.push(`/dashboard/bots/${bot.id}${site.trim() ? `?site=${encodeURIComponent(site.trim())}` : ""}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">Bots</h1>
          <p className="mt-1 text-sm text-muted">Each bot has its own knowledge, rules and website snippet.</p>
        </div>
        {!creating && bots && bots.length > 0 && <Button onClick={() => setCreating(true)}>New bot</Button>}
      </div>

      <div className="mt-6 space-y-6">
        <ErrorNote>{error}</ErrorNote>

        {(creating || (bots && bots.length === 0)) && (
          <Card className="p-6">
            <h2 className="font-display text-xl font-semibold">{bots?.length ? "Create another bot" : "Create your first bot"}</h2>
            <p className="mt-1 text-sm text-muted">You can change everything later.</p>
            <form onSubmit={create} className="mt-5 space-y-4">
              <Field label="Business or bot name">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Varun Arts" required maxLength={80} />
              </Field>
              <Field label="Your website (optional)" hint="Paste your website address and we'll read it to fill in your bot for you. You check everything before it's saved.">
                <Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="www.yourshop.com" inputMode="url" autoComplete="url" maxLength={300} />
              </Field>
              <Field label="What does your business do?" hint="Optional. One or two sentences help the bot sound right.">
                <Textarea rows={3} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="We sell books and notebooks in Delhi. Be friendly and brief." maxLength={2000} />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create bot"}</Button>
                {creating && bots && bots.length > 0 && (
                  <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
                )}
              </div>
            </form>
          </Card>
        )}

        {bots === null && !error && <p className="text-sm text-muted">Loading…</p>}

        {bots && bots.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {bots.map((b) => (
              <Link key={b.id} href={`/dashboard/bots/${b.id}`} className="group">
                <Card className="p-5 transition-colors group-hover:border-brand">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-brand-soft font-display text-lg font-semibold text-brand">
                      {b.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{b.name}</p>
                      <p className="text-xs text-muted">Open to add knowledge and get your website snippet</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {bots && bots.length === 0 && !creating && <Empty title="No bots yet" />}
      </div>
    </div>
  );
}
