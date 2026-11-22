"use client";

import {
  animate,
  motion,
  MotionConfig,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/components/ui";

export const EASE = [0.2, 0.7, 0.2, 1] as const;

/** Honour the "reduce motion" OS setting for every animation below it. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const offsets = {
  up: { y: 44 },
  down: { y: -44 },
  left: { x: -56 },
  right: { x: 56 },
  scale: { scale: 0.85 },
  // 3D: the element swings up from lying back, like a card being stood upright
  tilt: { y: 70, rotateX: 40, transformPerspective: 900 },
  flip: { rotateY: -70, x: -30, transformPerspective: 900 },
  none: {},
} as const;

/** Fade + move (optionally in 3D) when scrolled into view. */
export function Reveal({
  children,
  from = "up",
  delay = 0,
  className,
}: {
  children: ReactNode;
  from?: keyof typeof offsets;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offsets[from] }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.85, delay: delay / 1000, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

type Part = { text: string; className?: string };

/** Headline whose words rise out of a mask one by one. */
export function WordReveal({ parts, className, delay = 0, immediate = false }: { parts: Part[]; className?: string; delay?: number; immediate?: boolean }) {
  const words = parts.flatMap((p, pi) => p.text.split(" ").map((w, wi) => ({ w, cls: p.className, k: `${pi}-${wi}` })));
  const label = parts.map((p) => p.text).join(" ");
  // The whole headline is observed (not each clipped word) and the words inherit the state.
  return (
    <motion.span
      aria-label={label}
      className={cx("inline", className)}
      initial="hidden"
      {...(immediate ? { animate: "show" } : { whileInView: "show", viewport: { once: true, margin: "0px 0px -10% 0px" } })}
      variants={{ hidden: {}, show: { transition: { delayChildren: delay / 1000, staggerChildren: 0.07 } } }}
    >
      {words.map((x, i) => (
        <span key={x.k} aria-hidden className="inline-block overflow-hidden pb-[0.2em] align-bottom -mb-[0.2em]">
          <motion.span
            className={cx("inline-block", x.cls)}
            variants={{ hidden: { y: "120%", rotate: 5 }, show: { y: 0, rotate: 0, transition: { duration: 0.8, ease: EASE } } }}
          >
            {x.w}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </motion.span>
  );
}

/** Counts up when scrolled into view. */
export function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const value = useMotionValue(0);
  const rounded = useTransform(value, (v) => `${Math.round(v)}${suffix}`);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, to, value]);
  return <motion.span ref={ref}>{rounded}</motion.span>;
}

/** Types text out. Pass play=false to hold, e.g. until a panel is visible. */
export function TypedCode({ text, play = true, className }: { text: string; play?: boolean; className?: string }) {
  const progress = useMotionValue(0);
  const shown = useTransform(progress, (v) => text.slice(0, Math.round(v)));
  useEffect(() => {
    if (!play) return;
    const controls = animate(progress, text.length, { duration: 2.2, ease: "linear", delay: 0.3 });
    return () => controls.stop();
  }, [play, text, progress]);
  return (
    <span className={className}>
      <motion.span>{shown}</motion.span>
      <span className="ml-px inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-current" />
    </span>
  );
}

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

/** Ticker that speeds up (and reverses) with your scroll speed. */
export function VelocityMarquee({ children, baseSpeed = 4 }: { children: ReactNode; baseSpeed?: number }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const boost = useTransform(smooth, [0, 1000], [0, 4], { clamp: false });
  const dir = useRef(1);

  useAnimationFrame((_, delta) => {
    const b = boost.get();
    if (b < 0) dir.current = -1;
    else if (b > 0) dir.current = 1;
    let move = dir.current * baseSpeed * (delta / 1000);
    move += dir.current * move * Math.abs(b);
    baseX.set(wrap(-50, 0, baseX.get() + move));
  });
  const x = useTransform(baseX, (v) => `${v}%`);

  return (
    <div className="overflow-hidden">
      <motion.div style={{ x }} className="flex w-max gap-4">
        {children}
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Card that tilts in 3D toward your cursor. Its content sits on a raised layer (translateZ)
 * so it floats above the card face as it turns.
 */
export function TiltCard({ children, className, depth = 40 }: { children: ReactNode; className?: string; depth?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 220, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 220, damping: 18 });

  return (
    <div className="h-full [perspective:900px]">
      <motion.div
        ref={ref}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        whileHover={{ scale: 1.04 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onMouseMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onMouseLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        className={cx("h-full rounded-3xl border-2 border-ink shadow-[6px_6px_0_#111] transition-shadow hover:shadow-[10px_10px_0_#111]", className)}
      >
        <div className="h-full" style={{ transform: `translateZ(${depth}px)` }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/** The "can't do that" stamp that slams down. */
export function Stamp({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ scale: 2.6, opacity: 0, rotate: -20 }}
      whileInView={{ scale: 1, opacity: 1, rotate: -6 }}
      viewport={{ once: true, margin: "0px 0px -20% 0px" }}
      transition={{ type: "spring", stiffness: 260, damping: 13, delay: 0.7 }}
      className="rounded-xl border-[3px] border-danger px-5 py-2 font-display text-2xl font-extrabold uppercase tracking-widest text-danger"
    >
      {children}
    </motion.div>
  );
}
