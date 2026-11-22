"use client";

import Script from "next/script";

/**
 * Puts a REAL chat bubble on the marketing pages, connected to a demo bot, so a visitor can try the
 * product straight away. Set NEXT_PUBLIC_DEMO_BOT_KEY to that bot's public key (Install tab in the dashboard).
 * Without the variable, nothing is added.
 */
export function DemoWidget() {
  const key = process.env.NEXT_PUBLIC_DEMO_BOT_KEY;
  if (!key) return null;
  return <Script id="demo-widget" src="/widget.js" data-bot={key} data-title="Ask the demo bot" strategy="lazyOnload" />;
}
