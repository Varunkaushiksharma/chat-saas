"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { dashIcons, Ico } from "@/components/dash";
import { cx } from "@/components/ui";
import { api } from "@/lib/client-api";
import { createClient } from "@/lib/supabase/client";
import type { InboxItem } from "../api/inbox/route";

const items = [
  { href: "/dashboard", label: "Overview", icon: dashIcons.home, match: (p: string) => p === "/dashboard" },
  { href: "/dashboard/bots", label: "Bots", icon: dashIcons.bots, match: (p: string) => p.startsWith("/dashboard/bots") },
  { href: "/dashboard/inbox", label: "Inbox", icon: dashIcons.inbox, match: (p: string) => p.startsWith("/dashboard/inbox") },
  { href: "/dashboard/settings", label: "Settings", icon: dashIcons.settings, match: (p: string) => p.startsWith("/dashboard/settings") },
];

/** Hover label shown next to an icon when the sidebar is collapsed. */
function Tip({ children }: { children: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lift transition-opacity group-hover:opacity-100">
      {children}
    </span>
  );
}

function useNavData() {
  const [waiting, setWaiting] = useState(0);
  const [email, setEmail] = useState("");
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);
  // Badge: conversations where a customer is waiting for a human
  useEffect(() => {
    let alive = true;
    const load = () =>
      api<{ conversations: InboxItem[] }>("/api/inbox")
        .then((r) => alive && setWaiting(r.conversations.filter((c) => c.needsReply).length))
        .catch(() => {});
    load();
    const t = setInterval(load, 15_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  return { waiting, email };
}

function useSignOut() {
  const router = useRouter();
  return async () => {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  };
}

/** Desktop sidebar navigation (expanded or icon-only). */
export function SideNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const { waiting, email } = useNavData();
  const signOut = useSignOut();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav className="flex flex-col gap-1 px-3">
        {!collapsed && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Workspace</p>}
        {items.map((i) => {
          const active = i.match(pathname);
          const badge = i.href.endsWith("inbox") && waiting > 0;
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-label={i.label}
              className={cx(
                "group relative flex h-11 items-center rounded-xl text-sm font-semibold transition-colors",
                collapsed ? "justify-center" : "gap-3 px-3",
                active ? "text-brand" : "text-muted hover:bg-gray-100 hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId="side-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl bg-brand-soft"
                />
              )}
              <span className="relative">
                <Ico d={i.icon} className="size-5" />
                {badge && collapsed && <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-white bg-pop-pink" />}
              </span>
              {!collapsed && <span className="relative">{i.label}</span>}
              {badge && !collapsed && (
                <span className="relative ml-auto grid min-w-5 place-items-center rounded-full bg-pop-pink px-1.5 text-[11px] font-bold leading-5 text-ink">{waiting}</span>
              )}
              {collapsed && <Tip>{badge ? `${i.label} (${waiting} waiting)` : i.label}</Tip>}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className={cx("border-t border-line p-3", collapsed && "flex flex-col items-center gap-2")}>
        <div className={cx("flex items-center gap-3", collapsed ? "justify-center" : "px-1")}>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pop-pink font-display text-sm font-extrabold" title={email}>
            {(email[0] ?? "?").toUpperCase()}
          </span>
          {!collapsed && <p className="min-w-0 truncate text-xs font-medium text-muted" title={email}>{email || "…"}</p>}
        </div>
        <button
          onClick={signOut}
          aria-label="Log out"
          className={cx(
            "group relative mt-1 flex h-10 items-center rounded-xl text-sm font-semibold text-muted transition-colors hover:bg-danger-soft hover:text-danger",
            collapsed ? "w-10 justify-center" : "w-full gap-3 px-3",
          )}
        >
          <Ico d={dashIcons.logout} className="size-[18px]" />
          {!collapsed && "Log out"}
          {collapsed && <Tip>Log out</Tip>}
        </button>
      </div>
    </div>
  );
}

/** Phone navigation: a scrollable row of pills under the logo. */
export function TopNav() {
  const pathname = usePathname();
  const { waiting } = useNavData();
  const signOut = useSignOut();
  return (
    <nav className="flex gap-1.5 overflow-x-auto overflow-y-hidden px-3 pb-3">
      {items.map((i) => {
        const active = i.match(pathname);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cx(
              "flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold",
              active ? "bg-brand-soft text-brand" : "text-muted hover:bg-gray-100",
            )}
          >
            <Ico d={i.icon} className="size-[17px]" />
            {i.label}
            {i.href.endsWith("inbox") && waiting > 0 && <span className="rounded-full bg-pop-pink px-1.5 text-[11px] font-bold leading-5 text-ink">{waiting}</span>}
          </Link>
        );
      })}
      <button onClick={signOut} className="ml-auto flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold text-muted hover:bg-danger-soft hover:text-danger">
        <Ico d={dashIcons.logout} className="size-[17px]" /> Log out
      </button>
    </nav>
  );
}
