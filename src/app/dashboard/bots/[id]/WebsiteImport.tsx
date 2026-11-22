"use client";

import { Bar, Ico, dashIcons } from "@/components/dash";
import { Badge, Button, cx, ErrorNote, Field, Input } from "@/components/ui";
import { api } from "@/lib/client-api";
import type { SectionKey } from "@/lib/knowledge/specs";

export type ImportPage = { url: string; title: string; text: string; chars: number };
export type Autofill = {
  profileText: string;
  productsText: string;
  policiesText: string;
  faqsText: string;
  counts: { profile: number; products: number; policies: number; faqs: number };
};
export type ImportState = {
  url: string;
  own: boolean;
  phase: "idle" | "crawling" | "pages" | "adding" | "autofilling" | "results";
  site: string;
  source: string;
  pages: ImportPage[];
  selected: string[];
  warnings: string[];
  autofill: Autofill | null;
  saved: string[];
  progress: number;
  message: string;
  error: string;
};
export const initialImport: ImportState = {
  url: "",
  own: false,
  phase: "idle",
  site: "",
  source: "",
  pages: [],
  selected: [],
  warnings: [],
  autofill: null,
  saved: [],
  progress: 0,
  message: "",
  error: "",
};

type Props = {
  botId: string;
  state: ImportState;
  update: (patch: Partial<ImportState>) => void;
  onReview: (kind: SectionKey, seed: string) => void;
  onPagesAdded: () => void;
  onDone: () => void;
};

const BATCH = 5;

function pathOf(url: string) {
  try {
    const u = new URL(url);
    return (u.pathname === "/" ? "/" : u.pathname.replace(/\/$/, "")) + u.search;
  } catch {
    return url;
  }
}

export function WebsiteImport({ botId, state, update, onReview, onPagesAdded, onDone }: Props) {
  const chosen = state.pages.filter((p) => state.selected.includes(p.url));
  const chosenChars = chosen.reduce((a, p) => a + p.chars, 0);

  async function find(e?: React.FormEvent) {
    e?.preventDefault();
    update({ error: "", message: "", phase: "crawling" });
    try {
      const r = await api<{ site: string; source: string; pages: ImportPage[]; warnings: string[] }>("/api/knowledge/crawl", {
        method: "POST",
        body: JSON.stringify({ url: state.url }),
      });
      update({ phase: "pages", site: r.site, source: r.source, pages: r.pages, selected: r.pages.map((p) => p.url), warnings: r.warnings, autofill: null, saved: [] });
    } catch (err) {
      update({ phase: "idle", error: (err as Error).message });
    }
  }

  async function autofill() {
    if (!chosen.length) return update({ error: "Tick at least one page." });
    update({ error: "", message: "", phase: "autofilling" });
    try {
      const r = await api<Autofill>(`/api/bots/${botId}/autofill`, {
        method: "POST",
        body: JSON.stringify({ pages: chosen.map(({ url, title, text }) => ({ url, title, text })) }),
      });
      update({ phase: "results", autofill: r, saved: [] });
    } catch (err) {
      update({ phase: "pages", error: (err as Error).message });
    }
  }

  async function addPages() {
    if (!chosen.length) return update({ error: "Tick at least one page." });
    update({ error: "", message: "", phase: "adding", progress: 0 });
    let added = 0;
    let replaced = 0;
    const failed: string[] = [];
    try {
      for (let i = 0; i < chosen.length; i += BATCH) {
        const batch = chosen.slice(i, i + BATCH).map(({ url, title, text }) => ({ url, title, text }));
        const r = await api<{ added: number; replaced: number; failed: { title: string }[] }>(`/api/bots/${botId}/knowledge/import-pages`, {
          method: "POST",
          body: JSON.stringify({ pages: batch }),
        });
        added += r.added;
        replaced += r.replaced;
        failed.push(...r.failed.map((f) => f.title));
        update({ progress: Math.round((Math.min(i + BATCH, chosen.length) / chosen.length) * 100) });
      }
      onPagesAdded();
      update({
        phase: state.autofill ? "results" : "pages",
        message:
          `Added ${added} page${added === 1 ? "" : "s"} as knowledge` +
          (replaced ? ` and refreshed ${replaced}` : "") +
          (failed.length ? `. ${failed.length} could not be added.` : "."),
      });
    } catch (err) {
      update({ phase: state.autofill ? "results" : "pages", error: (err as Error).message });
    }
  }

  const toggle = (url: string) => update({ selected: state.selected.includes(url) ? state.selected.filter((u) => u !== url) : [...state.selected, url] });

  /* --------------------------------- views --------------------------------- */

  if (state.phase === "crawling" || state.phase === "autofilling" || state.phase === "adding") {
    const text =
      state.phase === "crawling"
        ? `Reading ${state.url}… We follow the sitemap and pick the most useful pages. This can take up to a minute.`
        : state.phase === "autofilling"
          ? `The AI is reading ${chosen.length} page${chosen.length === 1 ? "" : "s"} and filling in your forms. Usually 10 to 20 seconds.`
          : `Teaching your bot… ${state.progress}%`;
    return (
      <div className="space-y-5 p-6">
        <div className="rounded-2xl border border-line bg-gray-50 p-6 text-center">
          <span className="mx-auto grid size-12 animate-pulse place-items-center rounded-xl bg-brand-soft text-brand">
            <Ico d={state.phase === "crawling" ? dashIcons.globe : dashIcons.bolt} className="size-6" />
          </span>
          <p className="mt-4 text-sm font-medium text-ink/80">{text}</p>
          <div className="mx-auto mt-5 max-w-xs">
            {state.phase === "adding" ? <Bar value={state.progress} /> : <div className="h-2.5 overflow-hidden rounded-full bg-gray-200"><div className="h-full w-1/3 rounded-full bg-brand" style={{ animation: "importslide 1.4s ease-in-out infinite" }} /></div>}
          </div>
        </div>
        <style>{`@keyframes importslide{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
      </div>
    );
  }

  if (state.phase === "results" && state.autofill) {
    const a = state.autofill;
    const rows: { kind: SectionKey; title: string; found: string; text: string; n: number }[] = [
      { kind: "profile", title: "Business profile", found: `${a.counts.profile} of 12 details`, text: a.profileText, n: a.counts.profile },
      { kind: "products", title: "Products & services", found: `${a.counts.products} item${a.counts.products === 1 ? "" : "s"}`, text: a.productsText, n: a.counts.products },
      { kind: "policies", title: "Policies", found: `${a.counts.policies} of 6 topics`, text: a.policiesText, n: a.counts.policies },
      { kind: "faqs", title: "FAQs", found: `${a.counts.faqs} question${a.counts.faqs === 1 ? "" : "s"}`, text: a.faqsText, n: a.counts.faqs },
    ];
    const nothing = rows.every((r) => r.n === 0);
    return (
      <div className="space-y-5 p-6">
        <div>
          <h3 className="font-display text-xl font-extrabold tracking-tight">{nothing ? "The AI didn't find business details" : "Here's what the AI found"}</h3>
          <p className="mt-1 text-sm text-muted">
            {nothing
              ? "Those pages don't seem to state things like prices, hours or policies. Try other pages, add the pages as knowledge, or fill the forms by hand."
              : "Nothing is saved yet. Open each section, fix anything that's wrong, then save it."}
          </p>
        </div>
        <ErrorNote>{state.error}</ErrorNote>
        {state.message && <p role="status" className="rounded-xl bg-[#dcfbec] px-3.5 py-2.5 text-sm font-medium text-[#067a4b]">{state.message}</p>}
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
          {rows.map((r) => {
            const done = state.saved.includes(r.kind);
            return (
              <li key={r.kind} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-sm text-muted">{r.n ? `Found ${r.found}` : "Nothing found on these pages"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {done && <Badge tone="good">Saved ✓</Badge>}
                  <Button size="sm" variant={done ? "secondary" : "primary"} disabled={!r.n} onClick={() => onReview(r.kind, r.text)}>
                    {done ? "Review again" : "Review & save"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={addPages}>Also add the pages as knowledge</Button>
          <Button variant="ghost" onClick={() => update({ phase: "pages", message: "" })}>Back to pages</Button>
          <Button variant="ghost" onClick={onDone}>Done</Button>
        </div>
      </div>
    );
  }

  if (state.phase === "pages") {
    return (
      <div className="space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-extrabold tracking-tight">Found {state.pages.length} page{state.pages.length === 1 ? "" : "s"} on {state.site}</h3>
            <p className="mt-1 text-sm text-muted">{state.source === "sitemap" ? "Found through the site's sitemap." : state.source === "links" ? "Found by following links on the home page." : "Just the home page."} Untick anything you don&apos;t want.</p>
          </div>
          <div className="flex gap-2 text-sm font-semibold">
            <button className="text-brand hover:underline" onClick={() => update({ selected: state.pages.map((p) => p.url) })}>All</button>
            <span className="text-muted">·</span>
            <button className="text-brand hover:underline" onClick={() => update({ selected: [] })}>None</button>
          </div>
        </div>

        {state.warnings.map((w) => (
          <p key={w} role="note" className="rounded-xl border border-[#f0d98a] bg-[#fff8dc] px-3.5 py-2.5 text-sm text-[#6b4a00]">{w}</p>
        ))}
        <ErrorNote>{state.error}</ErrorNote>
        {state.message && <p role="status" className="rounded-xl bg-[#dcfbec] px-3.5 py-2.5 text-sm font-medium text-[#067a4b]">{state.message}</p>}

        <ul className="max-h-[340px] divide-y divide-line overflow-y-auto rounded-2xl border border-line bg-white">
          {state.pages.map((p) => {
            const on = state.selected.includes(p.url);
            return (
              <li key={p.url}>
                <label className={cx("flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50", on && "bg-brand-soft/40")}>
                  <input type="checkbox" checked={on} onChange={() => toggle(p.url)} className="mt-1 size-4 accent-brand" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.title}</span>
                    <span className="block truncate text-xs text-muted">{pathOf(p.url)}</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-muted">{p.chars.toLocaleString()} chars</span>
                </label>
              </li>
            );
          })}
        </ul>
        <p className="text-xs font-medium text-muted">{chosen.length} selected · {chosenChars.toLocaleString()} characters</p>

        <div className="space-y-3 rounded-2xl border border-line bg-gray-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-sm text-sm"><strong className="font-semibold">Autofill my forms with AI.</strong> Reads these pages and fills in your business profile, products, policies and FAQs for you to check.</p>
            <Button onClick={autofill} disabled={!chosen.length}><Ico d={dashIcons.bolt} className="size-4" /> Autofill</Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <p className="max-w-sm text-sm"><strong className="font-semibold">Add pages as knowledge.</strong> Adds each page as it is so the bot can search it. Importing again refreshes them.</p>
            <Button variant="secondary" onClick={addPages} disabled={!chosen.length}>Add pages</Button>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => update({ ...initialImport, url: state.url, own: state.own })}>Start over</Button>
      </div>
    );
  }

  // idle
  return (
    <form onSubmit={find} className="space-y-5 p-6">
      <div className="flex gap-3 rounded-2xl bg-brand-soft p-4 text-sm">
        <Ico d={dashIcons.globe} className="mt-0.5 size-5 shrink-0 text-brand" />
        <p className="text-ink/85">Paste your website address. We read your public pages and fill in your knowledge for you, so you don&apos;t have to type it all.</p>
      </div>
      <ErrorNote>{state.error}</ErrorNote>
      <Field label="Your website address" hint="We read up to 30 public pages, following your sitemap and respecting robots.txt.">
        <Input value={state.url} onChange={(e) => update({ url: e.target.value })} placeholder="www.yourshop.com" inputMode="url" autoComplete="url" required maxLength={300} />
      </Field>
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input type="checkbox" checked={state.own} onChange={(e) => update({ own: e.target.checked })} className="mt-0.5 size-4 accent-brand" />
        <span>This is my website, or I have permission to use its content.</span>
      </label>
      <Button type="submit" disabled={!state.own || state.url.trim().length < 3}>Find pages</Button>
      <ul className="space-y-1.5 text-xs text-muted">
        <li>• Only public pages are read. Pages behind a login are not.</li>
        <li>• Sites built entirely with JavaScript may only be partly readable.</li>
        <li>• You choose which pages to keep, and you check everything before it is saved.</li>
      </ul>
    </form>
  );
}
