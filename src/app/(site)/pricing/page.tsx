import type { Metadata } from "next";
import { Faq, type FaqItem } from "@/components/Faq";
import { Burst, Icon, icons, PopLink, Squiggle } from "@/components/landing-bits";
import { Reveal, TiltCard, WordReveal } from "@/components/motion";
import { h1, h2, tag } from "@/components/site-styles";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple plans for small businesses. Everything is free during early access.",
};

const plans = [
  {
    name: "Free",
    price: "₹0",
    per: "forever",
    blurb: "Try it on your own website.",
    bg: "bg-white text-ink",
    cta: "Start free",
    ctaClass: "bg-pop-yellow text-ink",
    features: ["1 bot", "100 messages a month", "Website chat widget", "Teach it with text and files", "Topic rules and human handoff", "Full conversation history"],
  },
  {
    name: "Starter",
    price: "₹999",
    per: "/ month",
    blurb: "For one busy shop or clinic.",
    bg: "bg-pop-pink text-ink",
    cta: "Get Starter",
    ctaClass: "bg-white text-ink",
    popular: true,
    features: ["1 bot", "1,000 messages a month", "Website chat widget", "WhatsApp or Instagram *", "Email alerts on handoff *", "Everything in Free"],
  },
  {
    name: "Growth",
    price: "₹2,999",
    per: "/ month",
    blurb: "For teams with more than one front door.",
    bg: "bg-pop-blue text-white",
    cta: "Get Growth",
    ctaClass: "bg-pop-yellow text-ink",
    features: ["3 bots", "5,000 messages a month", "All channels *", "Team inbox with roles *", "Priority support", "Everything in Starter"],
  },
  {
    name: "Scale",
    price: "Let's talk",
    per: "",
    blurb: "Higher volume and custom needs.",
    bg: "bg-pop-yellow text-ink",
    cta: "Get in touch",
    ctaClass: "bg-white text-ink",
    features: ["As many bots as you need", "High-volume messaging", "Custom integrations *", "Dedicated onboarding", "Everything in Growth"],
  },
];

const rows: { feature: string; vals: string[] }[] = [
  { feature: "Bots", vals: ["1", "1", "3", "Unlimited"] },
  { feature: "Messages a month", vals: ["100", "1,000", "5,000", "Custom"] },
  { feature: "Website chat widget", vals: ["✓", "✓", "✓", "✓"] },
  { feature: "Knowledge base (text and files)", vals: ["✓", "✓", "✓", "✓"] },
  { feature: "Topic rules and human handoff", vals: ["✓", "✓", "✓", "✓"] },
  { feature: "Conversation history and inbox", vals: ["✓", "✓", "✓", "✓"] },
  { feature: "WhatsApp or Instagram *", vals: ["—", "1 channel", "All", "All"] },
  { feature: "Email alerts on handoff *", vals: ["—", "✓", "✓", "✓"] },
  { feature: "Team roles *", vals: ["—", "—", "✓", "✓"] },
  { feature: "Support", vals: ["Community", "Email", "Priority", "Dedicated"] },
];

const colHead = ["bg-white", "bg-pop-pink", "bg-pop-blue text-white", "bg-pop-yellow"];

const faqs: FaqItem[] = [
  {
    q: "Is it really free right now?",
    a: "Yes. While we are in early access, every plan is free and nothing asks for a card. The plans and prices on this page are what we are planning, and they may change before we start charging. We will tell you well before that happens.",
  },
  {
    q: "What counts as a message?",
    a: "One message a customer sends and the bot replies to counts as one. Messages you send yourself from the inbox are free. The limits on this page are planned and are not enforced yet.",
  },
  {
    q: "Which channels work today?",
    a: "The website chat widget works today: you paste one line of code into your site. WhatsApp, Instagram and Messenger are on the way, and they will use the same knowledge and rules. They need approval from Meta, which takes time, so we are not promising dates.",
  },
  {
    q: "Can the bot say something wrong or make things up?",
    a: "We built it to answer only from the knowledge you give it and to say it does not know when the answer is not there, then hand the chat to you. No AI is perfect, though, so test your bot in the dashboard, add anything it gets wrong, and read your conversation history.",
  },
  {
    q: "Can it delete or change anything in my business?",
    a: "No. It can only answer questions. It has no way to edit orders, delete products, refund money or book appointments. If a customer asks for any of that, it hands the chat to you.",
  },
  {
    q: "Where does my data go?",
    a: "Your knowledge and conversations are stored in a database where each business is kept separate from every other. To write a reply, the customer's message and the relevant parts of your knowledge are sent to Google's Gemini AI. Please do not put passwords or card numbers into your knowledge.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes, and you can delete a bot, its knowledge and its conversations whenever you like.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* ===== hero ===== */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-pop-yellow">
        <div aria-hidden className="absolute -right-10 top-12 hidden size-44 animate-spin-slow md:block">
          <Burst fill="#ff5ca8" className="size-full" />
        </div>
        <div aria-hidden className="absolute -left-16 bottom-0 hidden size-52 rounded-full border-2 border-ink bg-pop-green md:block" />
        <div aria-hidden className="absolute bottom-10 right-[30%] hidden animate-wiggle md:block">
          <Squiggle className="w-28" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <Reveal>
            <p className={`${tag} bg-white`}>Pricing</p>
          </Reveal>
          <h1 className={`mt-6 max-w-4xl ${h1}`}>
            <WordReveal immediate delay={100} parts={[{ text: "Simple pricing. Free while we're in early access." }]} />
          </h1>
          <Reveal delay={300}>
            <p className="mt-6 max-w-2xl text-lg font-semibold text-ink/80">
              Pick a plan to see what is coming. Today every plan is free, with no card needed.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== plans ===== */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p, i) => (
            <Reveal key={p.name} from="tilt" delay={i * 110}>
              <div className="relative h-full">
                {p.popular && (
                  <div className="absolute -right-5 -top-8 z-10 rotate-12">
                    <Burst fill="#ffd60a" className="size-24">
                      <span className="block font-display text-sm font-extrabold leading-none">MOST</span>
                      <span className="block font-display text-sm font-extrabold leading-none">POPULAR</span>
                    </Burst>
                  </div>
                )}
                <TiltCard className={p.bg} depth={30}>
                  <div className="flex h-full flex-col p-7">
                    <h2 className="font-display text-2xl font-extrabold tracking-tight">{p.name}</h2>
                    <p className="mt-1 text-sm font-semibold opacity-80">{p.blurb}</p>
                    <p className="mt-6 flex items-baseline gap-1.5">
                      <span className="font-display text-5xl font-extrabold tracking-[-0.04em]">{p.price}</span>
                      <span className="text-sm font-bold opacity-80">{p.per}</span>
                    </p>
                    <ul className="mt-6 flex-1 space-y-3 text-sm font-bold">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink bg-white text-ink">
                            <svg className="size-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0z" clipRule="evenodd" /></svg>
                          </span>
                          {f.replace(" *", "\u00A0*")}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8">
                      <PopLink href="/signup" className={`w-full ${p.ctaClass}`}>
                        {p.cta}
                      </PopLink>
                    </div>
                  </div>
                </TiltCard>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="mt-10 text-center text-sm font-semibold text-muted">
            * On our roadmap, not live yet. Message limits and prices are planned and are not enforced during early access.
          </p>
        </Reveal>
      </section>

      {/* ===== comparison ===== */}
      <section className="border-y-2 border-ink bg-bg py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <p className={`${tag} bg-pop-green`}>Compare</p>
            </Reveal>
            <h2 className={`mt-5 ${h2}`}>
              <WordReveal parts={[{ text: "What's in each plan" }]} />
            </h2>
          </div>
          <Reveal from="tilt" className="mt-14">
            <div className="overflow-x-auto rounded-3xl border-2 border-ink bg-white shadow-[8px_8px_0_#111]">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="border-b-2 border-ink p-4 font-display text-lg font-extrabold">Feature</th>
                    {plans.map((p, i) => (
                      <th key={p.name} scope="col" className={`border-b-2 border-l-2 border-ink p-4 text-center font-display text-lg font-extrabold ${colHead[i]}`}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, ri) => (
                    <tr key={r.feature} className={ri % 2 ? "bg-bg" : "bg-white"}>
                      <th scope="row" className="border-t-2 border-ink/15 p-4 font-bold">{r.feature}</th>
                      {r.vals.map((v, i) => (
                        <td key={i} className="border-l-2 border-t-2 border-ink/15 p-4 text-center font-bold">
                          {v === "✓" ? <span className="inline-grid size-6 place-items-center rounded-full border-2 border-ink bg-pop-green text-xs">✓</span> : v === "—" ? <span className="text-ink/30">—</span> : v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== faq ===== */}
      <section className="mx-auto grid max-w-6xl gap-14 px-6 py-28 md:grid-cols-[0.8fr_1.2fr]">
        <div className="md:sticky md:top-28 md:self-start">
          <Reveal>
            <p className={`${tag} bg-pop-orange`}>Questions</p>
          </Reveal>
          <h2 className={`mt-5 ${h2}`}>
            <WordReveal parts={[{ text: "Straight answers" }]} />
          </h2>
          <Reveal delay={150}>
            <p className="mt-5 max-w-sm text-lg font-medium text-muted">Including the awkward ones about AI mistakes and where your data goes.</p>
          </Reveal>
          <Reveal delay={250} className="mt-8 hidden md:block">
            <span className="grid size-16 place-items-center rounded-full border-2 border-ink bg-pop-pink shadow-[4px_4px_0_#111]">
              <Icon d={icons.chat} className="!size-7" />
            </span>
          </Reveal>
        </div>
        <Faq items={faqs} />
      </section>

      {/* ===== closing ===== */}
      <section className="px-6 pb-28">
        <Reveal from="tilt">
          <div className="mx-auto max-w-5xl rounded-[2.5rem] border-2 border-ink bg-pop-blue px-8 py-20 text-center text-white shadow-[12px_12px_0_#111]">
            <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] md:text-5xl">Start free, upgrade when you need to</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-white/90">No card, no commitment. Build your assistant in minutes.</p>
            <div className="mt-9">
              <PopLink href="/signup" className="bg-pop-yellow text-ink">Create your free account</PopLink>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
