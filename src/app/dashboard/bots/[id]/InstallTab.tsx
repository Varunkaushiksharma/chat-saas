"use client";

import { useState } from "react";
import { Badge, Button, Card, cx } from "@/components/ui";
import type { Bot } from "./types";

type Platform = { id: string; label: string; steps: string[]; code: (origin: string, key: string) => string; note?: string };

const script = (o: string, k: string) => `<script src="${o}/widget.js"\n  data-bot="${k}" async></script>`;

const platforms: Platform[] = [
  {
    id: "html",
    label: "Any website",
    steps: [
      "Open the file that every page shares: your footer, layout or template.",
      "Paste the code just before the closing </body> tag.",
      "Save and publish. The chat bubble now appears on every page.",
    ],
    code: script,
    note: "If your site is a few separate HTML files with no shared footer, paste it into each file.",
  },
  {
    id: "wordpress",
    label: "WordPress",
    steps: [
      "Install a free plugin such as “WPCode” (Insert Headers and Footers).",
      "Open it, choose the Footer box and paste the code.",
      "Save. It now loads on every page of your site.",
    ],
    code: script,
  },
  {
    id: "shopify",
    label: "Shopify",
    steps: [
      "Go to Online Store, then Themes, then “…” and Edit code.",
      "Open layout/theme.liquid.",
      "Paste the code just before </body> and save.",
    ],
    code: script,
  },
  {
    id: "wix",
    label: "Wix",
    steps: [
      "Go to Settings, then Custom Code, then Add Custom Code.",
      "Paste the code. Set “Add code to” All pages, and “Place code in” Body – end.",
      "Apply. Wix needs a Premium plan for custom code.",
    ],
    code: script,
  },
  {
    id: "react",
    label: "React / Next.js",
    steps: [
      "Open your root layout (app/layout.tsx in Next.js).",
      "Add this component once, inside <body>. It works like an import and covers every page.",
      "For plain React (Vite), paste the normal script tag into index.html instead.",
    ],
    code: (o, k) => `import Script from "next/script";\n\n// inside <body> in app/layout.tsx\n<Script src="${o}/widget.js" data-bot="${k}" strategy="afterInteractive" />`,
  },
];

export function InstallTab({ bot }: { bot: Bot }) {
  const [pid, setPid] = useState("html");
  const [copied, setCopied] = useState(false);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const p = platforms.find((x) => x.id === pid) ?? platforms[0];
  const code = p.code(origin, bot.public_key);
  const isLocal = /localhost|127\.0\.0\.1/.test(origin);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the user can still select the text */
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold tracking-tight">Add the chat bubble to your website</h2>
          <Badge tone="good">Website chat</Badge>
        </div>
        <p className="mt-2 text-sm text-ink/80">
          Paste the code <strong className="font-semibold">once</strong>, in the part of your site that every page shares (the footer, theme or layout). The bubble then appears on all pages, and a customer&apos;s chat carries on as they move between them.
        </p>

        <div role="tablist" aria-label="Where is your website built?" className="mt-5 flex flex-wrap gap-2">
          {platforms.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={pid === x.id}
              onClick={() => {
                setPid(x.id);
                setCopied(false);
              }}
              className={cx(
                "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                pid === x.id ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-muted hover:bg-gray-50 hover:text-ink",
              )}
            >
              {x.label}
            </button>
          ))}
        </div>

        <ol className="mt-5 space-y-2.5 text-sm">
          {p.steps.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-bold">{i + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
        {p.note && <p className="mt-3 text-xs text-muted">{p.note}</p>}

        <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-xs leading-relaxed text-[#e8efe9]">{code}</pre>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={copy}>{copied ? "Copied" : "Copy code"}</Button>
          <a className="text-sm font-semibold text-brand hover:underline" target="_blank" rel="noreferrer" href={`/demo.html?key=${bot.public_key}`}>
            Preview on a demo website →
          </a>
        </div>

        {isLocal && (
          <p className="mt-4 rounded-xl bg-[#fff1c2] px-3.5 py-2.5 text-sm text-[#8a5a00]">
            <strong className="font-semibold">Heads up:</strong> this address points to your own computer (localhost), so the chat will only appear on this machine. After you put the app online, the code shows your real web address and works on any site.
          </p>
        )}
        {bot.allowed_domains.length === 0 && (
          <p className="mt-3 rounded-xl bg-[#fff1c2] px-3.5 py-2.5 text-sm text-[#8a5a00]">
            Any website can currently use this bot. Before you go live, add your domain under <strong className="font-semibold">Rules &amp; settings</strong>.
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-lg font-extrabold tracking-tight">Other channels</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center justify-between"><span>WhatsApp</span><Badge>Coming soon</Badge></li>
          <li className="flex items-center justify-between"><span>Instagram DMs</span><Badge>Coming soon</Badge></li>
          <li className="flex items-center justify-between"><span>Facebook Messenger</span><Badge>Coming soon</Badge></li>
        </ul>
      </Card>
    </div>
  );
}
