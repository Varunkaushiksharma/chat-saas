import { Cube3D } from "@/components/Cube3D";
import { FinalCta } from "@/components/FinalCta";
import { Hero } from "@/components/Hero";
import { Burst, Icon, icons } from "@/components/landing-bits";
import { Counter, Reveal, Stamp, TiltCard, VelocityMarquee, WordReveal } from "@/components/motion";
import { Story } from "@/components/Story";
import { h2, tag } from "@/components/site-styles";

const ticker = ["Website chat", "WhatsApp", "Instagram DMs", "Messenger", "Telegram", "Your knowledge", "Your rules", "Human handoff"];
const tickerColors = ["bg-pop-yellow", "bg-white", "bg-pop-green", "bg-white", "bg-pop-yellow", "bg-white", "bg-pop-green", "bg-white"];

const features = [
  { icon: icons.book, title: "Knows your business", body: "Paste prices, policies and FAQs. It answers from those, and says so honestly when it doesn't know.", bg: "bg-pop-blue text-white", span: "md:col-span-2" },
  { icon: icons.shield, title: "Stays in its lane", body: "Block topics, force handoffs on words like refund, and it can only answer. It can't change anything.", bg: "bg-pop-pink text-ink", span: "" },
  { icon: icons.user, title: "Humans in the loop", body: "Unsure chats land in your inbox. Reply, and the customer sees it live in their chat.", bg: "bg-pop-green text-ink", span: "" },
  { icon: icons.chat, title: "Every chat saved", body: "See exactly what customers asked and what they were told. Spot gaps, then teach the bot.", bg: "bg-pop-orange text-ink", span: "" },
  { icon: icons.layers, title: "One brain, many channels", body: "Start on your website. WhatsApp and Instagram plug into the same knowledge and rules.", bg: "bg-pop-yellow text-ink", span: "" },
];

const safety = [
  "Answers only from what you taught it, no guessed prices",
  "Can answer questions, but never delete, refund or edit",
  "Blocked topics are refused, key topics go to a human",
  "Your business data is isolated from every other business",
];

const stats = [
  { n: 1, suffix: "", label: "line of code to add it to your website", bg: "bg-pop-blue text-white", rot: "-rotate-2" },
  { n: 3, suffix: "", label: "simple steps from sign-up to live", bg: "bg-pop-pink text-ink", rot: "rotate-1" },
  { n: 24, suffix: "/7", label: "always on, never tired, never rude", bg: "bg-pop-green text-ink", rot: "-rotate-1" },
];


export default function Landing() {
  return (
    <>
        <Hero />

        {/* ===== ticker: flat pink band, speeds up with your scroll ===== */}
        <section aria-label="What it does" className="border-y-2 border-ink bg-pop-pink py-5">
          <VelocityMarquee baseSpeed={3}>
            {[...ticker, ...ticker].map((t, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border-2 border-ink px-5 py-2 text-sm font-extrabold shadow-[3px_3px_0_#111] ${tickerColors[i % tickerColors.length]}`}
              >
                <span className="size-2 rounded-full bg-ink" />
                {t}
              </span>
            ))}
          </VelocityMarquee>
        </section>

        {/* ===== numbers: sticker cards that stand up in 3D ===== */}
        <section className="mx-auto max-w-6xl px-6 py-28">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            {stats.map((s, i) => (
              <Reveal key={s.label} from="tilt" delay={i * 130}>
                <div className={`${s.rot} rounded-3xl border-2 border-ink px-6 py-10 shadow-[7px_7px_0_#111] ${s.bg}`}>
                  <p className="font-display text-8xl font-extrabold leading-none tracking-[-0.05em]">
                    <Counter to={s.n} suffix={s.suffix} />
                  </p>
                  <p className="mx-auto mt-3 max-w-[15rem] text-sm font-bold">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ===== pinned, scroll-driven story ===== */}
        <Story />

        {/* ===== features: 3D tilt cards ===== */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-28">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <p className={`${tag} bg-pop-pink`}>Features</p>
            </Reveal>
            <h2 className={`mt-5 ${h2}`}>
              <WordReveal parts={[{ text: "Everything a small team needs" }]} />
            </h2>
          </div>
          <div className="mt-16 grid gap-7 md:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} from="tilt" delay={(i % 3) * 120} className={f.span}>
                <TiltCard className={f.bg}>
                  <div className="h-full p-8">
                    <span className="grid size-14 place-items-center rounded-2xl border-2 border-ink bg-white text-ink">
                      <Icon d={f.icon} className="!size-6" />
                    </span>
                    <h3 className="mt-6 font-display text-2xl font-extrabold tracking-tight">{f.title}</h3>
                    <p className="mt-2 font-medium leading-relaxed opacity-90">{f.body}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ===== spinning cube ===== */}
        <Cube3D />

        {/* ===== safety: flat blue ===== */}
        <section id="safety" className="relative scroll-mt-20 overflow-hidden border-b-2 border-ink bg-pop-blue py-28 text-white">
          <div aria-hidden className="absolute -right-16 top-10 size-48 animate-spin-slow">
            <Burst fill="#ffd60a" className="size-full" />
          </div>
          <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 md:grid-cols-2">
            <div>
              <Reveal>
                <p className={`${tag} bg-pop-yellow text-ink`}>Safety first</p>
              </Reveal>
              <h2 className={`mt-5 ${h2}`}>
                <WordReveal parts={[{ text: "It knows its limits" }]} />
              </h2>
              <Reveal delay={150}>
                <p className="mt-5 text-lg font-medium text-white/90">An assistant that makes things up is worse than none. This one is built to stay inside the lines you draw.</p>
              </Reveal>
              <ul className="mt-9 space-y-4">
                {safety.map((s, i) => (
                  <Reveal key={s} from="left" delay={i * 110}>
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-pop-yellow text-ink">
                        <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0z" clipRule="evenodd" /></svg>
                      </span>
                      <span className="font-bold">{s}</span>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>

            <Reveal from="flip" delay={150}>
              <div className="rounded-3xl border-2 border-ink bg-white p-7 text-ink shadow-[10px_10px_0_#111]">
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm border-2 border-ink bg-pop-blue px-4 py-2.5 text-sm font-medium text-white">Delete all my products</p>
                <div className="my-7 grid place-items-center">
                  <Stamp>Can&apos;t do that</Stamp>
                </div>
                <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm border-2 border-ink bg-white px-4 py-2.5 text-sm font-medium">I can only answer questions, so I&apos;ve passed this to our team.</p>
                <span className="mt-3 inline-flex rotate-[-2deg] items-center gap-1.5 rounded-full border-2 border-ink bg-pop-green px-2.5 py-1 text-xs font-extrabold">Handed to a human</span>
              </div>
            </Reveal>
          </div>
        </section>

        <FinalCta />

    </>
  );
}
