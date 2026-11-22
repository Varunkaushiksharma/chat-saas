"use client";

import { useEffect, useState } from "react";
import { Ico, dashIcons } from "@/components/dash";
import { Button, ErrorNote, Field, Input, Textarea } from "@/components/ui";
import { api } from "@/lib/client-api";
import {
  COMMON_FAQS,
  fieldsToText,
  mergeBlocks,
  mergeFields,
  parseBlocks,
  POLICY_FIELDS,
  PROFILE_FIELDS,
  RESERVED,
  toBlock,
  type FieldDef,
} from "@/lib/knowledge/specs";

type Common = { botId: string; sourceId?: string; seed?: string; onSaved: () => void; onClose: () => void };

/** Shown when a form was pre-filled by the AI from the owner's website. */
function AiBanner() {
  return (
    <div role="note" className="flex gap-3 rounded-xl border border-[#f0d98a] bg-[#fff8dc] px-4 py-3 text-sm text-[#6b4a00]">
      <Ico d={dashIcons.bolt} className="mt-0.5 size-4 shrink-0" />
      <p>
        <strong className="font-semibold">Filled in by AI from your website.</strong> Check every detail before you save, because it can misread things. Anything you had already written was kept.
      </p>
    </div>
  );
}

async function saveEntry(botId: string, sourceId: string | undefined, title: string, text: string, mode: "auto" | "paragraphs") {
  const body = JSON.stringify({ title, text, mode });
  if (sourceId) return api(`/api/bots/${botId}/knowledge/${sourceId}`, { method: "PUT", body });
  return api(`/api/bots/${botId}/knowledge`, { method: "POST", body });
}

/** Loads the saved text of an existing entry (null while loading). */
function useExisting(botId: string, sourceId?: string) {
  const [text, setText] = useState<string | null>(sourceId ? null : "");
  useEffect(() => {
    if (!sourceId) return;
    let alive = true;
    api<{ text: string }>(`/api/bots/${botId}/knowledge/${sourceId}`)
      .then((r) => alive && setText(r.text))
      .catch(() => alive && setText(""));
    return () => {
      alive = false;
    };
  }, [botId, sourceId]);
  return text;
}

function Loading() {
  return <p className="p-6 text-sm font-semibold text-muted">Loading…</p>;
}

function Footer({ saving, error, onClose, label = "Save" }: { saving: boolean; error: string; onClose: () => void; label?: string }) {
  return (
    <div className="sticky bottom-0 -mx-6 mt-8 space-y-3 border-t border-line bg-white px-6 py-4">
      <ErrorNote>{error}</ErrorNote>
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Teaching your bot…" : label}</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

/* ---------------------- profile + policies: labelled fields ---------------------- */

function FieldsForm({ fields, title, initial, example, aiFilled, ...c }: Common & { fields: FieldDef[]; title: string; initial: Record<string, string>; example: boolean; aiFilled?: boolean }) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const text = fieldsToText(fields, values);
    if (!text) return setError("Fill in at least one field.");
    setSaving(true);
    try {
      await saveEntry(c.botId, c.sourceId, title, text, "paragraphs");
      c.onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 p-6">
      {aiFilled && <AiBanner />}
      {example && (
        <button
          type="button"
          onClick={() => setValues(Object.fromEntries(fields.map((f) => [f.key, f.placeholder])))}
          className="inline-flex items-center gap-2 rounded-full border border-transparent bg-brand-soft px-3.5 py-1.5 text-xs font-semibold text-brand hover:bg-[#d6e0ff]"
        >
          <Ico d={dashIcons.bolt} className="size-3.5" /> Fill with an example to see the format
        </button>
      )}
      {fields.map((f) => (
        <Field key={f.key} label={f.label} hint={f.hint}>
          {f.rows ? (
            <Textarea rows={f.rows} value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} maxLength={3000} />
          ) : (
            <Input value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} maxLength={500} />
          )}
        </Field>
      ))}
      <Footer saving={saving} error={error} onClose={c.onClose} />
    </form>
  );
}

export function ProfileEditor(c: Common) {
  const text = useExisting(c.botId, c.sourceId);
  if (text === null) return <Loading />;
  return <FieldsForm {...c} fields={PROFILE_FIELDS} title={RESERVED.profile} initial={mergeFields(PROFILE_FIELDS, text, c.seed ?? "")} example aiFilled={!!c.seed} />;
}

export function PoliciesEditor(c: Common) {
  const text = useExisting(c.botId, c.sourceId);
  if (text === null) return <Loading />;
  return <FieldsForm {...c} fields={POLICY_FIELDS} title={RESERVED.policies} initial={mergeFields(POLICY_FIELDS, text, c.seed ?? "")} example aiFilled={!!c.seed} />;
}

/* --------------------------------- products --------------------------------- */

type Product = { name: string; price: string; availability: string; details: string };
const emptyProduct = (): Product => ({ name: "", price: "", availability: "", details: "" });
const sampleProducts: Product[] = [
  { name: "A4 ruled notebook (200 pages)", price: "Rs 80", availability: "In stock", details: "Hard cover, 70 GSM paper, available in blue, red and green." },
  { name: "NCERT Class 10 Maths", price: "Rs 120", availability: "In stock", details: "Latest edition. Bulk discount for schools on 20 or more copies." },
  { name: "Custom printed diary", price: "From Rs 350", availability: "Made to order, 5 days", details: "Add your name or logo on the cover. 50 percent advance needed." },
];

function ProductsForm({ initial, aiFilled, ...c }: Common & { initial: Product[]; aiFilled?: boolean }) {
  const [rows, setRows] = useState<Product[]>(initial.length ? initial : [emptyProduct(), emptyProduct()]);
  const [bulk, setBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const upd = (i: number, k: keyof Product, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  function importBulk() {
    const items = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l): Product => {
        const m = l.match(/^(.*?)(?:\s[-–—|]\s|\t|\s*:\s)(.+)$/);
        return m ? { ...emptyProduct(), name: m[1].trim(), price: m[2].trim() } : { ...emptyProduct(), name: l };
      });
    if (!items.length) return;
    setRows((r) => [...r.filter((x) => x.name || x.price), ...items]);
    setBulkText("");
    setBulk(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const text = rows
      .filter((r) => r.name.trim())
      .map((r) => toBlock([["Product", r.name], ["Price", r.price], ["Availability", r.availability], ["Details", r.details]]))
      .join("\n\n");
    if (!text) return setError("Add at least one product or service with a name.");
    setSaving(true);
    try {
      await saveEntry(c.botId, c.sourceId, RESERVED.products, text, "paragraphs");
      c.onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 p-6">
      {aiFilled && <AiBanner />}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setRows(sampleProducts)} className="inline-flex items-center gap-2 rounded-full border border-transparent bg-brand-soft px-3.5 py-1.5 text-xs font-semibold text-brand hover:bg-[#d6e0ff]">
          <Ico d={dashIcons.bolt} className="size-3.5" /> Fill with an example
        </button>
        <button type="button" onClick={() => setBulk((b) => !b)} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold shadow-soft hover:bg-gray-50">
          <Ico d={dashIcons.doc} className="size-3.5" /> Paste a list instead
        </button>
      </div>

      {bulk && (
        <div className="space-y-3 rounded-2xl border border-line bg-gray-50 p-4">
          <p className="text-sm font-semibold">One item per line. Use a dash between name and price, e.g. <code className="rounded bg-white px-1">Notebook A4 - Rs 80</code></p>
          <Textarea rows={7} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={"Notebook A4 ruled - Rs 80\nGel pen pack of 10 - Rs 120\nGeometry box - Rs 150\nSketchbook A3 - Rs 220"} />
          <Button type="button" variant="secondary" size="sm" onClick={importBulk}>Add these to the list</Button>
        </div>
      )}

      <div className="space-y-4">
        {rows.map((r, i) => (
          <div key={i} className="rounded-2xl border border-line bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">Item {i + 1}</p>
              {rows.length > 1 && (
                <button type="button" onClick={() => setRows((x) => x.filter((_, j) => j !== i))} aria-label={`Remove item ${i + 1}`} className="grid size-8 place-items-center rounded-lg border border-line text-muted hover:bg-danger-soft hover:text-danger">
                  <Ico d={dashIcons.trash} className="size-4" />
                </button>
              )}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr]">
              <Field label="Name"><Input value={r.name} onChange={(e) => upd(i, "name", e.target.value)} placeholder="A4 ruled notebook (200 pages)" maxLength={200} /></Field>
              <Field label="Price"><Input value={r.price} onChange={(e) => upd(i, "price", e.target.value)} placeholder="Rs 80" maxLength={80} /></Field>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr]">
              <Field label="Availability"><Input value={r.availability} onChange={(e) => upd(i, "availability", e.target.value)} placeholder="In stock" maxLength={120} /></Field>
              <Field label="Details"><Input value={r.details} onChange={(e) => upd(i, "details", e.target.value)} placeholder="Sizes, colours, who it suits, what is included…" maxLength={600} /></Field>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={() => setRows((r) => [...r, emptyProduct()])}>
        <Ico d={dashIcons.plus} className="size-4" /> Add another item
      </Button>
      <Footer saving={saving} error={error} onClose={c.onClose} />
    </form>
  );
}

export function ProductsEditor(c: Common) {
  const text = useExisting(c.botId, c.sourceId);
  if (text === null) return <Loading />;
  const initial = mergeBlocks(text, c.seed ?? "", "Product").map((b) => ({ name: b.Product ?? "", price: b.Price ?? "", availability: b.Availability ?? "", details: b.Details ?? "" }));
  return <ProductsForm {...c} initial={initial} aiFilled={!!c.seed} />;
}

/* ----------------------------------- FAQs ----------------------------------- */

type Qa = { q: string; a: string };
const sampleFaqs: Qa[] = [
  { q: "Do you offer discounts on bulk orders?", a: "Yes. Orders of 50 items or more get 10 percent off. Message us the list and we will send a quote within a few hours." },
  { q: "Can I get something custom printed?", a: "Yes, notebooks and diaries can carry your name or logo. It takes 5 working days and needs a 50 percent advance." },
  { q: "Do you deliver on Sundays?", a: "We deliver Monday to Saturday. Orders placed on Sunday ship on Monday." },
];

function FaqForm({ initial, prefill, aiFilled, ...c }: Common & { initial: Qa[]; prefill?: string; aiFilled?: boolean }) {
  const start = [...initial];
  if (prefill) start.push({ q: prefill, a: "" });
  const [rows, setRows] = useState<Qa[]>(start.length ? start : [{ q: "", a: "" }, { q: "", a: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const upd = (i: number, k: keyof Qa, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const has = (q: string) => rows.some((r) => r.q.trim().toLowerCase() === q.toLowerCase());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const filled = rows.filter((r) => r.q.trim() && r.a.trim());
    if (!filled.length) return setError("Write at least one question with its answer.");
    if (rows.some((r) => r.q.trim() && !r.a.trim())) return setError("Some questions have no answer yet. Answer them or remove them.");
    setSaving(true);
    try {
      const text = filled.map((r) => toBlock([["Question", r.q], ["Answer", r.a]])).join("\n\n");
      await saveEntry(c.botId, c.sourceId, RESERVED.faqs, text, "paragraphs");
      c.onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 p-6">
      {aiFilled && <AiBanner />}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Quick add: questions customers often ask</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMMON_FAQS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={has(q)}
              onClick={() => setRows((r) => [...r.filter((x) => x.q || x.a), { q, a: "" }])}
              className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold hover:bg-brand-soft hover:text-brand disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-ink"
            >
              + {q}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setRows(sampleFaqs)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-transparent bg-brand-soft px-3.5 py-1.5 text-xs font-semibold text-brand hover:bg-[#d6e0ff]">
          <Ico d={dashIcons.bolt} className="size-3.5" /> Fill with an example
        </button>
      </div>

      <div className="space-y-4">
        {rows.map((r, i) => (
          <div key={i} className="rounded-2xl border border-line bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">Question {i + 1}</p>
              {rows.length > 1 && (
                <button type="button" onClick={() => setRows((x) => x.filter((_, j) => j !== i))} aria-label={`Remove question ${i + 1}`} className="grid size-8 place-items-center rounded-lg border border-line text-muted hover:bg-danger-soft hover:text-danger">
                  <Ico d={dashIcons.trash} className="size-4" />
                </button>
              )}
            </div>
            <div className="mt-3 space-y-3">
              <Field label="Customer asks"><Input value={r.q} onChange={(e) => upd(i, "q", e.target.value)} placeholder="Do you offer discounts on bulk orders?" maxLength={300} /></Field>
              <Field label="Your answer" hint="Write it the way you would say it to a customer. Include numbers, names and conditions.">
                <Textarea rows={3} value={r.a} onChange={(e) => upd(i, "a", e.target.value)} placeholder="Yes. Orders of 50 items or more get 10 percent off. Message us the list and we will send a quote within a few hours." maxLength={1500} />
              </Field>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={() => setRows((r) => [...r, { q: "", a: "" }])}>
        <Ico d={dashIcons.plus} className="size-4" /> Add another question
      </Button>
      <Footer saving={saving} error={error} onClose={c.onClose} />
    </form>
  );
}

export function FaqEditor(c: Common & { prefill?: string }) {
  const text = useExisting(c.botId, c.sourceId);
  if (text === null) return <Loading />;
  const initial = mergeBlocks(text, c.seed ?? "", "Question").map((b) => ({ q: b.Question ?? "", a: b.Answer ?? "" }));
  return <FaqForm {...c} initial={initial} prefill={c.prefill} aiFilled={!!c.seed} />;
}

/* ----------------------------- free-form documents ----------------------------- */

const EXAMPLE_DOC = `Bulk and school orders

Schools, coaching centres and offices get special pricing on notebooks, books and stationery.
- 20 to 49 items: 5 percent off
- 50 to 199 items: 10 percent off
- 200 items or more: 15 percent off and free delivery

How it works
1. Send us your list on WhatsApp or email.
2. We reply with a written quote within 4 working hours.
3. Pay 50 percent in advance, the rest on delivery.
4. Bulk orders are delivered in 3 to 5 working days.

Good to know
We can print your school or company name on the cover of notebooks and diaries. Minimum 50 pieces for custom printing. Printed items cannot be returned.`;

export function DocEditor({ botId, onSaved, onClose }: Common) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [info, setInfo] = useState("");
  const [warn, setWarn] = useState("");
  const [error, setError] = useState("");

  // PDF, Word, Markdown, text, CSV and HTML are all read on the server so every format behaves the same
  async function readFile(f: File) {
    setError("");
    setWarn("");
    setInfo("");
    if (f.size > 8 * 1024 * 1024) return setError("That file is too large. The limit is 8 MB.");
    setReading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/knowledge/extract", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "We couldn't read that file.");
      setText(data.text);
      if (!title) setTitle(data.title);
      setInfo(`Read ${f.name}${data.pages ? ` · ${data.pages} page${data.pages === 1 ? "" : "s"}` : ""} · ${Number(data.chars).toLocaleString()} characters. Check the text below, edit anything you like, then add it.`);
      if (data.truncated) setWarn("This file is long, so only the first part was kept (the limit is 60,000 characters). Split big documents into several entries for best results.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setReading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await saveEntry(botId, undefined, title, text, "auto");
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 p-6">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) readFile(f);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${drag ? "border-brand bg-brand-soft" : "border-gray-300 bg-gray-50 hover:border-brand hover:bg-brand-soft/50"}`}
      >
        <span className="grid size-12 place-items-center rounded-xl bg-white text-brand shadow-soft">
          <Ico d={dashIcons.doc} className="size-6" />
        </span>
        <span className="font-semibold">{reading ? "Reading your file…" : "Drop a file here, or click to browse"}</span>
        <span className="text-xs text-muted">PDF, Word (.docx), Markdown, text, CSV or HTML · up to 8 MB</span>
        <input
          type="file"
          accept=".pdf,.docx,.md,.markdown,.txt,.csv,.tsv,.html,.htm,application/pdf"
          className="sr-only"
          disabled={reading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) readFile(f);
            e.target.value = "";
          }}
        />
      </label>
      {info && <p role="status" className="rounded-xl bg-[#dcfbec] px-3.5 py-2.5 text-sm font-medium text-[#067a4b]">{info}</p>}
      {warn && <p role="status" className="rounded-xl bg-[#fff1c2] px-3.5 py-2.5 text-sm font-medium text-[#8a5a00]">{warn}</p>}

      <div className="flex items-center gap-3 text-xs font-semibold text-muted">
        <span className="h-px flex-1 bg-line" /> or type or paste it <span className="h-px flex-1 bg-line" />
      </div>
      <button type="button" onClick={() => { setTitle("Bulk and school orders"); setText(EXAMPLE_DOC); setInfo(""); setWarn(""); }} className="inline-flex items-center gap-2 rounded-full border border-transparent bg-brand-soft px-3.5 py-1.5 text-xs font-semibold text-brand hover:bg-[#d6e0ff]">
        <Ico d={dashIcons.bolt} className="size-3.5" /> Fill with an example
      </button>
      <Field label="Title" hint="A short name so you can find it later.">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bulk and school orders" required maxLength={120} />
      </Field>
      <Field label="Content" hint="Anything customers might ask about: brochures, price lists, how-to guides, terms.">
        <Textarea rows={18} value={text} onChange={(e) => setText(e.target.value)} required maxLength={60000} placeholder={EXAMPLE_DOC} />
      </Field>
      <p className="text-right text-xs font-semibold text-muted">{text.length.toLocaleString()} / 60,000 characters</p>
      <Footer saving={saving} error={error} onClose={onClose} label="Add document" />
    </form>
  );
}
