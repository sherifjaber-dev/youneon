"use client";

import { getNeonPackPaymentData, getSubscriptionPaymentData } from "@/lib/product-config";
import { getPiInitOptions } from "@/lib/system-config";
import { identityFromAuthResult, markPiAuthOk, readLiteSession } from "@/lib/pi-client-session";
import type {
  PiAuthResult,
  PiPaymentCallbacks,
  PiPaymentData,
  PiPaymentDTO,
  PiScope,
  PiSDK,
} from "@/lib/pi-types";

export const PI_SDK_UNAVAILABLE = "PI_SDK_UNAVAILABLE";
/** App Studio + U2A payments: username identity and payments scope together. */
export const PI_AUTH_SCOPES: PiScope[] = ["username", "payments"];
export const PI_SDK_WAIT_MS = 3000;
export const PI_INIT_TIMEOUT_MS = 3000;

let initPromise: Promise<void> | null = null;
let initSucceeded = false;

export function isPiSdkInitialized(): boolean {
  return initSucceeded && !!resolvePiSdk();
}

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
  if (typeof window === "undefined" || !resolvePiSdk() || window.__YOUNEON_PI_SDK_LOGGED__) return;
  window.__YOUNEON_PI_SDK_LOGGED__ = true;
  console.log("[Pi] SDK loaded");
}

function tryReadPi(frame: Window | null | undefined): PiSDK | undefined {
  if (!frame) return undefined;
  try {
    return frame.Pi;
  } catch (error) {
    console.log("[Pi] error: " + errorMessage(error));
    return undefined;
  }
}

/** Search this frame, parent, and top for Pi. Never replace window.Pi if it already exists. */
export function resolvePiSdk(): PiSDK | undefined {
  if (typeof window === "undefined") return undefined;
  const found = tryReadPi(window) || tryReadPi(window.parent) || tryReadPi(window.top);
  if (found && !window.Pi) {
    try {
      window.Pi = found;
    } catch (error) {
      console.log("[Pi] error: " + errorMessage(error));
    }
  }
  return window.Pi || found;
}

function setPiStatusLast(last: string, piPresent: boolean): void {
  if (typeof window === "undefined") return;
  window.__YOUNEON_PI_LAST__ = last;
  const text = "Pi SDK: " + (piPresent ? "yes" : "no") + "  ·  " + last;
  const nodes = document.querySelectorAll("[data-youneon-pi-status], #youneon-pi-status");
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].textContent = text;
  }
}

export function isPiAvailable(): boolean {
  return typeof resolvePiSdk() !== "undefined";
}

function isPinetHost(): boolean {
  try {
    return typeof location !== "undefined" && location.hostname.includes("pinet.com");
  } catch {
    return false;
  }
}

export async function waitForPiSdk(timeoutMs = PI_SDK_WAIT_MS): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }
  if (resolvePiSdk()) {
    logSdkLoaded();
    return true;
  }

  const started = Date.now();
  let requestedSdk = false;
  while (Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (resolvePiSdk()) {
      logSdkLoaded();
      return true;
    }
    if (!requestedSdk && Date.now() - started >= 800 && !isPinetHost()) {
      requestedSdk = true;
      loadOfficialSdkIfMissing();
    }
  }

  return !!resolvePiSdk();
}

/** Load sdk.minepi.com only if Pi is still missing. Never on pinet.com (hangs the iframe). */
function loadOfficialSdkIfMissing(): void {
  if (typeof document === "undefined") return;
  if (resolvePiSdk()) return;
  if (isPinetHost()) return;
  if (document.querySelector("script[data-youneon-pi-sdk]")) return;
  const s = document.createElement("script");
  s.async = true;
  s.setAttribute("data-youneon-pi-sdk", "1");
  let finished = false;
  const abort = (reason: string) => {
    if (finished) return;
    finished = true;
    try {
      s.onload = null;
      s.onerror = null;
    } catch {
      /* ignore */
    }
    try {
      s.src = "about:blank";
    } catch {
      /* ignore */
    }
    try {
      s.remove();
    } catch {
      /* ignore */
    }
    console.log("[Pi] error: " + reason);
  };
  s.onload = () => {
    finished = true;
  };
  s.onerror = () => {
    abort("failed to load sdk.minepi.com");
  };
  window.setTimeout(() => abort("SDK script timeout"), PI_SDK_WAIT_MS);
  s.src = "https://sdk.minepi.com/pi-sdk.js";
  (document.head || document.documentElement).appendChild(s);
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

  if (initSucceeded && resolvePiSdk()) return;

  if (!initPromise) {
    initPromise = (async () => {
      const available = await waitForPiSdk();
      const Pi = resolvePiSdk();
      if (!available || !Pi) {
        throw new Error(PI_SDK_UNAVAILABLE);
      }

      logSdkLoaded();
      console.log("[Pi] init start");
      try {
        await Promise.race([
          Promise.resolve(Pi.init(getPiInitOptions())),
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, PI_INIT_TIMEOUT_MS);
          }),
        ]);
      } catch (error) {
        logError(error);
      }
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
  const txid = payment?.transaction?.txid;
  const lite = readLiteSession();
  try {
    const res = await fetch("/api/pi/payment/incomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        paymentId,
        txid,
        payment,
        username: lite?.username || undefined,
        uid: lite?.uid || undefined,
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const message =
        (typeof data.error === "string" && data.error) ||
        `Incomplete payment failed (${res.status})`;
      logError(message);
    }
  } catch (error) {
    logError(error);
  }
}

function onIncompletePaymentFound(payment: PiPaymentDTO): Promise<void> {
  return handleIncompletePayment(payment);
}

/**
 * Call the real Pi.authenticate. Classic array+callback FIRST (App Studio wraps that),
 * then also try the object form. Never skip this call — Studio detects the invocation.
 */
function callWindowPiAuthenticate(
  scopes: PiScope[] = PI_AUTH_SCOPES,
  incomplete: (payment: PiPaymentDTO) => void | Promise<void> = onIncompletePaymentFound
): Promise<PiAuthResult> {
  const Pi = resolvePiSdk();
  if (!Pi || typeof Pi.authenticate !== "function") {
    setPiStatusLast("Last: window.Pi missing", false);
    logError("no window.Pi");
    throw new Error(PI_SDK_UNAVAILABLE);
  }

  console.log("[Pi] authenticate start");
  setPiStatusLast("Last: authenticate called", true);

  let result: Promise<PiAuthResult> | PiAuthResult | undefined;
  try {
    result = Pi.authenticate(scopes, incomplete);
  } catch (classicErr) {
    logError(classicErr);
    setPiStatusLast("Last: " + errorMessage(classicErr), true);
  }

  if (result == null) {
    try {
      result = Pi.authenticate({ scopes });
    } catch (objectErr) {
      logError(objectErr);
      throw objectErr;
    }
  }

  return Promise.resolve(result).then((authResult) => {
    console.log("[Pi] authenticate success");
    if (
      identityFromAuthResult(authResult) ||
      (authResult && (authResult as PiAuthResult).accessToken)
    ) {
      markPiAuthOk(authResult);
    }
    return authResult;
  });
}

/** Synchronous tap path — classic authenticate in the same user-gesture turn. */
export function tapPiAuthenticate(): void {
  try {
    void callWindowPiAuthenticate();
  } catch (error) {
    logError(error);
  }
  if (typeof window.__youneonPiAuth === "function") {
    try {
      window.__youneonPiAuth(true);
    } catch (error) {
      logError(error);
    }
  }
}

/**
 * Authenticate with Pi Browser. Always invokes window.Pi.authenticate —
 * required for Pi App Studio. Awaits Pi.init before authenticate.
 * Must only run from a user gesture (Sign in with Pi Network), never on load.
 */
export async function authenticatePi(
  scopes: PiScope[] = PI_AUTH_SCOPES,
  onIncomplete: (payment: PiPaymentDTO) => void | Promise<void> = onIncompletePaymentFound,
  _force = false
): Promise<PiAuthResult> {
  if (typeof window !== "undefined" && typeof window.__youneonPiAuth === "function") {
    try {
      const vanilla = window.__youneonPiAuth(true);
      if (vanilla && typeof (vanilla as Promise<PiAuthResult>).then === "function") {
        return Promise.resolve(vanilla).then((authResult) => {
          if (identityFromAuthResult(authResult) || (authResult && authResult.accessToken)) {
            markPiAuthOk(authResult);
          }
          return authResult as PiAuthResult;
        });
      }
    } catch (error) {
      logError(error);
    }
    return callWindowPiAuthenticate(scopes, onIncomplete);
  }

  const available = await waitForPiSdk();
  if (!available || !resolvePiSdk()) {
    logError(PI_SDK_UNAVAILABLE);
    setPiStatusLast("Last: window.Pi missing", false);
    throw new Error(PI_SDK_UNAVAILABLE);
  }

  try {
    await initPiSdk();
  } catch (error) {
    logError(error);
  }

  return callWindowPiAuthenticate(scopes, onIncomplete);
}

export type CreatePiPaymentResult = {
  paymentId: string;
  txid: string;
  payment?: PiPaymentDTO | null;
  premiumUntil?: string | null;
  alreadyGranted?: boolean;
  granted?: boolean;
  neonGranted?: number;
  skipped?: string | null;
};

async function postPaymentAction(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const lite = readLiteSession();
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      ...body,
      username: lite?.username || undefined,
      uid: lite?.uid || undefined,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

/**
 * U2A payment via window.Pi.createPayment. Always awaits Pi.init first.
 * Resolves after server-side complete; rejects on cancel or error.
 */
export async function createPiPayment(
  paymentData: PiPaymentData,
  extraCallbacks?: Partial<PiPaymentCallbacks>
): Promise<CreatePiPaymentResult> {
  await initPiSdk();
  const Pi = resolvePiSdk();
  if (!Pi || typeof Pi.createPayment !== "function") {
    throw new Error(PI_SDK_UNAVAILABLE);
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    Pi.createPayment(paymentData, {
      onReadyForServerApproval: async (paymentId) => {
        extraCallbacks?.onReadyForServerApproval?.(paymentId);
        try {
          const result = await postPaymentAction("/api/pi/payment/approve", { paymentId });
          if (!result.ok) {
            const error = new Error(
              (typeof result.data.error === "string" && result.data.error) ||
                `Payment approval failed (${result.status})`
            );
            logError(error);
            finish(() => reject(error));
            throw error;
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(errorMessage(error));
          logError(err);
          finish(() => reject(err));
          throw err;
        }
      },
      onReadyForServerCompletion: async (paymentId, txid) => {
        extraCallbacks?.onReadyForServerCompletion?.(paymentId, txid);
        try {
          const result = await postPaymentAction("/api/pi/payment/complete", {
            paymentId,
            txid,
          });
          if (!result.ok) {
            const error = new Error(
              (typeof result.data.error === "string" && result.data.error) ||
                `Payment completion failed (${result.status})`
            );
            logError(error);
            finish(() => reject(error));
            throw error;
          }
          finish(() =>
            resolve({
              paymentId,
              txid,
              payment: (result.data.payment as PiPaymentDTO) || null,
              premiumUntil:
                typeof result.data.premiumUntil === "string" ? result.data.premiumUntil : null,
              alreadyGranted: result.data.alreadyGranted === true,
              granted: result.data.granted === true,
              neonGranted:
                typeof result.data.neonGranted === "number" ? result.data.neonGranted : 0,
              skipped: typeof result.data.skipped === "string" ? result.data.skipped : null,
            })
          );
        } catch (error) {
          const err = error instanceof Error ? error : new Error(errorMessage(error));
          logError(err);
          finish(() => reject(err));
          throw err;
        }
      },
      onCancel: async (paymentId) => {
        extraCallbacks?.onCancel?.(paymentId);
        await postPaymentAction("/api/pi/payment/cancel", { paymentId }).catch(logError);
        finish(() => reject(new Error("Payment cancelled")));
      },
      onError: (error, payment) => {
        extraCallbacks?.onError?.(error, payment);
        logError(error);
        finish(() =>
          reject(error instanceof Error ? error : new Error(errorMessage(error)))
        );
      },
    });
  });
}

export async function subscribeWithPi(): Promise<CreatePiPaymentResult> {
  return createPiPayment(getSubscriptionPaymentData());
}

export async function purchaseNeonPackWithPi(packageId: string): Promise<CreatePiPaymentResult> {
  const paymentData = getNeonPackPaymentData(packageId);
  if (!paymentData) {
    throw new Error("Unknown Neon pack");
  }
  return createPiPayment(paymentData);
}
