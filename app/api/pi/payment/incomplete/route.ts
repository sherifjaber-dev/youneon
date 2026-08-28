import { NextResponse } from "next/server";
import { resolveIncompletePayment } from "@/lib/pi-payment-server";
import {
  parseClientSandbox,
  parsePaymentId,
  parseTxid,
  PiPlatformError,
  piPaymentDebugMeta,
} from "@/lib/pi-platform";
import type { PiPaymentDTO } from "@/lib/pi-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const payment = (body?.payment && typeof body.payment === "object"
      ? body.payment
      : null) as PiPaymentDTO | null;
    const paymentId =
      parsePaymentId(body?.paymentId) ||
      parsePaymentId(payment?.identifier);
    const txid = parseTxid(body?.txid) || parseTxid(payment?.transaction?.txid);
    const sandbox = parseClientSandbox(body, request);

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const debug = piPaymentDebugMeta(sandbox);
    console.info("[pi/payment/incomplete]", { paymentId, txidLength: txid.length, ...debug });
    const result = await resolveIncompletePayment(paymentId, {
      txid,
      payment,
      username: typeof body?.username === "string" ? body.username : null,
      sandbox,
    });
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error || "Incomplete payment failed",
          payment: result.payment,
          piStatus: result.piStatus || result.status,
          ...debug,
        },
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
      skipped: result.grant?.skipped || null,
      waiting: result.waiting || false,
      cancelled: result.cancelled || false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    const status = error instanceof PiPlatformError ? error.status : 400;
    console.warn("[Pi] incomplete route error", message);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
