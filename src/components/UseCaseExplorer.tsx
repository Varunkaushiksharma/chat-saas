"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { EASE } from "@/components/motion";
import { cx } from "@/components/ui";

type Line = { from: "user" | "bot"; text: string; tag?: string };

type UseCase = {
  id: string;
  label: string;
  headline: string;
  panel: string; // full class names so Tailwind can see them
  tab: string;
  questions: string[];
  teach: string[];
  chat: Line[];
  handoff: string[];
  blocked?: string[];
};

const cases: UseCase[] = [
  {
    id: "shops",
    label: "Shops",
    headline: "Stop repeating your delivery and return policy.",
    panel: "bg-pop-yellow",
    tab: "bg-pop-yellow",
    questions: ["What does this cost?", "Do you deliver to my area?", "What is your return policy?", "When are you open?"],
    teach: ["Price list", "Delivery areas and charges", "Return and exchange policy", "Store hours and address"],
    chat: [
      { from: "user", text: "Do you deliver to Rohini?" },
      { from: "bot", text: "Yes! Delivery is free above Rs 500 and takes 2 to 3 days within Delhi." },
      { from: "user", text: "My notebook arrived damaged" },
      { from: "bot", text: "I'm sorry about that. I've passed this to our team and they'll contact you shortly.", tag: "Handed to a human" },
    ],
    handoff: ["damaged", "refund", "bulk order"],
  },
  {
    id: "restaurants",
    label: "Restaurants & cafes",
    headline: "Answer menu and timing questions while you cook.",
    panel: "bg-pop-pink",
    tab: "bg-pop-pink",
    questions: ["Do you have vegan options?", "What time do you close?", "Is there parking?", "Do you deliver?"],
    teach: ["Menu with prices", "Opening hours", "Address and parking", "Allergen notes"],
    chat: [
      { from: "user", text: "Any vegan options?" },
      { from: "bot", text: "Yes! Our vegan burger is Rs 249 and the hummus platter is Rs 199." },
      { from: "user", text: "Can I book a table for 8 tonight?" },
      { from: "bot", text: "I can't take bookings myself, so I've asked our team to call you back.", tag: "Handed to a human" },
    ],
    handoff: ["booking", "catering", "allergy"],
  },
  {
    id: "clinics",
    label: "Clinics",
    headline: "Handle the timings and fees. Leave the medicine to your doctors.",
    panel: "bg-pop-green",
    tab: "bg-pop-green",
    questions: ["What are the OPD timings?", "What is the consultation fee?", "Which doctors are available?", "Do you accept insurance?"],
    teach: ["Doctors and specialities", "OPD timings", "Consultation fees", "Insurance panel"],
    chat: [
      { from: "user", text: "What are your OPD timings?" },
      { from: "bot", text: "We're open 9am to 7pm, Monday to Saturday. Consultation is Rs 500." },
      { from: "user", text: "What medicine should I take for fever?" },
      { from: "bot", text: "I can't give medical advice. Please speak to one of our doctors.", tag: "Topic blocked" },
    ],
    handoff: ["emergency", "appointment"],
    blocked: ["medicine", "diagnosis", "dosage"],
  },
  {
    id: "salons",
    label: "Salons & spas",
    headline: "Quote services and offers without picking up the phone.",
    panel: "bg-pop-orange",
    tab: "bg-pop-orange",
    questions: ["How much is a haircut?", "Do you do bridal makeup?", "Any offers this week?", "Where are you located?"],
    teach: ["Service menu and prices", "Current offers", "Stylist specialities", "Location and hours"],
    chat: [
      { from: "user", text: "How much is a haircut and colour?" },
      { from: "bot", text: "Haircut is Rs 400. Global colour starts at Rs 1,800 depending on length." },
      { from: "user", text: "Can I reschedule my 5pm appointment?" },
      { from: "bot", text: "I'll ask the front desk to sort that out for you right away.", tag: "Handed to a human" },
    ],
    handoff: ["reschedule", "cancel", "complaint"],
  },
  {
    id: "coaching",
    label: "Coaching & courses",
    headline: "Turn enquiries into demo-class sign-ups, day or night.",
    panel: "bg-pop-blue text-white",
    tab: "bg-pop-blue text-white",
    questions: ["What are the fees?", "When does the next batch start?", "What is the syllabus?", "Is there a demo class?"],
    teach: ["Courses and fees", "Batch dates and timings", "Syllabus summaries", "Demo class details"],
    chat: [
      { from: "user", text: "When does the next Class 10 batch start?" },
      { from: "bot", text: "The next Class 10 Maths batch starts on the 1st. Classes run 5pm to 7pm." },
      { from: "user", text: "Can I get a fee discount?" },
      { from: "bot", text: "That's something our counsellor handles. They'll reach out to you soon.", tag: "Handed to a human" },
    ],
    handoff: ["discount", "scholarship", "refund"],
  },
];

/** Tabs by business type; each panel flips over like a card. */
export function UseCaseExplorer() {
  const [active, setActive] = useState(0);
  const c = cases[active];
  const dark = c.panel.includes("text-white");

  return (
    <div>
      <div role="tablist" aria-label="Business types" className="flex flex-wrap justify-center gap-3">
        {cases.map((x, i) => (
          <motion.button
            key={x.id}
            role="tab"
            aria-selected={active === i}
            whileTap={{ scale: 0.94 }}
            onClick={() => setActive(i)}
            className={cx(
              "rounded-full border-2 border-ink px-5 py-2.5 text-sm font-extrabold transition-all",
              active === i ? `${x.tab} -translate-y-1 shadow-[4px_4px_0_#111]` : "bg-white hover:-translate-y-0.5 hover:bg-bg",
            )}
          >
            {x.label}
          </motion.button>
        ))}
      </div>

      <div className="mt-10 [perspective:1600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={c.id}
            role="tabpanel"
            initial={{ opacity: 0, rotateX: -18, y: 40 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, rotateX: 18, y: -30 }}
            transition={{ duration: 0.45, ease: EASE }}
            style={{ transformStyle: "preserve-3d", transformOrigin: "50% 100%" }}
            className={cx("grid gap-8 rounded-[2rem] border-2 border-ink p-6 shadow-[10px_10px_0_#111] md:grid-cols-2 md:p-10", c.panel)}
          >
            <div className="flex flex-col">
              <h3 className="font-display text-3xl font-extrabold leading-[1.08] tracking-tight md:text-4xl">{c.headline}</h3>

              <p className={cx("mt-8 text-xs font-extrabold uppercase tracking-[0.16em]", dark ? "text-white/80" : "text-ink/70")}>Customers ask</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {c.questions.map((q, i) => (
                  <motion.li
                    key={q}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + i * 0.07, type: "spring", stiffness: 380, damping: 20 }}
                    className="rounded-full border-2 border-ink bg-white px-3.5 py-1.5 text-sm font-bold text-ink"
                  >
                    {q}
                  </motion.li>
                ))}
              </ul>

              <p className={cx("mt-8 text-xs font-extrabold uppercase tracking-[0.16em]", dark ? "text-white/80" : "text-ink/70")}>You teach it</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {c.teach.map((t) => (
                  <li key={t} className="flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-3 py-2 text-sm font-bold text-ink">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink bg-pop-green text-[10px]">✓</span>
                    {t}
                  </li>
                ))}
              </ul>

              <p className={cx("mt-8 text-xs font-extrabold uppercase tracking-[0.16em]", dark ? "text-white/80" : "text-ink/70")}>It hands to you on</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.handoff.map((h) => (
                  <span key={h} className="rounded-full border-2 border-ink bg-ink px-3 py-1 text-xs font-extrabold text-white">{h}</span>
                ))}
                {c.blocked?.map((b) => (
                  <span key={b} className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-extrabold text-danger">never: {b}</span>
                ))}
              </div>
            </div>

            {/* example conversation */}
            <div className="self-center rounded-3xl border-2 border-ink bg-white p-5 text-ink shadow-[6px_6px_0_#111]">
              <div className="mb-4 flex items-center gap-2 border-b-2 border-ink pb-3">
                <span className="grid size-8 place-items-center rounded-full border-2 border-ink bg-pop-yellow text-sm font-extrabold">{c.label[0]}</span>
                <p className="text-sm font-extrabold">{c.label} assistant</p>
                <span className="ml-auto text-[11px] font-bold text-muted">example chat</span>
              </div>
              <div className="space-y-3">
                {c.chat.map((l, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 14, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.55, type: "spring", stiffness: 340, damping: 24 }}
                    className={cx("max-w-[88%] text-sm", l.from === "user" ? "ml-auto" : "")}
                  >
                    <p
                      className={cx(
                        "rounded-2xl border-2 border-ink px-3.5 py-2 font-medium leading-snug",
                        l.from === "user" ? "rounded-br-sm bg-pop-blue text-white" : "rounded-bl-sm bg-white",
                      )}
                    >
                      {l.text}
                    </p>
                    {l.tag && (
                      <span className="mt-2 inline-block -rotate-2 rounded-full border-2 border-ink bg-pop-green px-2.5 py-0.5 text-xs font-extrabold">{l.tag}</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="mt-6 text-center text-xs font-semibold text-muted">Example conversations for illustration. Your bot answers from your own knowledge and rules.</p>
    </div>
  );
}
