import { Suspense } from "react";
import { MotionProvider } from "@/components/motion";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

// Shared shell for every public marketing page (home, pricing, use cases).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <div className="relative overflow-x-clip bg-white">
        {/* usePathname() inside the header reads the URL at request time, so it sits behind Suspense */}
        <Suspense fallback={<div className="h-[73px] border-b-2 border-transparent" />}>
          <SiteHeader />
        </Suspense>
        {children}
        <SiteFooter />
      </div>
    </MotionProvider>
  );
}
