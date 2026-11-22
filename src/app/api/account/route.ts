import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  return handle(async () => {
    const { supabase, user, getTenantId } = await requireUser();
    const tenantId = await getTenantId();
    const { data } = await supabase.from("tenants").select("name,plan").eq("id", tenantId).maybeSingle();
    return NextResponse.json({ email: user.email, businessName: data?.name ?? "", plan: data?.plan ?? "free" });
  });
}

const schema = z.object({ businessName: z.string().trim().min(1, "Enter a business name").max(80) });

export async function PATCH(req: Request) {
  return handle(async () => {
    const { businessName } = schema.parse(await req.json());
    const { getTenantId } = await requireUser();
    const tenantId = await getTenantId();
    // members can't write the tenants table directly; the update is scoped to THEIR tenant id here
    const { error } = await createAdminClient().from("tenants").update({ name: businessName }).eq("id", tenantId);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, businessName });
  });
}
