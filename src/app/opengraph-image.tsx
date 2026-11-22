import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

// The picture shown when the link is shared in chat apps, LinkedIn, X and so on.
export const alt = `${BRAND.name}: AI replies for your customer chats`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const pill = (text: string, bg: string) => (
    <div style={{ display: "flex", padding: "12px 26px", background: bg, border: "4px solid #111", borderRadius: 999, fontSize: 28, fontWeight: 700, color: "#111" }}>{text}</div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffd60a", padding: 64, fontFamily: "sans-serif", color: "#111" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 46, fontWeight: 800 }}>
          <div style={{ display: "flex", width: 62, height: 62, background: "#fff", border: "5px solid #111", borderRadius: 18, alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", width: 30, height: 22, background: "#111", borderRadius: 8 }} />
          </div>
          {BRAND.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }}>
          <div style={{ display: "flex" }}>Reply to every customer,</div>
          <div style={{ display: "flex", color: "#2b50ff" }}>even at 2 a.m.</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {pill("AI chat for your website", "#fff")}
          {pill("Answers only from your knowledge", "#2fe39a")}
          {pill("Hands off to you", "#ff5ca8")}
        </div>
      </div>
    ),
    size,
  );
}
