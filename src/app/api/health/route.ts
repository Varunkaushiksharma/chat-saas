import { NextResponse } from "next/server";
import { getLLM } from "@/lib/llm";
import { createAdminClient } from "@/lib/supabase/admin";

// Visit /api/health to verify your keys are set up correctly.
export async function GET() {
  const result: Record<string, string> = {};

  try {
    const reply = await getLLM().chat({
      system: "Reply with exactly one word.",
      messages: [{ role: "user", content: "Say OK" }],
      maxOutputTokens: 20,
    });
    result.gemini = `ok: ${reply.trim().slice(0, 40)}`;
  } catch (e) {
    result.gemini = `error: ${(e as Error).message}`;
  }

  try {
    const { error } = await createAdminClient().from("tenants").select("id").limit(1);
    result.supabase = error ? `error: ${error.message}` : "ok";
  } catch (e) {
    result.supabase = `error: ${(e as Error).message}`;
  }

  return NextResponse.json(result);
}
