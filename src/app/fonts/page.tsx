import type { Metadata } from "next";
import {
  Archivo,
  Bricolage_Grotesque,
  DM_Sans,
  Figtree,
  Inter,
  Instrument_Sans,
  Instrument_Serif,
  Manrope,
  Onest,
  Outfit,
  Plus_Jakarta_Sans,
  Sora,
  Space_Grotesk,
  Syne,
  Unbounded,
} from "next/font/google";

export const metadata: Metadata = { title: "Font preview", robots: { index: false, follow: false } };

// Temporary page: pick a pairing, then it gets applied everywhere. Not linked from the site.
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"] });
const dmSans = DM_Sans({ subsets: ["latin"] });
const sora = Sora({ subsets: ["latin"], weight: ["600", "800"] });
const inter = Inter({ subsets: ["latin"] });
const outfit = Outfit({ subsets: ["latin"], weight: ["600", "800"] });
const manrope = Manrope({ subsets: ["latin"] });
const unbounded = Unbounded({ subsets: ["latin"], weight: ["600", "800"] });
const onest = Onest({ subsets: ["latin"] });
const archivo = Archivo({ subsets: ["latin"], weight: ["600", "800"] });
const instrumentSans = Instrument_Sans({ subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400" });
const syne = Syne({ subsets: ["latin"], weight: ["600", "800"] });
const figtree = Figtree({ subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

const combos = [
  { id: "A", name: "Space Grotesk + DM Sans", note: "Techy and quirky, very common for modern startups", head: spaceGrotesk, body: dmSans, hw: 700 },
  { id: "B", name: "Sora + Inter", note: "Clean, geometric and professional", head: sora, body: inter, hw: 800 },
  { id: "C", name: "Outfit + Manrope", note: "Friendly, round and easy to read", head: outfit, body: manrope, hw: 800 },
  { id: "D", name: "Unbounded + Onest", note: "Wide and bold, the most 'pop' of the set", head: unbounded, body: onest, hw: 800 },
  { id: "E", name: "Archivo + Archivo", note: "Strong, sturdy and newspaper-like", head: archivo, body: archivo, hw: 800 },
  { id: "F", name: "Instrument Serif + Instrument Sans", note: "Elegant serif headlines, calm and premium", head: instrumentSerif, body: instrumentSans, hw: 400 },
  { id: "G", name: "Syne + Figtree", note: "Artistic and distinctive headlines", head: syne, body: figtree, hw: 800 },
  { id: "H", name: "Bricolage + Plus Jakarta (what you have now)", note: "Current choice, for comparison", head: bricolage, body: jakarta, hw: 800 },
];

export default function FontPreview() {
  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <p className="inline-block rounded-full border-2 border-ink bg-pop-yellow px-4 py-1 text-xs font-extrabold uppercase tracking-[0.16em]">Font preview</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Pick the pairing you like</h1>
        <p className="mt-2 max-w-2xl text-muted">Each box uses your real content. Tell me the letter (A to H) and I will apply it to the whole website and dashboard.</p>

        <div className="mt-10 grid gap-8">
          {combos.map((c) => {
            const head = { fontFamily: c.head.style.fontFamily, fontWeight: c.hw } as const;
            const body = { fontFamily: c.body.style.fontFamily } as const;
            return (
              <section key={c.id} className="overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-[8px_8px_0_#111]">
                <div className="flex items-center justify-between gap-4 border-b-2 border-ink bg-pop-yellow px-6 py-3" style={body}>
                  <p className="font-bold"><span className="mr-2 inline-grid size-7 place-items-center rounded-full bg-ink text-sm text-white">{c.id}</span>{c.name}</p>
                  <p className="hidden text-sm font-medium sm:block">{c.note}</p>
                </div>

                <div className="grid gap-8 p-6 md:grid-cols-[1.3fr_1fr] md:p-8" style={body}>
                  <div>
                    <p className="text-xl" style={head}>Replyly</p>
                    <h2 className="mt-4 text-4xl leading-[1.05] tracking-tight md:text-5xl" style={head}>Reply to every customer, even at 2 a.m.</h2>
                    <p className="mt-4 max-w-md text-lg text-muted">An AI assistant that answers your customers on your website, and soon WhatsApp and Instagram. It only answers from what you teach it.</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <span className="rounded-full border-2 border-ink bg-pop-yellow px-6 py-3 font-bold shadow-[4px_4px_0_#111]">Build your assistant</span>
                      <span className="rounded-full border-2 border-ink bg-white px-6 py-3 font-bold shadow-[4px_4px_0_#111]">Log in</span>
                    </div>
                    <p className="mt-6 text-sm text-muted">Free to start. Set up in minutes, no code needed. Opening hours: Monday to Saturday, 9am to 6pm.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
                      <p className="text-sm font-semibold text-muted">Waiting for you</p>
                      <p className="mt-2 text-4xl" style={head}>12</p>
                      <p className="mt-1 text-xs text-muted">Customers need a person</p>
                    </div>
                    <div className="rounded-2xl border-2 border-ink bg-pop-pink p-5">
                      <p className="text-sm font-bold">Growth plan</p>
                      <p className="mt-1 text-4xl" style={head}>₹2,999<span className="text-base font-semibold"> / month</span></p>
                      <p className="mt-1 text-sm">3 bots · 5,000 messages · priority support</p>
                    </div>
                    <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm">
                      <p className="font-semibold">Customer: Do you ship to Kenya?</p>
                      <p className="mt-1 text-muted">Yes! Sea freight to East Africa takes 20 to 30 days. 0123456789</p>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
