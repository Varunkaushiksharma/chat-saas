import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export const icons = {
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 1 2-2h13",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4",
  user: "M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1 M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M20 19v-1a3 3 0 0 0-2-2.8 M17 4.2A3 3 0 0 1 17 10",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  arrow: "M5 12h14M13 6l6 6-6 6",
};

export function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg className={`size-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

/** Flat colour button with a thick outline and a hard shadow that "presses". */
export function PopLink({
  href,
  children,
  className = "bg-pop-yellow text-ink",
  arrow = true,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  arrow?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-ink px-7 py-3.5 font-extrabold shadow-[4px_4px_0_#111] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#111] active:translate-x-1 active:translate-y-1 active:shadow-none ${className}`}
    >
      {children}
      {arrow && <Icon d={icons.arrow} className="!size-4 transition-transform group-hover:translate-x-1" />}
    </Link>
  );
}

/** A spiky "burst" sticker shape. */
function burstPoints(spikes: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}
const BURST = burstPoints(12, 48, 36);

export function Burst({ fill = "#ff5ca8", className = "", style, children }: { fill?: string; className?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div className={`relative grid place-items-center ${className}`} style={style}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <polygon points={BURST} fill={fill} stroke="#111" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}

/** Squiggly line sticker. */
export function Squiggle({ className = "", stroke = "#111" }: { className?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 120 24" className={className} fill="none" aria-hidden>
      <path d="M3 12c8-14 14 14 22 0s14 14 22 0 14 14 22 0 14 14 22 0 14 14 22 0" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
