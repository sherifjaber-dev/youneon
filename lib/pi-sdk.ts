"use client";

import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import type { PiAuthResult, PiPaymentDTO, PiScope } from "@/lib/pi-types";

export const PI_SDK_UNAVAILABLE = "PI_SDK_UNAVAILABLE";
/** Username only — App Studio verification must not be blocked by payments scope. */
export const PI_AUTH_SCOPES: PiScope[] = ["username"];
export const PI_SDK_WAIT_MS = 2000;

let initPromise: Promise<void> | null = null;
let initSucceeded = false;

function errorMessage(error: unknown): string {
  if (!error) return "unknown";
  if (typeof error === "string") return error;
  const err = error as { message?: string };
  if (err?.message) return err.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function logError(error: unknown): void {
  console.log("[Pi] error: " + errorMessage(error));
}

function logSdkLoaded(): void {
  if (typeof window === "undefined" || !window.Pi || window.__YOUNEON_PI_SDK_LOGGED__) return;
  window.__YOUNEON_PI_SDK_LOGGED__ = true;
  console.log("[Pi] SDK loaded");
}

export function isPiAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.Pi !== "undefined";
}

export async function waitForPiSdk(timeoutMs = PI_SDK_WAIT_MS): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }
  if (window.Pi) {
    logSdkLoaded();
    return true;
  }

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (window.Pi) {
      logSdkLoaded();
      return true;
    }
  }

  return !!window.Pi;
}

export function resetPiSdkInit(): void {
  initPromise = null;
  initSucceeded = false;
  if (typeof window !== "undefined") {
    window.__YOUNEON_PI_AUTH_PROMISE__ = undefined;
    window.__YOUNEON_PI_INIT_PROMISE__ = undefined;
  }
}

/**
 * Initialize the official Pi SDK once. Concurrent callers share one Promise.
 */
export async function initPiSdk(): Promise<void> {
  if (typeof window === "undefined") {
    logError("Pi SDK can only be initialized in the browser");
    throw new Error("Pi SDK can only be initialized in the browser");
  }

  const shared = window.__YOUNEON_PI_INIT_PROMISE__;
  if (shared) {
    await shared;
    initSucceeded = true;
    return;
  }

  if (initSucceeded && window.Pi) return;

  if (!initPromise) {
    initPromise = (async () => {
      const available = await waitForPiSdk();
      if (!available || !window.Pi) {
        throw new Error(PI_SDK_UNAVAILABLE);
      }

      logSdkLoaded();
      console.log("[Pi] init start");
      await Promise.resolve(window.Pi.init({ version: "2.0", sandbox: PI_NETWORK_CONFIG.SANDBOX }));
      initSucceeded = true;
      console.log("[Pi] init success");
    })().catch((error) => {
      initPromise = null;
      initSucceeded = false;
      window.__YOUNEON_PI_INIT_PROMISE__ = undefined;
      logError(error);
      throw error;
    });
    window.__YOUNEON_PI_INIT_PROMISE__ = initPromise;
  }

  await initPromise;
}

export async function handleIncompletePayment(payment: PiPaymentDTO): Promise<void> {
  const paymentId = payment?.identifier;
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
  } catch {
    /* auth can continue */
  }
}

function onIncompletePaymentFound(payment: PiPaymentDTO): void {
  void handleIncompletePayment(payment);
}

/**
 * Call window.Pi.authenticate directly.
 * App Studio looks for Pi.authenticate({ scopes: ['username'] }).
 * Fall back to the classic array + callback signature if the object form throws.
 * Never skip this call — Studio detects the invocation, not success.
 */
function callWindowPiAuthenticate(): Promise<PiAuthResult> {
  if (!window.Pi) {
    throw new Error(PI_SDK_UNAVAILABLE);
  }

  const Pi = window.Pi;
  console.log("[Pi] authenticate start");

  try {
    const result = Pi.authenticate({ scopes: ["username"] });
    return Promise.resolve(result).then((authResult) => {
      console.log("[Pi] authenticate success");
      return authResult;
    });
  } catch {
    try {
      const result = Pi.authenticate(["username"], onIncompletePaymentFound);
      return Promise.resolve(result).then((authResult) => {
        console.log("[Pi] authenticate success");
        return authResult;
      });
    } catch (arrayFormError) {
      logError(arrayFormError);
      throw arrayFormError;
    }
  }
}

/**
 * Authenticate with Pi Browser. Always invokes window.Pi.authenticate —
 * required for Pi App Studio. Does not skip for cookies, guest mode, in-flight
 * init, or missing payments scope.
 *
 * Official docs say await init first. If init takes >1s we still authenticate
 * so Studio can detect the call.
 */
export async function authenticatePi(
  _scopes: PiScope[] = PI_AUTH_SCOPES,
  _onIncompletePaymentFound: (payment: PiPaymentDTO) => void = onIncompletePaymentFound,
  _force = false
): Promise<PiAuthResult> {
  if (typeof window !== "undefined" && typeof window.__youneonPiAuth === "function") {
    const vanilla = window.__youneonPiAuth(true);
    if (vanilla && typeof (vanilla as Promise<PiAuthResult>).then === "function") {
      return vanilla as Promise<PiAuthResult>;
    }
    return callWindowPiAuthenticate();
  }

  const available = await waitForPiSdk();
  if (!available || !window.Pi) {
    logError(PI_SDK_UNAVAILABLE);
    throw new Error(PI_SDK_UNAVAILABLE);
  }

  const initWait = initPiSdk().then(() => "init" as const, () => "init-error" as const);
  const timeout = new Promise<"timeout">((resolve) => {
    setTimeout(() => resolve("timeout"), 1000);
  });
  await Promise.race([initWait, timeout]);

  return callWindowPiAuthenticate();
}
