"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cx } from "@/components/ui";

export type FaqItem = { q: string; a: string };

/** Accordion: one answer open at a time, with a springy plus icon. */
export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={it.q}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className={cx(
              "rounded-2xl border-2 border-ink shadow-[5px_5px_0_#111] transition-colors duration-200",
              isOpen ? "bg-pop-yellow" : "bg-white hover:bg-bg",
            )}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="font-display text-lg font-extrabold tracking-tight md:text-xl">{it.q}</span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-white text-xl font-extrabold leading-none"
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 pr-16 font-medium leading-relaxed">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
