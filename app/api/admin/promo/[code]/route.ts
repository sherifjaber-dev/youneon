import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-pi-auth";
import { deactivatePromoCode } from "@/lib/promo-codes";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { code } = await context.params;
  try {
    await deactivatePromoCode(code);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update code.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
