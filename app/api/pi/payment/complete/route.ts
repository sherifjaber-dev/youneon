import { NextResponse } from "next/server";
import { completePaymentById } from "@/lib/pi-payment-server";
import { PiPlatformError } from "@/lib/pi-platform";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { paymentId?: unknown; txid?: unknown; username?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await completePaymentById(
      body?.paymentId,
      body?.txid,
      typeof body?.username === "string" ? body.username : null
    );
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error || "Complete failed",
          payment: result.payment,
          piStatus: result.piStatus || result.status,
        },
        { status: result.status }
      );
    }
    return NextResponse.json({
      ok: true,
      payment: result.payment,
      piStatus: result.piStatus || 200,
      premiumUntil: result.grant?.premiumUntil || null,
      alreadyGranted: result.grant?.alreadyGranted || false,
      granted: result.grant?.granted || false,
      neonGranted: result.grant?.neonGranted || 0,
      skipped: result.grant?.skipped || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not complete payment";
    const status = error instanceof PiPlatformError ? error.status : 502;
    console.warn("[Pi] complete route error", message);
    return NextResponse.json(
      { ok: false, error: message, piStatus: status },
      { status }
    );
  }
}
