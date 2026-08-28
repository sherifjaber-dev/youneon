import { NextResponse } from "next/server";
import { approvePaymentById } from "@/lib/pi-payment-server";
import { parseClientSandbox, PiPlatformError, piPaymentDebugMeta } from "@/lib/pi-platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const result = await approvePaymentById(body?.paymentId, sandbox);
    console.info("[Pi] approve route", {
      paymentId: typeof body?.paymentId === "string" ? body.paymentId : undefined,
      ok: result.ok,
      status: result.status,
      piStatus: result.piStatus || result.status,
      hasProductionKey: debug.hasProductionKey,
      keyLength: debug.keyLength,
      keyStartsWithSkLive: debug.keyStartsWithSkLive,
      headerMode: result.headerMode,
      keySource: result.keySource,
      sandbox: debug.sandbox,
    });
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error || "Approve failed",
          payment: result.payment,
          piStatus: result.piStatus || result.status,
          headerMode: result.headerMode,
          ...debug,
          keySource: result.keySource || debug.keySource,
        },
        { status: result.status }
      );
    }
    return NextResponse.json({
      ok: true,
      payment: result.payment,
      headerMode: result.headerMode,
      ...debug,
      keySource: result.keySource || debug.keySource,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not approve payment";
    const status = error instanceof PiPlatformError ? error.status : 502;
    console.warn("[Pi] approve route error", { message, status, ...debug });
    return NextResponse.json({ error: message, ...debug }, { status });
  }
}
