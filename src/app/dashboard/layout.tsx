import { Suspense } from "react";
import { DashShell } from "./DashShell";

// The shell reads the URL (usePathname) at request time, so it sits behind a Suspense boundary.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-app" />}>
      <DashShell>{children}</DashShell>
    </Suspense>
  );
}
