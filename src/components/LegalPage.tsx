import type { ReactNode } from "react";
import { tag } from "@/components/site-styles";

export type LegalSection = { heading: string; body: (string | string[])[] };

/** Simple readable page for policies. A string is a paragraph, a string[] is a bullet list. */
export function LegalPage({ title, updated, intro, sections, children }: { title: string; updated: string; intro: string; sections: LegalSection[]; children?: ReactNode }) {
  return (
    <>
      <section className="border-b-2 border-ink bg-pop-yellow">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <p className={`${tag} bg-white`}>Legal</p>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] md:text-6xl">{title}</h1>
          <p className="mt-4 text-sm font-semibold text-ink/70">Last updated {updated}</p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-6 py-14">
        <p className="rounded-2xl border-2 border-ink bg-pop-pink/30 p-5 text-base font-semibold leading-relaxed">{intro}</p>
        {sections.map((s) => (
          <section key={s.heading} className="mt-10">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">{s.heading}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-ink/85">
              {s.body.map((b, i) =>
                Array.isArray(b) ? (
                  <ul key={i} className="list-disc space-y-1.5 pl-6">
                    {b.map((li) => (
                      <li key={li}>{li}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i}>{b}</p>
                ),
              )}
            </div>
          </section>
        ))}
        {children}
      </article>
    </>
  );
}
