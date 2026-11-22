import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function GET() {
  return handle(async () => {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("bots")
      .select("id,name,public_key,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ bots: data });
  });
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Give your bot a name").max(80),
  system_instructions: z.string().trim().max(2000).optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = createSchema.parse(await req.json());
    const { supabase, getTenantId } = await requireUser();
    const tenantId = await getTenantId();
    const { data, error } = await supabase
      .from("bots")
      .insert({ tenant_id: tenantId, name: body.name, system_instructions: body.system_instructions ?? "" })
      .select("id,name")
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ bot: data });
  });
}
