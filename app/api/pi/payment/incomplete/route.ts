import { NextResponse } from "next/server";
import { resolveIncompletePayment } from "@/lib/pi-payment-server";
import { parsePaymentId } from "@/lib/pi-platform";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const paymentId =
      parsePaymentId(body?.paymentId) ||
      parsePaymentId(body?.payment?.identifier);

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    console.info("[pi/payment/incomplete]", paymentId);
    const result = await resolveIncompletePayment(paymentId);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || "Incomplete payment failed", payment: result.payment },
        { status: result.status }
      );
    }

    return NextResponse.json({
      ok: true,
      paymentId,
      payment: result.payment,
      premiumUntil: result.grant?.premiumUntil || null,
      alreadyGranted: result.grant?.alreadyGranted || false,
      granted: result.grant?.granted || false,
      neonGranted: result.grant?.neonGranted || 0,
      waiting: result.waiting || false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    console.warn("[Pi] incomplete route error", message);
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
}
