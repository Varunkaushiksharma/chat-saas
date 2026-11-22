"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { HeroChat } from "@/components/HeroChat";
import { Burst, Icon, icons, PopLink, Squiggle } from "@/components/landing-bits";
import { EASE, WordReveal } from "@/components/motion";
import { BRAND } from "@/lib/brand";
import { useAuthStatus } from "@/lib/useAuthStatus";

/** A sticker that floats at a given depth (translateZ) and bobs up and down. */
function Floating({ z, className, delay = 0, children }: { z: number; className: string; delay?: number; children: React.ReactNode }) {
  return (
    <div className={`absolute ${className}`} style={{ transform: `translateZ(${z}px)`, transformStyle: "preserve-3d" }}>
      <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay }}>
        {children}
      </motion.div>
    </div>
  );
}

export function Hero() {
  const auth = useAuthStatus();
  const ref = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  // --- scroll: the whole scene swings back and away as you leave the hero
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 30, restDelta: 0.001 });
  const sceneY = useTransform(p, [0, 1], [0, -120]);
  const sceneScale = useTransform(p, [0, 1], [1, 0.88]);
  const sceneRotX = useTransform(p, [0, 1], [0, 22]);
  const sceneRotY = useTransform(p, [0, 1], [0, -18]);
  const textY = useTransform(p, [0, 1], [0, -80]);
  const textOpacity = useTransform(p, [0, 0.8], [1, 0]);
  const shapeA = useTransform(p, [0, 1], [0, 220]);
  const shapeB = useTransform(p, [0, 1], [0, -140]);
  const shapeC = useTransform(p, [0, 1], [0, 120]);

  // --- mouse: the scene tilts toward the cursor
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tiltX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 18 });
  const tiltY = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 120, damping: 18 });

  return (
    <section ref={ref} className="relative overflow-hidden bg-white">
      {/* flat decorative shapes that drift at different speeds */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div style={{ y: shapeA }} className="absolute -left-20 top-36 size-56 rounded-full border-2 border-ink bg-pop-pink" />
        <motion.div style={{ y: shapeB }} className="absolute right-[44%] top-10 hidden md:block">
          <div className="animate-wiggle"><Squiggle className="w-28" /></div>
        </motion.div>
        <motion.div style={{ y: shapeC }} className="absolute -right-14 bottom-24 size-40 rounded-full border-2 border-ink bg-pop-orange" />
        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26'%3E%3Ccircle cx='2' cy='2' r='1.4' fill='%23111'/%3E%3C/svg%3E\")" }}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 pb-32 pt-12 md:grid-cols-[1.05fr_1fr] md:pt-20">
        <motion.div style={{ y: textY, opacity: textOpacity }}>
          <motion.p
            initial={{ opacity: 0, y: 14, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-pop-yellow px-4 py-1.5 text-xs font-extrabold shadow-[3px_3px_0_#111]"
          >
            <span className="relative flex size-2.5">
              <span className="absolute inset-0 animate-ring rounded-full bg-ink" />
              <span className="relative size-2.5 rounded-full bg-ink" />
            </span>
            Built for shops, clinics and small businesses
          </motion.p>

          <h1 className="font-display text-[2.8rem] font-extrabold leading-[1.02] tracking-[-0.035em] md:text-[4.8rem]">
            <WordReveal
              immediate
              delay={150}
              parts={[
                { text: "Reply to every customer," },
                { text: "even at 2 a.m.", className: "text-brand underline decoration-pop-pink decoration-[0.13em] underline-offset-[0.08em]" },
              ]}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
            className="mt-7 max-w-xl text-lg font-medium leading-relaxed text-muted"
          >
            {BRAND.tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85, ease: EASE }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <PopLink href="/signup" className="bg-pop-yellow text-ink">Build your assistant</PopLink>
            <Link
              href={auth === "in" ? "/dashboard" : "/login"}
              className="rounded-full border-2 border-ink bg-white px-7 py-3.5 font-extrabold shadow-[4px_4px_0_#111] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-pop-green hover:shadow-[7px_7px_0_#111] active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              {auth === "in" ? "Go to dashboard" : "Log in"}
            </Link>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.8 }} className="mt-6 text-sm font-semibold text-muted">
            Free to start. Set up in minutes, no code needed.
          </motion.p>
          {process.env.NEXT_PUBLIC_DEMO_BOT_KEY && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.8 }} className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-1.5 text-sm font-bold shadow-[3px_3px_0_#111]">
              <span className="size-2 rounded-full bg-pop-green" /> Try it live: the chat bubble in the corner is a real bot.
            </motion.p>
          )}
        </motion.div>

        {/* ---------- the 3D scene ---------- */}
        <motion.div
          ref={sceneRef}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: EASE }}
          onMouseMove={(e) => {
            const r = sceneRef.current!.getBoundingClientRect();
            mx.set((e.clientX - r.left) / r.width - 0.5);
            my.set((e.clientY - r.top) / r.height - 0.5);
          }}
          onMouseLeave={() => {
            mx.set(0);
            my.set(0);
          }}
          className="relative mx-auto h-[500px] w-full max-w-[560px] [perspective:1500px] md:h-[540px]"
        >
          <motion.div style={{ y: sceneY, scale: sceneScale, rotateX: sceneRotX, rotateY: sceneRotY, transformStyle: "preserve-3d" }} className="h-full">
            <motion.div style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }} className="h-full">
              <motion.div
                animate={{ rotateY: [-3, 3, -3], rotateX: [2, -2, 2] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative h-full"
              >
                {/* stacked slabs give the scene real thickness */}
                <div className="absolute inset-0 rounded-3xl border-2 border-ink bg-pop-pink" style={{ transform: "translateZ(-80px) translate(30px,30px)" }} />
                <div className="absolute inset-0 rounded-3xl border-2 border-ink bg-pop-yellow" style={{ transform: "translateZ(-40px) translate(15px,15px)" }} />

                {/* layer 0: the customer's website */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl border-2 border-ink bg-white">
                  <div className="flex items-center gap-3 border-b-2 border-ink bg-pop-yellow px-4 py-2.5">
                    <span className="flex gap-1.5">
                      <i className="size-3 rounded-full border-2 border-ink bg-white" />
                      <i className="size-3 rounded-full border-2 border-ink bg-pop-pink" />
                      <i className="size-3 rounded-full border-2 border-ink bg-pop-green" />
                    </span>
                    <span className="mx-auto rounded-full border-2 border-ink bg-white px-10 py-0.5 text-xs font-bold">varunarts.com</span>
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="h-3.5 w-28 rounded-full bg-ink" />
                    <div className="grid h-28 place-items-center rounded-2xl border-2 border-ink bg-pop-green">
                      <span className="font-display text-2xl font-extrabold">Books &amp; Notebooks</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {["bg-pop-pink", "bg-pop-blue", "bg-pop-orange"].map((c, i) => (
                        <div key={c} className="space-y-2">
                          <div className={`h-20 rounded-xl border-2 border-ink ${c}`} style={{ opacity: 1 - i * 0.0 }} />
                          <div className="h-2 w-3/4 rounded-full bg-ink/20" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* layer 1: the chat widget floats well above the page */}
                <div
                  className="absolute bottom-6 right-5 w-[300px] max-w-[calc(100%-2.5rem)] overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[7px_7px_0_#111]"
                  style={{ transform: "translateZ(90px)" }}
                >
                  <div className="flex items-center gap-3 border-b-2 border-ink bg-pop-blue px-4 py-3 text-white">
                    <span className="grid size-9 place-items-center rounded-full border-2 border-ink bg-pop-yellow font-extrabold text-ink">V</span>
                    <div className="leading-tight">
                      <p className="text-sm font-extrabold">Varun Arts</p>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-white/90"><span className="size-2 rounded-full bg-pop-green" />Online</p>
                    </div>
                  </div>
                  <HeroChat />
                  <div className="flex items-center gap-2 border-t-2 border-ink px-3 py-2.5">
                    <span className="flex-1 rounded-lg border-2 border-ink/30 px-3 py-1.5 text-xs font-medium text-muted">Type a message…</span>
                    <span className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-pop-yellow"><Icon d={icons.arrow} className="!size-4" /></span>
                  </div>
                </div>

                {/* layer 2+: stickers at different depths = parallax when you move the mouse */}
                <Floating z={150} className="-right-5 -top-9">
                  <Burst fill="#ff5ca8" className="size-28 rotate-12">
                    <span className="block font-display text-lg font-extrabold leading-none">FREE</span>
                    <span className="block text-[10px] font-extrabold uppercase">to start</span>
                  </Burst>
                </Floating>
                <Floating z={120} className="-left-6 top-28 hidden md:block" delay={0.8}>
                  <div className="flex -rotate-3 items-center gap-2 rounded-xl border-2 border-ink bg-white px-3 py-2 text-xs font-extrabold shadow-[4px_4px_0_#111]">
                    <span className="grid size-6 place-items-center rounded-full border-2 border-ink bg-pop-yellow"><Icon d={icons.bolt} className="!size-3.5" /></span>
                    Replies in seconds
                  </div>
                </Floating>
                <Floating z={110} className="-bottom-5 left-4 hidden md:block" delay={1.6}>
                  <div className="flex rotate-2 items-center gap-2 rounded-xl border-2 border-ink bg-pop-green px-3 py-2 text-xs font-extrabold shadow-[4px_4px_0_#111]">
                    <Icon d={icons.shield} className="!size-4" />
                    Only from your knowledge
                  </div>
                </Floating>
                <Floating z={60} className="left-12 bottom-32 hidden md:block" delay={0.4}>
                  <div className="size-12 rounded-full border-2 border-ink bg-pop-orange" />
                </Floating>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
