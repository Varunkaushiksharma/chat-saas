import type { Metadata } from "next";
import { Burst, Icon, icons, PopLink, Squiggle } from "@/components/landing-bits";
import { Reveal, TiltCard, WordReveal } from "@/components/motion";
import { h1, h2, tag } from "@/components/site-styles";
import { UseCaseExplorer } from "@/components/UseCaseExplorer";

export const metadata: Metadata = {
  title: "Use cases",
  description: "See how shops, restaurants, clinics, salons and coaching centres use an AI assistant to answer customers.",
};

const limits = [
  {
    icon: icons.shield,
    title: "It won't guess",
    body: "If the answer is not in what you taught it, it says so and hands the chat to you. No invented prices or policies.",
    bg: "bg-pop-green text-ink",
  },
  {
    icon: icons.bolt,
    title: "It won't act on your business",
    body: "It only answers questions. It can't edit orders, delete products, refund money or book tables. Those go to a person.",
    bg: "bg-pop-pink text-ink",
  },
  {
    icon: icons.chat,
    title: "It won't pretend to be human",
    body: "The chat window says it is an AI assistant, and customers can always reach a real person.",
    bg: "bg-pop-yellow text-ink",
  },
  {
    icon: icons.user,
    title: "It won't talk over you",
    body: "Once a chat is handed to you, the bot goes quiet. You reply from the inbox and the customer sees it live.",
    bg: "bg-pop-orange text-ink",
  },
];

const steps = [
  { n: "1", title: "Pick what it may answer", body: "Add prices, hours, policies and FAQs. One topic per entry works best." },
  { n: "2", title: "Draw the lines", body: "Block topics, and list the words that should always go to a human, like refund or complaint." },
  { n: "3", title: "Test it like a customer", body: "Chat with it in your dashboard first. Fix gaps, then paste one line of code on your site." },
];

export default function UseCasesPage() {
  return (
    <>
      {/* ===== hero ===== */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-pop-pink">
        <div aria-hidden className="absolute -left-10 top-16 hidden size-40 animate-spin-slow md:block">
          <Burst fill="#ffd60a" className="size-full" />
        </div>
        <div aria-hidden className="absolute -bottom-12 right-10 hidden size-56 rounded-full border-2 border-ink bg-pop-blue md:block" />
        <div aria-hidden className="absolute right-[38%] top-10 hidden animate-wiggle md:block">
          <Squiggle className="w-28" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center md:py-32">
          <Reveal>
            <p className={`${tag} bg-white`}>Use cases</p>
          </Reveal>
          <h1 className={`mx-auto mt-6 max-w-4xl ${h1}`}>
            <WordReveal immediate delay={100} parts={[{ text: "Built for businesses that answer the same questions all day." }]} />
          </h1>
          <Reveal delay={300}>
            <p className="mx-auto mt-6 max-w-2xl text-lg font-semibold text-ink/80">
              Different shops, same pattern: your customers ask the basics, the assistant answers, and the tricky ones come to you.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== explorer ===== */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Reveal>
            <p className={`${tag} bg-pop-yellow`}>Pick your business</p>
          </Reveal>
          <h2 className={`mt-5 ${h2}`}>
            <WordReveal parts={[{ text: "See it in your world" }]} />
          </h2>
        </div>
        <UseCaseExplorer />
      </section>

      {/* ===== setup ===== */}
      <section className="border-y-2 border-ink bg-bg py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <p className={`${tag} bg-pop-green`}>Setup</p>
            </Reveal>
            <h2 className={`mt-5 ${h2}`}>
              <WordReveal parts={[{ text: "The same three steps for everyone" }]} />
            </h2>
          </div>
          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.n} from="tilt" delay={i * 120}>
                <div className="h-full rounded-3xl border-2 border-ink bg-white p-8 shadow-[7px_7px_0_#111]">
                  <span className="grid size-12 place-items-center rounded-full border-2 border-ink bg-pop-yellow font-display text-xl font-extrabold">{s.n}</span>
                  <h3 className="mt-5 font-display text-2xl font-extrabold tracking-tight">{s.title}</h3>
                  <p className="mt-2 font-medium leading-relaxed text-muted">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== what it won't do ===== */}
      <section className="mx-auto max-w-6xl px-6 py-28">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className={`${tag} bg-pop-orange`}>Honest limits</p>
          </Reveal>
          <h2 className={`mt-5 ${h2}`}>
            <WordReveal parts={[{ text: "What it will never do" }]} />
          </h2>
          <Reveal delay={150}>
            <p className="mt-5 text-lg font-medium text-muted">Trust comes from clear limits. These are built in, not left to chance.</p>
          </Reveal>
        </div>
        <div className="mt-16 grid gap-7 md:grid-cols-2">
          {limits.map((l, i) => (
            <Reveal key={l.title} from="tilt" delay={(i % 2) * 120}>
              <TiltCard className={l.bg} depth={30}>
                <div className="flex h-full gap-5 p-8">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-white text-ink">
                    <Icon d={l.icon} className="!size-6" />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-extrabold tracking-tight">{l.title}</h3>
                    <p className="mt-2 font-medium leading-relaxed">{l.body}</p>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== closing ===== */}
      <section className="px-6 pb-28">
        <Reveal from="tilt">
          <div className="mx-auto max-w-5xl rounded-[2.5rem] border-2 border-ink bg-pop-yellow px-8 py-20 text-center shadow-[12px_12px_0_#111]">
            <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] md:text-5xl">Ready to try it on your business?</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg font-semibold text-ink/80">Set it up in minutes. Free to start, no card needed.</p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <PopLink href="/signup" className="bg-pop-blue text-white">Build your assistant</PopLink>
              <PopLink href="/pricing" className="bg-white text-ink" arrow={false}>See pricing</PopLink>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
