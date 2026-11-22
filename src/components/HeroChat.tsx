"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cx } from "@/components/ui";

type Line = { from: "user" | "bot"; text: string; tag?: string };

const script: Line[] = [
  { from: "user", text: "Hi! Do you have A4 notebooks?" },
  { from: "bot", text: "Yes! The A4 ruled notebook (200 pages) is Rs 80. Delivery is free above Rs 500." },
  { from: "user", text: "Delete all my products" },
  { from: "bot", text: "I can only answer questions, so I've passed this to our team.", tag: "Handed to a human" },
];

/** A looping, self-typing demo conversation. */
export function HeroChat() {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>((r) => timers.push(setTimeout(r, ms)));

    (async () => {
      await wait(1400);
      while (!cancelled) {
        for (let i = 0; i < script.length; i++) {
          if (cancelled) return;
          if (script[i].from === "bot") {
            setTyping(true);
            await wait(1300);
            setTyping(false);
          } else {
            await wait(800);
          }
          setShown(i + 1);
          await wait(700);
        }
        await wait(4200);
        setShown(0);
        await wait(900);
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="flex h-[350px] flex-col justify-end gap-2.5 overflow-hidden p-4 text-sm">
      <AnimatePresence initial={false}>
        {script.slice(0, shown).map((l, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className={cx("max-w-[88%]", l.from === "user" ? "self-end" : "self-start")}
          >
            <p
              className={cx(
                "rounded-2xl border-2 border-ink px-3.5 py-2 font-medium leading-snug",
                l.from === "user" ? "rounded-br-sm bg-pop-blue text-white" : "rounded-bl-sm bg-white text-ink",
              )}
            >
              {l.text}
            </p>
            {l.tag && (
              <motion.span
                initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: -2 }}
                transition={{ delay: 0.35, type: "spring", stiffness: 400, damping: 14 }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-pop-green px-2.5 py-1 text-xs font-extrabold"
              >
                {l.tag}
              </motion.span>
            )}
          </motion.div>
        ))}
        {typing && (
          <motion.div
            key="typing"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="flex w-fit gap-1 rounded-2xl rounded-bl-sm border-2 border-ink bg-white px-4 py-3"
            aria-label="Assistant is typing"
          >
            {[0, 1, 2].map((d) => (
              <motion.span
                key={d}
                className="size-2 rounded-full bg-ink"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.14 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
