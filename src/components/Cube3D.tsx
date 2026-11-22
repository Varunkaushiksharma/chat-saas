"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { Icon, icons } from "@/components/landing-bits";
import { Reveal, WordReveal } from "@/components/motion";

const SIZE = 230;
const HALF = SIZE / 2;

const faces = [
  { name: "Website", note: "Live now", live: true, bg: "bg-pop-blue text-white", t: `rotateY(0deg) translateZ(${HALF}px)`, icon: icons.chat },
  { name: "WhatsApp", note: "Coming soon", live: false, bg: "bg-pop-green text-ink", t: `rotateY(90deg) translateZ(${HALF}px)`, icon: icons.chat },
  { name: "Instagram", note: "Coming soon", live: false, bg: "bg-pop-pink text-ink", t: `rotateY(180deg) translateZ(${HALF}px)`, icon: icons.chat },
  { name: "Messenger", note: "Coming soon", live: false, bg: "bg-pop-yellow text-ink", t: `rotateY(-90deg) translateZ(${HALF}px)`, icon: icons.chat },
  { name: "Your knowledge", note: "One brain", live: true, bg: "bg-pop-orange text-ink", t: `rotateX(90deg) translateZ(${HALF}px)`, icon: icons.book },
  { name: "Your rules", note: "Always on", live: true, bg: "bg-white text-ink", t: `rotateX(-90deg) translateZ(${HALF}px)`, icon: icons.shield },
];

const channels = [
  { name: "Website chat", live: true },
  { name: "WhatsApp", live: false },
  { name: "Instagram DMs", live: false },
  { name: "Facebook Messenger", live: false },
];

/** A cube that spins as you scroll past it: one brain, many channels. */
export function Cube3D() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotateY = useSpring(useTransform(scrollYProgress, [0, 1], [-70, 470]), { stiffness: 70, damping: 20 });
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [-32, -14, -32]), { stiffness: 70, damping: 20 });
  const lift = useTransform(scrollYProgress, [0, 0.5, 1], [60, 0, -60]);

  return (
    <section id="channels" ref={ref} className="overflow-hidden border-b-2 border-ink bg-pop-green py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 md:grid-cols-2">
        <div>
          <Reveal>
            <p className="inline-block rotate-2 rounded-full border-2 border-ink bg-white px-4 py-1 text-xs font-extrabold uppercase tracking-[0.16em]">Channels</p>
          </Reveal>
          <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] md:text-5xl">
            <WordReveal parts={[{ text: "One brain, every place customers message you" }]} />
          </h2>
          <Reveal delay={150}>
            <p className="mt-5 max-w-md text-lg font-medium text-ink/80">
              Teach it once. Start on your website today. WhatsApp and Instagram plug into the same knowledge and rules when they arrive.
            </p>
          </Reveal>
          <ul className="mt-8 flex flex-wrap gap-3">
            {channels.map((c, i) => (
              <Reveal key={c.name} from="scale" delay={i * 90}>
                <li className={`rounded-full border-2 border-ink px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0_#111] ${c.live ? "bg-pop-yellow" : "bg-white"}`}>
                  {c.name}
                  {!c.live && <span className="ml-2 text-xs font-bold opacity-60">soon</span>}
                </li>
              </Reveal>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto grid h-[430px] w-full max-w-[420px] place-items-center [perspective:1100px]">
          <motion.div style={{ y: lift }} className="relative" aria-hidden>
            {/* flat shadow on the "floor" */}
            <div className="absolute left-1/2 top-[calc(100%+70px)] h-8 w-52 -translate-x-1/2 rounded-[50%] bg-ink/25" />
            <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
              <motion.div style={{ rotateX, rotateY, width: SIZE, height: SIZE, transformStyle: "preserve-3d" }} className="relative">
                {faces.map((f) => (
                  <div
                    key={f.name}
                    className={`absolute inset-0 grid place-items-center border-[3px] border-ink ${f.bg}`}
                    style={{ transform: f.t, backfaceVisibility: "hidden" }}
                  >
                    <div className="text-center">
                      <span className="mx-auto grid size-14 place-items-center rounded-full border-[3px] border-ink bg-white text-ink">
                        <Icon d={f.icon} className="!size-7" />
                      </span>
                      <p className="mt-3 font-display text-2xl font-extrabold leading-none">{f.name}</p>
                      <p className="mt-2 inline-block rounded-full border-2 border-ink bg-white px-2.5 py-0.5 text-[11px] font-extrabold text-ink">{f.note}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
