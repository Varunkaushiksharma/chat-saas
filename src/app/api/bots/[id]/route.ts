import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireBot, requireUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireUser();
    return NextResponse.json({ bot: await requireBot(supabase, id) });
  });
}

// "https://www.Shop.com/path" -> "www.shop.com"
function normalizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/:?#].*$/, "");
}

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  tone: z.string().trim().max(120).optional(),
  system_instructions: z.string().trim().max(2000).optional(),
  fallback_message: z.string().trim().min(1).max(300).optional(),
  confidence_threshold: z.number().min(0.2).max(0.9).optional(),
  allowed_domains: z
    .array(z.string())
    .max(20)
    .transform((d) => d.map(normalizeDomain).filter(Boolean))
    .optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const patch = patchSchema.parse(await req.json());
    const { supabase } = await requireUser();
    await requireBot(supabase, id);
    const { data, error } = await supabase.from("bots").update(patch).eq("id", id).select("*").single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ bot: data });
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireUser();
    await requireBot(supabase, id);
    const { error } = await supabase.from("bots").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  });
}
