import { NextResponse } from "next/server";
import { cancelPaymentById } from "@/lib/pi-payment-server";
import { parseClientSandbox, PiPlatformError, piPaymentDebugMeta } from "@/lib/pi-platform";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { paymentId?: unknown; sandbox?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sandbox = parseClientSandbox(body, request);
  const debug = piPaymentDebugMeta(sandbox);
  try {
    const result = await cancelPaymentById(body?.paymentId, sandbox);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Pi cancel failed", payment: result.payment, ...debug },
        { status: result.status || 502 }
      );
    }
    return NextResponse.json({
      ok: true,
      payment: result.payment,
      cancelled: result.cancelled || false,
      premiumUntil: result.grant?.premiumUntil || null,
      alreadyGranted: result.grant?.alreadyGranted || false,
      granted: result.grant?.granted || false,
      neonGranted: result.grant?.neonGranted || 0,
      ...debug,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not cancel payment";
    const status = error instanceof PiPlatformError ? error.status : 502;
    console.warn("[Pi] cancel route error", { message, status, ...debug });
    return NextResponse.json({ error: message, ...debug }, { status });
  }
}
