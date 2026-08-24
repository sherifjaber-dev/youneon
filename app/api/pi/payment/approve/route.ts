import { NextResponse } from "next/server";
import { approvePaymentById } from "@/lib/pi-payment-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { paymentId?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await approvePaymentById(body?.paymentId);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Approve failed", payment: result.payment },
        { status: result.status }
      );
    }
    return NextResponse.json({ ok: true, payment: result.payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approve failed";
    console.warn("[Pi] approve route error", message);
    return NextResponse.json({ error: "Could not approve payment" }, { status: 502 });
  }
}
