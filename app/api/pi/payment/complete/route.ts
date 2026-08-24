import { NextResponse } from "next/server";
import { completePaymentById } from "@/lib/pi-payment-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { paymentId?: unknown; txid?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await completePaymentById(body?.paymentId, body?.txid);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Complete failed", payment: result.payment },
        { status: result.status }
      );
    }
    return NextResponse.json({
      ok: true,
      payment: result.payment,
      premiumUntil: result.grant?.premiumUntil || null,
      alreadyGranted: result.grant?.alreadyGranted || false,
      granted: result.grant?.granted || false,
      neonGranted: result.grant?.neonGranted || 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Complete failed";
    console.warn("[Pi] complete route error", message);
    return NextResponse.json({ error: "Could not complete payment" }, { status: 502 });
  }
}
