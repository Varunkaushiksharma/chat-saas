"use client";

import { useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import type { Bot } from "./types";

export function InstallTab({ bot }: { bot: Bot }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const snippet = `<script src="${origin}/widget.js"\n  data-bot="${bot.public_key}" async></script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
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
          <h2 className="font-display text-xl font-semibold">Add the chat bubble to your website</h2>
          <Badge tone="good">Website chat</Badge>
        </div>
        <p className="mt-1 text-sm text-muted">
          Paste this just before the closing <code className="rounded bg-bg px-1">&lt;/body&gt;</code> tag on every page where you want the chat. It works on Shopify, WordPress, Wix and plain HTML.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-ink p-4 text-xs leading-relaxed text-[#e8efe9]">{snippet}</pre>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={copy}>{copied ? "Copied" : "Copy snippet"}</Button>
          <a className="text-sm font-medium text-brand hover:underline" target="_blank" rel="noreferrer" href={`/demo.html?key=${bot.public_key}`}>
            Preview on a demo website →
          </a>
        </div>
        {bot.allowed_domains.length === 0 && (
          <p className="mt-4 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
            Any website can currently use this bot. Before you go live, add your domain under <strong>Rules &amp; settings</strong>.
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-lg font-semibold">Other channels</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center justify-between"><span>WhatsApp</span><Badge>Coming soon</Badge></li>
          <li className="flex items-center justify-between"><span>Instagram DMs</span><Badge>Coming soon</Badge></li>
          <li className="flex items-center justify-between"><span>Facebook Messenger</span><Badge>Coming soon</Badge></li>
        </ul>
      </Card>
    </div>
  );
}
