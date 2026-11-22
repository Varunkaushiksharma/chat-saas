import Link from "next/link";
import { Burst, Squiggle } from "@/components/landing-bits";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r-2 border-ink bg-pop-blue p-10 text-white md:flex">
        <Link href="/" className="relative z-10 w-fit rounded-xl bg-white px-3 py-1.5 text-ink">
          <Logo />
        </Link>
        <div aria-hidden className="absolute -right-10 top-24 size-44 animate-spin-slow">
          <Burst fill="#ffd60a" className="size-full" />
        </div>
        <div aria-hidden className="absolute -left-12 bottom-40 size-40 rounded-full border-2 border-ink bg-pop-pink" />
        <div aria-hidden className="absolute bottom-24 right-16 animate-wiggle">
          <Squiggle className="w-28" stroke="#fff" />
        </div>
        <div className="relative z-10">
          <p className="font-display text-4xl font-extrabold leading-snug tracking-tight">
            &ldquo;I teach it once. It answers the same ten questions all day, and only calls me when it needs me.&rdquo;
          </p>
          <p className="mt-4 text-sm font-semibold text-white/80">What your assistant does while you run the shop.</p>
        </div>
        <p className="relative z-10 text-xs font-semibold text-white/80">Answers only from your knowledge. Hands off to you when unsure.</p>
      </aside>
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-block md:hidden">
            <Logo />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
