import { NextRequest, NextResponse } from "next/server";
import { requirePiUser } from "@/lib/server-pi-auth";
import { claimPromoCodeForUser } from "@/lib/promo-codes";

export async function POST(request: NextRequest) {
  const auth = await requirePiUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const result = await claimPromoCodeForUser(
      auth.user.username,
      typeof body.code === "string" ? body.code : ""
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not claim code.";
    const status = (error as { status?: number }).status || 400;
    return NextResponse.json({ error: message }, { status });
  }
}
