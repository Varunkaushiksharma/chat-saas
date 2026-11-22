import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { BRAND } from "@/lib/brand";

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden className="shrink-0">
      <rect x="1.5" y="1.5" width="27" height="27" rx="8" fill="#ffd60a" stroke="#111" strokeWidth="2.5" />
      <path d="M8.5 11A2.5 2.5 0 0 1 11 8.5h8A2.5 2.5 0 0 1 21.5 11v5A2.5 2.5 0 0 1 19 18.5h-4.5L11 22v-3.5h0A2.5 2.5 0 0 1 8.5 16z" fill="#111" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight", className)}>
      <LogoMark />
      {BRAND.name}
    </span>
  );
}

/* ----- Soft, modern app primitives (dashboard, auth, forms) ----- */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ variant = "primary", size = "md", className, ...p }: BtnProps) {
  const v = {
    primary: "bg-brand text-white shadow-[0_1px_2px_rgba(16,24,40,0.18),inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-brand-dark",
    secondary: "border border-line bg-white text-ink shadow-soft hover:bg-gray-50",
    ghost: "text-muted hover:bg-gray-100 hover:text-ink",
    danger: "border border-line bg-white text-danger hover:bg-danger-soft",
  }[variant];
  const s = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm";
  return (
    <button
      {...p}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50",
        v,
        s,
        className,
      )}
    />
  );
}

const field =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

export function Input(p: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx(field, p.className)} />;
}

export function Textarea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx(field, "resize-y", p.className)} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-2xl border border-line bg-white shadow-soft", className)}>{children}</div>;
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "danger" | "info"; children: ReactNode }) {
  const t = {
    neutral: "bg-gray-100 text-gray-600",
    good: "bg-[#dcfbec] text-[#067a4b]",
    warn: "bg-[#fff1c2] text-[#8a5a00]",
    danger: "bg-[#ffe5db] text-[#b23a0e]",
    info: "bg-brand-soft text-brand",
  }[tone];
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", t)}>{children}</span>;
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
      {children}
    </p>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{children}</p>}
    </div>
  );
}
