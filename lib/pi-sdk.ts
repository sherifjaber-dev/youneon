"use client";

import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import type { PiAuthResult, PiPaymentDTO, PiScope } from "@/lib/pi-types";

export const PI_SDK_UNAVAILABLE = "PI_SDK_UNAVAILABLE";
export const PI_AUTH_SCOPES: PiScope[] = ["username", "payments"];

let initPromise: Promise<void> | null = null;
let initSucceeded = false;
let authInFlight: Promise<PiAuthResult> | null = null;

export function isPiAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.Pi !== "undefined";
}

export async function waitForPiSdk(timeoutMs = 1500): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Pi) return true;

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    if (window.Pi) return true;
  }
  return !!window.Pi;
}

export function resetPiSdkInit(): void {
  if (!initSucceeded) {
    initPromise = null;
  }
}

/**
 * Initialize the official Pi SDK once. Concurrent callers share one Promise
 * so Pi.authenticate cannot run until Pi.init has fully settled.
 */
export async function initPiSdk(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Pi SDK can only be initialized in the browser");
  }

  if (!initPromise) {
    initPromise = (async () => {
      const available = await waitForPiSdk();
      if (!available || !window.Pi) {
        throw new Error(PI_SDK_UNAVAILABLE);
      }

      // Pi.init returns a Promise — await it fully (including thenables) before authenticate.
      await Promise.resolve(
        window.Pi.init({
          version: "2.0",
          sandbox: PI_NETWORK_CONFIG.SANDBOX,
        })
      );
      initSucceeded = true;
    })().catch((error) => {
      initPromise = null;
      initSucceeded = false;
      throw error;
    });
  }

  await initPromise;
}

export async function handleIncompletePayment(payment: PiPaymentDTO): Promise<void> {
  const paymentId = payment?.identifier;
  console.warn("[Pi] Incomplete payment found:", paymentId);
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
    console.warn("[Pi] Failed to notify incomplete payment (auth can continue):", error);
  }
}

/**
 * Authenticate with Pi Browser. Always awaits shared initPiSdk() first.
 * Caller must send only accessToken to the backend — never trust SDK uid/username.
 */
export async function authenticatePi(
  scopes: PiScope[] = PI_AUTH_SCOPES,
  onIncompletePaymentFound: (payment: PiPaymentDTO) => void = (payment) => {
    void handleIncompletePayment(payment);
  }
): Promise<PiAuthResult> {
  await initPiSdk();

  if (!window.Pi) {
    throw new Error(PI_SDK_UNAVAILABLE);
  }

  if (!authInFlight) {
    authInFlight = window.Pi.authenticate(scopes, onIncompletePaymentFound).finally(() => {
      authInFlight = null;
    });
  }

  return authInFlight;
}
