import { NextResponse } from "next/server";

/**
 * Stub: incomplete Pi payments found during authenticate().
 * Logs the payment id so auth can succeed even before full payment completion is wired.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const paymentId =
      (typeof body?.paymentId === "string" && body.paymentId) ||
      (typeof body?.payment?.identifier === "string" && body.payment.identifier) ||
      null;

    console.info("[pi/payment/incomplete]", paymentId ?? "unknown");

    return NextResponse.json({
      ok: true,
      paymentId,
      status: "logged",
      message: "Incomplete payment recorded. Completion can be handled later.",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
}
