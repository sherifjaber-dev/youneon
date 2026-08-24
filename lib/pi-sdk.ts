"use client";

import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import type { PiAuthResult, PiPaymentDTO, PiScope } from "@/lib/pi-types";

export const PI_SDK_UNAVAILABLE = "PI_SDK_UNAVAILABLE";
/** Username only — App Studio verification must not be blocked by payments scope. */
export const PI_AUTH_SCOPES: PiScope[] = ["username"];
export const PI_SDK_WAIT_MS = 2000;

let initPromise: Promise<void> | null = null;
let initSucceeded = false;
let authInFlight: Promise<PiAuthResult> | null = null;

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

  if (typeof window.__youneonWaitForPi === "function") {
    const found = await window.__youneonWaitForPi(timeoutMs);
    if (found) logSdkLoaded();
    return found;
  }

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 50));
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
  authInFlight = null;
  if (typeof window !== "undefined") {
    window.__YOUNEON_PI_AUTH_PROMISE__ = undefined;
    window.__YOUNEON_PI_INIT_PROMISE__ = undefined;
  }
}

/**
 * Initialize the official Pi SDK once. Concurrent callers share one Promise
 * so Pi.authenticate cannot run until Pi.init has fully settled.
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
 */
async function callWindowPiAuthenticate(): Promise<PiAuthResult> {
  if (!window.Pi) {
    throw new Error(PI_SDK_UNAVAILABLE);
  }

  const Pi = window.Pi;
  console.log("[Pi] authenticate start");

  try {
    const result = await Pi.authenticate({ scopes: ["username"] });
    console.log("[Pi] authenticate success");
    return result;
  } catch {
    try {
      const result = await Pi.authenticate(["username"], onIncompletePaymentFound);
      console.log("[Pi] authenticate success");
      return result;
    } catch (arrayFormError) {
      logError(arrayFormError);
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
  _onIncompletePaymentFound: (payment: PiPaymentDTO) => void = onIncompletePaymentFound,
  force = false
): Promise<PiAuthResult> {
  if (typeof window !== "undefined" && typeof window.__youneonPiAuth === "function") {
    return window.__youneonPiAuth(force);
  }

  await initPiSdk();

  if (!window.Pi) {
    logError(PI_SDK_UNAVAILABLE);
    throw new Error(PI_SDK_UNAVAILABLE);
  }

  const existing = window.__YOUNEON_PI_AUTH_PROMISE__;
  if (existing && !force) {
    try {
      return await existing;
    } catch (error) {
      window.__YOUNEON_PI_AUTH_PROMISE__ = undefined;
      logError(error);
    }
  }

  if (!authInFlight || force) {
    authInFlight = callWindowPiAuthenticate().finally(() => {
      authInFlight = null;
    });
    window.__YOUNEON_PI_AUTH_PROMISE__ = authInFlight;
  }

  return authInFlight;
}
