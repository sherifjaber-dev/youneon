"use client";

import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import type { PiAuthResult, PiPaymentDTO, PiScope } from "@/lib/pi-types";

export const PI_SDK_UNAVAILABLE = "PI_SDK_UNAVAILABLE";
/** Username only — App Studio verification must not be blocked by payments scope. */
export const PI_AUTH_SCOPES: PiScope[] = ["username"];
export const PI_SDK_WAIT_MS = 20000;

let initPromise: Promise<void> | null = null;
let initSucceeded = false;
let authInFlight: Promise<PiAuthResult> | null = null;

function piLog(event: string, detail?: unknown) {
  if (detail !== undefined) {
    console.log(`[Pi] ${event}`, detail);
  } else {
    console.log(`[Pi] ${event}`);
  }
}

export function isPiAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.Pi !== "undefined";
}

export async function waitForPiSdk(timeoutMs = PI_SDK_WAIT_MS): Promise<boolean> {
  if (typeof window === "undefined") {
    piLog("missing window.Pi", "ssr");
    return false;
  }
  if (window.Pi) {
    piLog("window.Pi already present");
    return true;
  }

  piLog("waiting for window.Pi", { timeoutMs });
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    if (window.Pi) {
      piLog("window.Pi became available", { waitedMs: Date.now() - started });
      return true;
    }
  }

  piLog("missing window.Pi", { waitedMs: Date.now() - started });
  return !!window.Pi;
}

export function resetPiSdkInit(): void {
  initPromise = null;
  initSucceeded = false;
  authInFlight = null;
  if (typeof window !== "undefined") {
    window.__YOUNEON_PI_AUTH_PROMISE__ = undefined;
  }
}

/**
 * Initialize the official Pi SDK once. Concurrent callers share one Promise
 * so Pi.authenticate cannot run until Pi.init has fully settled.
 */
export async function initPiSdk(): Promise<void> {
  if (typeof window === "undefined") {
    piLog("init fail", "Pi SDK can only be initialized in the browser");
    throw new Error("Pi SDK can only be initialized in the browser");
  }

  if (!initPromise) {
    initPromise = (async () => {
      const available = await waitForPiSdk();
      if (!available || !window.Pi) {
        piLog("missing window.Pi");
        throw new Error(PI_SDK_UNAVAILABLE);
      }

      const options = {
        version: "2.0",
        sandbox: PI_NETWORK_CONFIG.SANDBOX,
      };
      piLog("init start", options);
      // Pi.init returns a Promise — await it fully (including thenables) before authenticate.
      await Promise.resolve(window.Pi.init(options));
      initSucceeded = true;
      piLog("init success", options);
    })().catch((error) => {
      initPromise = null;
      initSucceeded = false;
      piLog("init fail", error);
      throw error;
    });
  }

  await initPromise;
}

export async function handleIncompletePayment(payment: PiPaymentDTO): Promise<void> {
  const paymentId = payment?.identifier;
  piLog("incomplete payment found", paymentId);
  try {
    await fetch("/api/pi/payment/incomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        paymentId,
        payment,
      }),
    });
  } catch (error) {
    piLog("incomplete payment notify fail (auth can continue)", error);
  }
}

function onIncompletePaymentFound(payment: PiPaymentDTO): void {
  void handleIncompletePayment(payment);
}

/**
 * Call window.Pi.authenticate directly.
 * App Studio looks for Pi.authenticate({ scopes: ['username'] }).
 * Fall back to the classic array + callback signature if the object form throws.
 */
async function callWindowPiAuthenticate(): Promise<PiAuthResult> {
  if (!window.Pi) {
    piLog("missing window.Pi");
    throw new Error(PI_SDK_UNAVAILABLE);
  }

  const Pi = window.Pi;
  piLog("authenticate start", { scopes: ["username"] });

  try {
    const result = await Pi.authenticate({ scopes: ["username"] });
    piLog("authenticate success", result?.user);
    return result;
  } catch (objectFormError) {
    piLog("authenticate object form failed, using array form", objectFormError);
    try {
      const result = await Pi.authenticate(["username"], onIncompletePaymentFound);
      piLog("authenticate success", result?.user);
      return result;
    } catch (arrayFormError) {
      piLog("authenticate fail", arrayFormError);
      throw arrayFormError;
    }
  }
}

/**
 * Authenticate with Pi Browser. Always awaits shared initPiSdk() first.
 * Always invokes window.Pi.authenticate — required for Pi App Studio.
 * Caller must send only accessToken to the backend — never trust SDK uid/username.
 */
export async function authenticatePi(
  _scopes: PiScope[] = PI_AUTH_SCOPES,
  _onIncompletePaymentFound: (payment: PiPaymentDTO) => void = onIncompletePaymentFound
): Promise<PiAuthResult> {
  await initPiSdk();

  if (!window.Pi) {
    piLog("missing window.Pi");
    throw new Error(PI_SDK_UNAVAILABLE);
  }

  const existing = window.__YOUNEON_PI_AUTH_PROMISE__;
  if (existing) {
    try {
      piLog("authenticate awaiting in-flight auto-auth");
      return await existing;
    } catch (error) {
      piLog("in-flight auto-auth failed, calling Pi.authenticate again", error);
      window.__YOUNEON_PI_AUTH_PROMISE__ = undefined;
    }
  }

  if (!authInFlight) {
    authInFlight = callWindowPiAuthenticate().finally(() => {
      authInFlight = null;
    });
    window.__YOUNEON_PI_AUTH_PROMISE__ = authInFlight;
  }

  return authInFlight;
}
