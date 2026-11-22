"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cx, Logo } from "@/components/ui";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cx("sticky top-0 z-50 bg-white transition-all duration-300", scrolled || open ? "border-b-2 border-ink" : "border-b-2 border-transparent")}>
      <div className={cx("mx-auto flex max-w-6xl items-center justify-between px-6 transition-all duration-300", scrolled ? "py-2.5" : "py-4")}>
        <Link href="/" aria-label="Home" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cx("rounded-full px-4 py-2 text-sm font-bold transition-colors hover:bg-pop-yellow", pathname === l.href && "bg-pop-yellow")}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          <Link href="/login" className="hidden rounded-full px-4 py-2 font-bold transition-colors hover:bg-pop-green sm:block">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full border-2 border-ink bg-pop-yellow px-4 py-2 font-extrabold shadow-[3px_3px_0_#111] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_#111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            Get started
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="grid size-10 place-items-center rounded-full border-2 border-ink bg-white md:hidden"
          >
            <span className="relative block h-3.5 w-5">
              <span className={cx("absolute left-0 h-0.5 w-5 bg-ink transition-all", open ? "top-1.5 rotate-45" : "top-0")} />
              <span className={cx("absolute left-0 top-1.5 h-0.5 w-5 bg-ink transition-opacity", open && "opacity-0")} />
              <span className={cx("absolute left-0 h-0.5 w-5 bg-ink transition-all", open ? "top-1.5 -rotate-45" : "top-3")} />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t-2 border-ink bg-pop-yellow md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {[...links, { href: "/login", label: "Log in" }].map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-lg font-extrabold hover:bg-white">
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
