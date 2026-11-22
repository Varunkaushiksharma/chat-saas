import Link from "next/link";
import { Logo } from "@/components/ui";
import { BRAND } from "@/lib/brand";

const cols = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#how", label: "How it works" },
      { href: "/#safety", label: "Safety" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Use cases",
    links: [
      { href: "/use-cases", label: "Shops" },
      { href: "/use-cases", label: "Restaurants" },
      { href: "/use-cases", label: "Clinics" },
      { href: "/use-cases", label: "Salons & coaching" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/signup", label: "Create account" },
      { href: "/login", label: "Log in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm font-medium text-muted">{BRAND.tagline}</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em]">{c.title}</p>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="underline-offset-4 hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t-2 border-ink">
        <p className="mx-auto max-w-6xl px-6 py-4 text-xs font-semibold text-muted">© {BRAND.name}. Made for small businesses.</p>
      </div>
    </footer>
  );
}
