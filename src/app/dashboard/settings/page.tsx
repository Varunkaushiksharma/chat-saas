"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, Button, Card, ErrorNote, Field, Input } from "@/components/ui";
import { api } from "@/lib/client-api";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("free");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ email: string; businessName: string; plan: string }>("/api/account")
      .then((r) => {
        setEmail(r.email ?? "");
        setName(r.businessName);
        setPlan(r.plan);
        setLoaded(true);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await api("/api/account", { method: "PATCH", body: JSON.stringify({ businessName: name }) });
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-semibold text-brand">Settings</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight md:text-4xl">Your account</h1>

      <div className="mt-8 space-y-6">
        <ErrorNote>{error}</ErrorNote>

        <Card className="p-6">
          <h2 className="font-display text-xl font-extrabold tracking-tight">Business</h2>
          <form onSubmit={save} className="mt-5 space-y-5">
            <Field label="Business name" hint="Shown in your dashboard. Your bots have their own names.">
              <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} disabled={!loaded} />
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving || !loaded}>{saving ? "Saving…" : "Save changes"}</Button>
              {saved && <Badge tone="good">Saved</Badge>}
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl font-extrabold tracking-tight">Sign-in</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
              <dt className="font-bold text-muted">Email</dt>
              <dd className="truncate font-extrabold">{email || "…"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="font-bold text-muted">Plan</dt>
              <dd><Badge tone="warn">{plan === "free" ? "Free (early access)" : plan}</Badge></dd>
            </div>
          </dl>
          <div className="mt-6">
            <Button variant="secondary" onClick={signOut}>Log out</Button>
          </div>
        </Card>

        <Card className="bg-bg p-6">
          <h2 className="font-display text-xl font-extrabold tracking-tight">Good to know</h2>
          <ul className="mt-3 space-y-2 text-sm font-medium text-ink/80">
            <li>• To write a reply, a customer&apos;s message and the relevant parts of your knowledge are sent to Google&apos;s Gemini AI.</li>
            <li>• Please don&apos;t put passwords or card numbers into your knowledge.</li>
            <li>• Deleting a bot removes its knowledge and conversations.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
