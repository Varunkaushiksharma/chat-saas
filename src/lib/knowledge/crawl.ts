import net from "node:net";
import { FetchBlocked, safeGet } from "@/lib/net/safe-fetch";

export class CrawlError extends Error {}

export type CrawledPage = { url: string; title: string; text: string; chars: number };
export type CrawlResult = {
  site: string;
  source: "sitemap" | "links" | "single";
  pages: CrawledPage[];
  warnings: string[];
};

export const MAX_PAGES = 30;
const PAGE_CHARS = 8_000;
const TOTAL_CHARS = 150_000;
const CONCURRENCY = 4;
const BUDGET_MS = 40_000;

/* ------------------------------ url helpers ------------------------------ */

export function normalizeStart(input: string): URL {
  let s = input.trim();
  if (!s) throw new CrawlError("Enter your website address.");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = `https://${s}`;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new CrawlError("That doesn't look like a website address. Try something like www.yourshop.com");
  }
  u.hash = "";
  // the parser is lenient ("ht!tp" is accepted as a host), so require a real domain name or an IP address
  const host = u.hostname.replace(/^\[|\]$/g, "");
  const looksLikeDomain = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9-]{2,}$/i.test(host);
  if (!looksLikeDomain && !net.isIP(host)) {
    throw new CrawlError("That doesn't look like a website address. Try something like www.yourshop.com");
  }
  return u;
}

const bare = (host: string) => host.toLowerCase().replace(/^www\./, "");
const sameSite = (a: URL, b: URL) => bare(a.hostname) === bare(b.hostname);

const SKIP_EXT = /\.(jpe?g|png|gif|webp|svg|ico|avif|bmp|css|js|json|xml|rss|zip|gz|rar|7z|mp3|mp4|mov|avi|webm|woff2?|ttf|eot|pdf|docx?|xlsx?|pptx?|csv|exe|dmg)$/i;
const SKIP_PATH = /(\/(cart|checkout|basket|login|log-in|signin|sign-in|register|signup|account|my-account|wp-admin|wp-login|wp-json|feed|tag|author|search|wishlist|compare|cdn-cgi)(\/|$))|[?&](replytocom|add-to-cart|orderby|utm_)/i;
const KEYWORDS = /(about|contact|faq|help|support|pricing|price|plans|shipping|delivery|return|refund|polic|terms|warranty|service|product|shop|store|menu|hours|location|visit|catalog|collection|book|appointment)/i;
const BLOGGY = /(\/blog|\/news|\/article|\/post|\/press|\/20\d\d\/)/i;

function canonical(u: URL): string {
  const c = new URL(u.toString());
  c.hash = "";
  for (const k of [...c.searchParams.keys()]) if (/^(utm_|fbclid|gclid|ref$|mc_)/i.test(k)) c.searchParams.delete(k);
  if (c.pathname.length > 1) c.pathname = c.pathname.replace(/\/+$/, "");
  return c.toString();
}

function score(u: URL, start: URL): number {
  if (canonical(u) === canonical(start)) return 10_000;
  const depth = u.pathname.split("/").filter(Boolean).length;
  let s = 100 - depth * 12;
  if (KEYWORDS.test(u.pathname)) s += 45;
  if (BLOGGY.test(u.pathname)) s -= 30;
  if (u.search) s -= 15;
  return s;
}

/* ------------------------------- robots.txt ------------------------------- */

type Rule = { allow: boolean; pattern: RegExp; len: number };
export type Robots = { rules: Rule[]; sitemaps: string[]; blocksAll: boolean };

function toPattern(path: string) {
  const esc = path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp("^" + (esc.endsWith("\\$") ? esc.slice(0, -2) + "$" : esc));
}

export function parseRobots(text: string): Robots {
  const groups: { agents: string[]; rules: Rule[] }[] = [];
  const sitemaps: string[] = [];
  let cur: { agents: string[]; rules: Rule[] } | null = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "sitemap") sitemaps.push(val);
    else if (key === "user-agent") {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], rules: [] };
        groups.push(cur);
      }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
      continue;
    } else if ((key === "disallow" || key === "allow") && cur && val) {
      cur.rules.push({ allow: key === "allow", pattern: toPattern(val), len: val.length });
    }
    lastWasAgent = false;
  }
  const mine = groups.find((g) => g.agents.includes("replylybot")) ?? groups.find((g) => g.agents.includes("*"));
  const rules = mine?.rules ?? [];
  const blocksAll = rules.some((r) => !r.allow && r.pattern.source === "^\\/") && !rules.some((r) => r.allow && r.len > 1);
  return { rules, sitemaps, blocksAll };
}

export function allowed(robots: Robots, u: URL) {
  const path = u.pathname + u.search;
  let best: Rule | null = null;
  for (const r of robots.rules) {
    if (r.pattern.test(path) && (!best || r.len > best.len || (r.len === best.len && r.allow))) best = r;
  }
  return !best || best.allow;
}

/* -------------------------------- sitemaps -------------------------------- */

export function decodeEntities(s: string) {
  const named: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"',
    ndash: "-", mdash: "-", hellip: "...", copy: "(c)", reg: "(R)", trade: "(TM)", bull: "-", middot: "·", euro: "EUR ", pound: "GBP ", inr: "Rs ",
  };
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(Math.min(parseInt(h, 16), 0x10ffff)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Math.min(Number(d), 0x10ffff)))
    .replace(/&([a-z]+);/gi, (m, n) => named[n.toLowerCase()] ?? m);
}

function sitemapLocs(xml: string): { locs: string[]; isIndex: boolean } {
  const isIndex = /<sitemapindex/i.test(xml);
  const locs = [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+?)\s*(?:\]\]>)?\s*<\/loc>/gi)].map((m) => decodeEntities(m[1]));
  return { locs, isIndex };
}

async function getText(url: string, accept?: string, maxBytes = 1_500_000) {
  try {
    const r = await safeGet(url, { accept, maxBytes, timeoutMs: 8000 });
    return r.status >= 200 && r.status < 300 ? r : null;
  } catch (e) {
    if (e instanceof FetchBlocked) throw e;
    return null;
  }
}

/* ------------------------------ html -> text ------------------------------ */

function jsonLdFacts(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1].trim());
      const nodes: Record<string, unknown>[] = [];
      const walk = (n: unknown) => {
        if (Array.isArray(n)) n.forEach(walk);
        else if (n && typeof n === "object") {
          const o = n as Record<string, unknown>;
          nodes.push(o);
          if (o["@graph"]) walk(o["@graph"]);
        }
      };
      walk(data);
      for (const o of nodes) {
        const t = String(Array.isArray(o["@type"]) ? o["@type"][0] : o["@type"] ?? "");
        if (!/Organization|LocalBusiness|Store|Restaurant|Product|Service|Clinic|Dentist|Salon/i.test(t)) continue;
        const bits: string[] = [];
        if (o.name) bits.push(`Name: ${o.name}`);
        if (o.telephone) bits.push(`Phone: ${o.telephone}`);
        if (o.email) bits.push(`Email: ${o.email}`);
        const addr = o.address as Record<string, unknown> | string | undefined;
        if (typeof addr === "string") bits.push(`Address: ${addr}`);
        else if (addr) bits.push(`Address: ${[addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode, addr.addressCountry].filter(Boolean).join(", ")}`);
        if (o.openingHours) bits.push(`Opening hours: ${[o.openingHours].flat().join("; ")}`);
        const offers = o.offers as Record<string, unknown> | undefined;
        if (offers?.price) bits.push(`Price: ${offers.priceCurrency ?? ""} ${offers.price}`.trim());
        if (o.description) bits.push(`Description: ${String(o.description).slice(0, 300)}`);
        if (bits.length > 1) out.push(bits.join(". "));
      }
    } catch {
      /* ignore broken JSON-LD */
    }
  }
  return out.slice(0, 6);
}

export function extract(html: string): { title: string; text: string; links: string[]; scripty: boolean } {
  const title = decodeEntities((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "").replace(/\s+/g, " ").trim());
  const meta = decodeEntities(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(html)?.[1] ?? "").trim();
  const links = [...html.matchAll(/<a\s[^>]*href=["']([^"'#][^"']*)["']/gi)].map((m) => decodeEntities(m[1]));
  const facts = jsonLdFacts(html);

  const body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<(script|style|noscript|svg|iframe|template|canvas|select|option)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|li|ul|ol|tr|table|h[1-6]|header|footer|main|aside|nav|form|blockquote|address)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, " ");

  const lines = decodeEntities(body)
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 1);

  const titleKey = title.toLowerCase().slice(0, 40);
  const titleLine = title && !lines.slice(0, 6).some((l) => l.toLowerCase().includes(titleKey)) ? [`Page: ${title}`] : [];
  const head = [...titleLine, meta && `Summary: ${meta}`, ...facts.map((f) => `Key facts: ${f}`)].filter(Boolean) as string[];
  const text = [...head, ...lines].join("\n");
  const scripty = (html.match(/<script/gi) ?? []).length > 6 && /id=["'](root|__next|__nuxt|app)["']|ng-app|data-reactroot/i.test(html);
  return { title, text, links, scripty };
}

function cutAtParagraph(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const br = cut.lastIndexOf("\n");
  return (br > max * 0.7 ? cut.slice(0, br) : cut).trim();
}

/* --------------------------------- crawler -------------------------------- */

export async function crawlSite(input: string): Promise<CrawlResult> {
  const started = Date.now();
  const start = normalizeStart(input);
  const origin = start.origin;
  const warnings: string[] = [];

  // robots.txt: respect it
  let robots: Robots = { rules: [], sitemaps: [], blocksAll: false };
  try {
    const r = await getText(`${origin}/robots.txt`, "text/plain", 300_000);
    if (r) robots = parseRobots(r.body);
  } catch (e) {
    if (e instanceof FetchBlocked) throw new CrawlError(e.message);
  }
  if (robots.blocksAll) {
    throw new CrawlError("This website asks automated tools not to read it (robots.txt). Please add your information by hand or upload a file instead.");
  }

  // 1) the home page (also proves the site is reachable)
  let home;
  try {
    home = await getText(start.toString());
  } catch (e) {
    if (e instanceof FetchBlocked) throw new CrawlError(e.message);
  }
  if (!home || !/html|xml|text/i.test(home.contentType + "html")) {
    throw new CrawlError("We couldn't open that website. Check the address, and make sure the site is public.");
  }
  const finalStart = new URL(home.finalUrl);
  const homeX = extract(home.body);

  // 2) discover pages: sitemap first, otherwise links on the home page
  const found = new Map<string, URL>();
  const consider = (raw: string, base: URL) => {
    try {
      const u = new URL(raw, base);
      if (!/^https?:$/.test(u.protocol) || !sameSite(u, finalStart)) return;
      if (SKIP_EXT.test(u.pathname) || SKIP_PATH.test(u.pathname + u.search)) return;
      u.hash = "";
      found.set(canonical(u), u);
    } catch {
      /* ignore bad link */
    }
  };

  let source: CrawlResult["source"] = "single";
  const sitemapCandidates = [...new Set([...robots.sitemaps, `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`])]
    .filter((s) => {
      try {
        return sameSite(new URL(s), finalStart);
      } catch {
        return false;
      }
    })
    .slice(0, 3);

  for (const sm of sitemapCandidates) {
    if (found.size >= 400) break;
    let r;
    try {
      r = await getText(sm, "application/xml,text/xml,*/*;q=0.5", 3_000_000);
    } catch {
      continue;
    }
    if (!r || !/<(urlset|sitemapindex)/i.test(r.body)) continue;
    const top = sitemapLocs(r.body);
    if (top.isIndex) {
      const kids = top.locs.filter((l) => !/\.gz$/i.test(l)).slice(0, 6);
      for (const k of kids) {
        let kr;
        try {
          kr = await getText(k, "application/xml,text/xml,*/*;q=0.5", 3_000_000);
        } catch {
          continue;
        }
        if (kr) sitemapLocs(kr.body).locs.slice(0, 400).forEach((l) => consider(l, finalStart));
      }
    } else {
      top.locs.slice(0, 400).forEach((l) => consider(l, finalStart));
    }
    if (found.size > 1) {
      source = "sitemap";
      break;
    }
  }
  if (found.size < 2) {
    homeX.links.forEach((l) => consider(l, finalStart));
    if (found.size > 0) {
      source = "links";
      warnings.push("This site has no sitemap, so we followed the links on its home page instead. Some pages may be missing.");
    }
  }
  found.set(canonical(finalStart), finalStart);

  // 3) pick the most useful pages, skipping anything robots.txt forbids
  let skippedByRobots = 0;
  const ranked = [...found.values()]
    .filter((u) => {
      const ok = allowed(robots, u);
      if (!ok) skippedByRobots++;
      return ok;
    })
    .sort((a, b) => score(b, finalStart) - score(a, finalStart))
    .slice(0, MAX_PAGES + 12);
  if (skippedByRobots) warnings.push(`${skippedByRobots} page${skippedByRobots === 1 ? " was" : "s were"} skipped because the site asks robots not to read them.`);

  // 4) fetch them (a few at a time, within a time budget)
  const pages: (CrawledPage & { _order: number })[] = [];
  const homeKey = canonical(finalStart);
  const queue = ranked.map((u, i) => ({ u, i }));
  const worker = async () => {
    for (;;) {
      if (Date.now() - started > BUDGET_MS || pages.length >= MAX_PAGES) return;
      const job = queue.shift();
      if (!job) return;
      const isHome = canonical(job.u) === homeKey;
      let html: string | null = null;
      if (isHome) html = home.body;
      else {
        try {
          const r = await getText(job.u.toString());
          if (r && /html/i.test(r.contentType)) html = r.body;
        } catch {
          /* blocked or failed: skip */
        }
      }
      if (!html) continue;
      const x = isHome ? homeX : extract(html);
      const text = cutAtParagraph(x.text, PAGE_CHARS);
      if (text.length < 80) continue;
      const title = (x.title || job.u.pathname || "Page").slice(0, 110);
      pages.push({ url: canonical(job.u), title, text, chars: text.length, _order: job.i });
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  pages.sort((a, b) => a._order - b._order);
  if (Date.now() - started > BUDGET_MS) warnings.push("The website was slow, so we stopped early. You can import again for more pages.");

  // 5) remove menus and footers repeated on most pages (keep them once, on the first page)
  if (pages.length >= 4) {
    const seen = new Map<string, number>();
    for (const p of pages) for (const l of new Set(p.text.split("\n").map((s) => s.toLowerCase()))) seen.set(l, (seen.get(l) ?? 0) + 1);
    const limit = Math.ceil(pages.length * 0.6);
    pages.forEach((p, idx) => {
      if (idx === 0) return;
      const kept = p.text.split("\n").filter((l) => l.length > 120 || (seen.get(l.toLowerCase()) ?? 0) < limit);
      p.text = kept.join("\n");
      p.chars = p.text.length;
    });
  }
  const usable = pages.filter((p) => p.chars >= 80);

  // 6) stay under the overall size cap
  let total = 0;
  const final: CrawledPage[] = [];
  for (const p of usable) {
    if (total + p.chars > TOTAL_CHARS) break;
    total += p.chars;
    final.push({ url: p.url, title: p.title, text: p.text, chars: p.chars });
  }

  if (homeX.text.length < 300 && homeX.scripty) {
    warnings.push("This website builds its pages with JavaScript, so we could only read part of it. If something is missing, add it by hand or upload a file.");
  }
  if (!final.length) {
    throw new CrawlError("We opened the website but couldn't find readable text on it. If it's built with JavaScript, add your information by hand or upload a file instead.");
  }
  if (found.size > MAX_PAGES) warnings.push(`Your site has more than ${MAX_PAGES} pages. We picked the ${final.length} most useful ones.`);

  return { site: bare(finalStart.hostname), source, pages: final, warnings };
}
