import { NextResponse } from "next/server";
import { cancelPiPayment, getPiPayment, parsePaymentId } from "@/lib/pi-platform";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { paymentId?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paymentId = parsePaymentId(body?.paymentId);
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
  }

  try {
    const current = await getPiPayment(paymentId);
    if (current.data?.status?.developer_completed) {
      return NextResponse.json({ ok: true, skipped: "already_completed", payment: current.data });
    }
    if (current.data?.status?.cancelled || current.data?.status?.user_cancelled) {
      return NextResponse.json({ ok: true, skipped: "already_cancelled", payment: current.data });
    }

    const cancelled = await cancelPiPayment(paymentId);
    if (!cancelled.ok) {
      return NextResponse.json(
        { error: "Pi cancel failed", payment: cancelled.data },
        { status: cancelled.status || 502 }
      );
    }
    return NextResponse.json({ ok: true, payment: cancelled.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cancel failed";
    console.warn("[Pi] cancel route error", message);
    return NextResponse.json({ error: "Could not cancel payment" }, { status: 502 });
  }
}
