import type { Metadata } from "next";
import { DM_Sans, Geist_Mono, Space_Grotesk } from "next/font/google";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Headings: Space Grotesk (modern, techy, great numbers). Body: DM Sans (clean and very readable).
const dmSans = DM_Sans({ variable: "--font-dmsans", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name}: AI replies for your customer chats`, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
  openGraph: { type: "website", siteName: BRAND.name, title: `${BRAND.name}: AI replies for your customer chats`, description: BRAND.tagline },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${spaceGrotesk.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg font-sans text-ink">{children}</body>
    </html>
  );
}
