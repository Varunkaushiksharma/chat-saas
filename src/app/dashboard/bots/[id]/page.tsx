import { Suspense } from "react";
import { BotView } from "./BotView";

// useParams() reads the URL at request time, so it must sit behind a Suspense boundary (Cache Components).
export default function BotPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <BotView />
    </Suspense>
  );
}
