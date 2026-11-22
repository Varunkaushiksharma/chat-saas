"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { Burst, PopLink } from "@/components/landing-bits";
import { WordReveal } from "@/components/motion";

/** The banner stands up out of the page in 3D as it scrolls into view. */
export function FinalCta() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 28 });
  const rotateX = useTransform(p, [0, 1], [38, 0]);
  const scale = useTransform(p, [0, 1], [0.84, 1]);
  const y = useTransform(p, [0, 1], [80, 0]);

  return (
    <section className="bg-white px-6 py-28">
      <div ref={ref} className="mx-auto max-w-5xl [perspective:1200px]">
        <motion.div
          style={{ rotateX, scale, y, transformOrigin: "50% 100%" }}
          className="relative rounded-[2.5rem] border-2 border-ink bg-pop-orange px-8 py-24 text-center shadow-[12px_12px_0_#111]"
        >
          <div aria-hidden className="absolute -left-8 -top-10 animate-wiggle">
            <Burst fill="#ffd60a" className="size-28">
              <span className="block font-display text-base font-extrabold leading-none">NO CARD</span>
              <span className="block text-[10px] font-extrabold uppercase">needed</span>
            </Burst>
          </div>
          <div aria-hidden className="absolute -bottom-8 -right-6 size-24 animate-float rounded-full border-2 border-ink bg-pop-pink" />
          <h2 className="relative font-display text-4xl font-extrabold leading-[1.03] tracking-[-0.03em] md:text-6xl">
            <WordReveal parts={[{ text: "Never miss a customer again" }]} />
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-lg font-semibold">Build your assistant in minutes. Free to start, and you stay in control.</p>
          <div className="relative mt-10">
            <PopLink href="/signup" className="bg-white text-ink">Get started free</PopLink>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
