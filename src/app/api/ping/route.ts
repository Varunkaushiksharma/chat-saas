import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { createAdminClient } from "@/lib/supabase/admin";

// Tiny keep-alive for an uptime monitor (free Supabase projects pause after a week without traffic).
// It touches the database with one trivial query and says nothing else: no AI call, no error details.
export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (!rateLimit(`ping:${ip}`, 30, 60_000)) return new NextResponse(null, { status: 429 });
  try {
    const { error } = await createAdminClient().from("tenants").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
