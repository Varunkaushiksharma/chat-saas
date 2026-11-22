"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EASE, Reveal, TypedCode, WordReveal } from "@/components/motion";
import { cx } from "@/components/ui";

const panelBase = "rounded-3xl border-2 border-ink bg-white p-6 shadow-[8px_8px_0_#111]";

/* ---------------- the three stage panels ---------------- */

function KnowledgePanel() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1500);
    return () => clearTimeout(t);
  }, []);
  const rows = ["Price list", "Return policy", "Opening hours"];
  return (
    <div className={cx(panelBase, "space-y-3")}>
      <p className="text-xs font-extrabold uppercase tracking-widest text-muted">Your knowledge</p>
      {rows.map((t, i) => {
        const learned = i < 2 || done;
        return (
          <motion.div
            key={t}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.18, type: "spring", stiffness: 260, damping: 24 }}
            className="flex items-center justify-between rounded-xl border-2 border-ink bg-bg px-4 py-3.5 text-sm"
          >
            <span className="font-extrabold">{t}</span>
            <motion.span
              layout
              className={cx("rounded-full border-2 border-ink px-3 py-0.5 text-xs font-extrabold", learned ? "bg-pop-green" : "bg-pop-yellow")}
            >
              {learned ? "Learned ✓" : "Learning…"}
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}

function InstallPanel({ play = true }: { play?: boolean }) {
  return (
    <div className="rounded-3xl border-2 border-ink bg-ink p-6 shadow-[8px_8px_0_#2b50ff]">
      <div className="mb-4 flex gap-1.5">
        <i className="size-3 rounded-full bg-pop-pink" />
        <i className="size-3 rounded-full bg-pop-yellow" />
        <i className="size-3 rounded-full bg-pop-green" />
      </div>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-white/50">your-website.html</p>
      <p className="min-h-[5.5rem] break-all font-mono text-[13px] leading-relaxed text-pop-yellow">
        <TypedCode play={play} text={'<script src="https://yourapp.com/widget.js"\n  data-bot="your-bot-key" async></script>'} />
      </p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={play ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 2.7 }}
        className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-pop-green px-3 py-1 text-xs font-bold text-pop-green"
      >
        <span className="size-2 rounded-full bg-pop-green" /> Chat bubble is live
      </motion.p>
    </div>
  );
}

function InboxPanel() {
  return (
    <div className={cx(panelBase, "space-y-3")}>
      <p className="text-xs font-extrabold uppercase tracking-widest text-muted">Inbox</p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="flex items-center gap-3 rounded-xl border-2 border-ink bg-pop-orange px-4 py-3.5"
      >
        <span className="relative flex size-3">
          <span className="absolute inset-0 animate-ring rounded-full bg-ink" />
          <span className="relative size-3 rounded-full bg-ink" />
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-extrabold">Customer waiting</p>
          <p className="truncate text-xs font-medium">I need a refund for order #1042</p>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 40, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 0.9, type: "spring", stiffness: 260, damping: 22 }}
        className="ml-8 rounded-xl rounded-br-sm border-2 border-ink bg-pop-blue px-4 py-3 text-sm font-medium text-white"
      >
        Hi! Sorry about that, I&apos;m sorting your refund now.
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="text-right text-xs font-semibold text-muted">
        Seen by customer just now
      </motion.p>
    </div>
  );
}

const steps: { title: string; body: string; panel: (play?: boolean) => ReactNode }[] = [
  {
    title: "Teach it your business",
    body: "Paste your prices, policies and FAQs, or upload a text file. That is the only thing it is allowed to answer from.",
    panel: () => <KnowledgePanel />,
  },
  {
    title: "Paste one line on your site",
    body: "Copy a single script tag into your website and a chat bubble appears. Works on Shopify, WordPress, Wix and plain HTML.",
    panel: (play) => <InstallPanel play={play} />,
  },
  {
    title: "Step in when it matters",
    body: "When it is unsure, or a customer asks for a person, the chat lands in your inbox and the bot goes quiet. Reply and they see it instantly.",
    panel: () => <InboxPanel />,
  },
];

/* ---------------- desktop: pinned, scroll-driven story ---------------- */

function Desktop() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.max(0, Math.min(steps.length - 1, Math.floor(v * steps.length * 0.999)))));

  return (
    <div ref={ref} className="relative hidden h-[330vh] md:block">
      <div className="sticky top-0 flex h-screen items-center">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-16 px-6 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="inline-block -rotate-2 rounded-full border-2 border-ink bg-white px-4 py-1 text-xs font-extrabold uppercase tracking-[0.16em]">How it works</p>
            <h2 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-[-0.03em]">
              <WordReveal parts={[{ text: "Live in three steps" }]} />
            </h2>

            <div className="relative mt-12 pl-12">
              <div aria-hidden className="absolute bottom-2 left-[17px] top-2 w-1 rounded bg-ink/15">
                <motion.div style={{ scaleY: fill }} className="h-full w-full origin-top rounded bg-ink" />
              </div>
              {steps.map((s, i) => {
                const on = i === active;
                const past = i < active;
                return (
                  <motion.div
                    key={s.title}
                    animate={{ opacity: on ? 1 : 0.6, x: on ? 8 : 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="relative pb-10 last:pb-0"
                  >
                    <motion.span
                      animate={{ scale: on ? 1.2 : 1, rotate: on ? -8 : 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 16 }}
                      className={cx(
                        "absolute -left-12 top-0 grid size-9 place-items-center rounded-full border-2 border-ink font-display text-sm font-extrabold",
                        on ? "bg-ink text-white" : past ? "bg-pop-pink text-ink" : "bg-white text-ink",
                      )}
                    >
                      {i + 1}
                    </motion.span>
                    <h3 className="font-display text-2xl font-extrabold tracking-tight">{s.title}</h3>
                    <p className="mt-2 max-w-md font-medium text-ink/75">{s.body}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* each step's panel flips in like a card turning over */}
          <div className="relative [perspective:1400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, rotateY: -80, x: 40, scale: 0.92 }}
                animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: 80, x: -40, scale: 0.92 }}
                transition={{ duration: 0.5, ease: EASE }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {steps[active].panel(true)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- mobile: simple stacked reveal ---------------- */

function Mobile() {
  return (
    <div className="mx-auto max-w-md space-y-14 px-6 md:hidden">
      <Reveal>
        <p className="inline-block -rotate-2 rounded-full border-2 border-ink bg-white px-4 py-1 text-xs font-extrabold uppercase tracking-[0.16em]">How it works</p>
        <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em]">Live in three steps</h2>
      </Reveal>
      {steps.map((s, i) => (
        <Reveal key={s.title} from="tilt">
          <span className="grid size-10 place-items-center rounded-full border-2 border-ink bg-white font-display font-extrabold">{i + 1}</span>
          <h3 className="mt-3 font-display text-2xl font-extrabold tracking-tight">{s.title}</h3>
          <p className="mt-2 font-medium text-ink/75">{s.body}</p>
          <div className="mt-5">{s.panel(true)}</div>
        </Reveal>
      ))}
    </div>
  );
}

export function Story() {
  return (
    <section id="how" className="border-y-2 border-ink bg-pop-yellow py-16 md:py-0">
      <Desktop />
      <Mobile />
    </section>
  );
}
