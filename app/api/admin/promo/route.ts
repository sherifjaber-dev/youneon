import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-pi-auth";
import { createPromoCode, listPromoCodes } from "@/lib/promo-codes";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const codes = await listPromoCodes();
    return NextResponse.json({ codes });
  } catch (error) {
    console.warn("[admin/promo] list", error);
    return NextResponse.json({ error: "Could not load promo codes." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  let body: { code?: unknown; neonAmount?: unknown; maxUses?: unknown; expiresAt?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const code = await createPromoCode({
      code: typeof body.code === "string" ? body.code : "",
      neonAmount: Number(body.neonAmount),
      maxUses: Number(body.maxUses || 1),
      expiresAt: typeof body.expiresAt === "string" && body.expiresAt ? body.expiresAt : null,
      createdBy: auth.user.username,
    });
    return NextResponse.json({ code });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create code.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
