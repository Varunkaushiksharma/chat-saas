"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { dashIcons, Ico } from "@/components/dash";
import { Logo, LogoMark } from "@/components/ui";
import { SideNav, TopNav } from "./Nav";

const KEY = "dash:collapsed";

/** App frame: collapsible sidebar on desktop (remembered), top bar on phones. */
export function DashShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  // restore the saved choice (deferred so it never blocks the first render)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setCollapsed(localStorage.getItem(KEY) === "1");
      } catch {
        /* storage blocked: stay expanded */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });

  // "[" toggles the sidebar (when you're not typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.key !== "[" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-app md:flex">
      {/* phones */}
      <header className="border-b border-line bg-white md:hidden">
        <div className="px-5 py-4">
          <Link href="/dashboard"><Logo /></Link>
        </div>
        <TopNav />
      </header>

      {/* desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 264 }}
        transition={{ type: "spring", stiffness: 360, damping: 38 }}
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-white md:flex"
      >
        <div className={collapsed ? "flex flex-col items-center gap-3 px-3 py-5" : "flex items-center justify-between px-5 py-5"}>
          <Link href="/dashboard" aria-label="Dashboard home">{collapsed ? <LogoMark size={34} /> : <Logo />}</Link>
          <button
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar  [" : "Collapse sidebar  ["}
            className="grid size-8 place-items-center rounded-lg border border-line text-muted transition hover:bg-gray-100 hover:text-ink"
          >
            <Ico d={collapsed ? dashIcons.expand : dashIcons.collapse} className="size-4" />
          </button>
        </div>
        <SideNav collapsed={collapsed} />
      </motion.aside>

      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
