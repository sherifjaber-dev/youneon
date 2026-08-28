"use client";

import { getNeonPackPaymentData, getSubscriptionPaymentData } from "@/lib/product-config";
import {
  emitPurchaseFeedback,
  purchaseErrorMessage,
  purchaseSummaryFromPayment,
} from "@/lib/purchase-feedback";
import { getPiInitOptions, resolvePiSandboxFromHost } from "@/lib/system-config";
import { identityFromAuthResult, markPiAuthOk, readLiteSession } from "@/lib/pi-client-session";
import { isPiAuthFailureStatus, wrongPiApiKeyMessage } from "@/lib/pi-network-copy";
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
/** Canonical server approve URL — must run immediately on onReadyForServerApproval. */
export const PI_APPROVE_API_PATH = "/api/pi/payment/approve";
/** Canonical server complete URL. Alias: /api/pi/complete */
export const PI_COMPLETE_API_PATH = "/api/pi/payment/complete";

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
    if (!requestedSdk && Date.now() - started >= 800) {
      requestedSdk = true;
      loadOfficialSdkIfMissing();
    }
  }

  return !!resolvePiSdk();
}

/** Load sdk.minepi.com only if Pi is still missing. Never overwrite an injected window.Pi. */
function loadOfficialSdkIfMissing(): void {
  if (typeof document === "undefined") return;
  if (resolvePiSdk()) return;
  if (document.querySelector("script[data-youneon-pi-sdk]")) return;
  const s = document.createElement("script");
  s.async = true;
  s.setAttribute("data-youneon-pi-sdk", "1");
  let nativePi: ReturnType<typeof resolvePiSdk> | undefined;
  try {
    nativePi = resolvePiSdk();
  } catch {
    nativePi = undefined;
  }
  const watch = window.setInterval(() => {
    try {
      if (window.Pi && !nativePi) nativePi = window.Pi;
    } catch {
      /* ignore */
    }
  }, 40);
  let finished = false;
  const abort = (reason: string) => {
    if (finished) return;
    if (resolvePiSdk()) {
      finished = true;
      window.clearInterval(watch);
      if (nativePi) {
        try {
          window.Pi = nativePi;
        } catch {
          /* ignore */
        }
      }
      return;
    }
    finished = true;
    window.clearInterval(watch);
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
    window.clearInterval(watch);
    if (nativePi) {
      try {
        window.Pi = nativePi;
      } catch (error) {
        logError(error);
      }
    }
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
 * Official Pi.init. sandbox is true only on Studio / local hosts.
 * Testnet vs Mainnet is the Developer Portal registration, not this flag.
 */
export async function initPi(): Promise<boolean> {
  if (typeof window === "undefined" || !window.Pi) {
    throw new Error("Pi SDK not loaded");
  }
  const isSandbox = resolvePiSandboxFromHost();
  console.log("[Pi] init start", { sandbox: isSandbox });
  await window.Pi.init({ version: "2.0", sandbox: isSandbox });
  console.log("[Pi] init success");
  return isSandbox;
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
      try {
        await Promise.race([
          initPi(),
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, PI_INIT_TIMEOUT_MS);
          }),
        ]);
      } catch (error) {
        logError(error);
      }
      initSucceeded = true;
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
  const paymentId = typeof payment?.identifier === "string" ? payment.identifier : "";
  const txid =
    typeof payment?.transaction?.txid === "string" ? payment.transaction.txid.trim() : "";
  const lite = readLiteSession();
  const path = txid ? PI_COMPLETE_API_PATH : "/api/pi/payment/incomplete";
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        paymentId,
        txid: txid || undefined,
        payment,
        username: lite?.username || undefined,
        uid: lite?.uid || undefined,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const piStatus = typeof data.piStatus === "number" ? data.piStatus : res.status;
      const message = isPiAuthFailureStatus(res.status) || isPiAuthFailureStatus(piStatus)
        ? wrongPiApiKeyMessage(getPiInitOptions().sandbox)
        : (typeof data.error === "string" && data.error) ||
          `Incomplete payment failed (${res.status})`;
      console.log("[Pi] incomplete response", {
        paymentId,
        txidLength: txid.length,
        status: res.status,
        piStatus,
        sandbox: getPiInitOptions().sandbox,
        apiKeyPresent: data.apiKeyPresent === true,
      });
      logError(message);
      emitPurchaseFeedback({ type: "error", message });
      return;
    }
    if (!txid || res.status !== 200) return;
    emitPurchaseFeedback({
      type: "success",
      summary: purchaseSummaryFromPayment(
        (data.payment as PiPaymentDTO) || payment
      ),
    });
  } catch (error) {
    logError(error);
    emitPurchaseFeedback({
      type: "error",
      message: purchaseErrorMessage(error),
    });
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
  piStatus?: number;
};

function readPaymentIdAndTxid(
  paymentIdOrPayment: unknown,
  txidMaybe: unknown
): { paymentId: string; txid: string } {
  let paymentId = "";
  let txid = "";
  if (typeof paymentIdOrPayment === "string") {
    paymentId = paymentIdOrPayment.trim();
  } else if (paymentIdOrPayment && typeof paymentIdOrPayment === "object") {
    const payment = paymentIdOrPayment as PiPaymentDTO;
    if (typeof payment.identifier === "string") paymentId = payment.identifier.trim();
    if (typeof payment.transaction?.txid === "string") txid = payment.transaction.txid.trim();
  }
  if (typeof txidMaybe === "string") {
    txid = txidMaybe.trim() || txid;
  } else if (txidMaybe && typeof txidMaybe === "object") {
    const rec = txidMaybe as { txid?: unknown };
    if (typeof rec.txid === "string") txid = rec.txid.trim() || txid;
  }
  return { paymentId, txid };
}

function sameOriginApiUrl(path: string): string {
  if (!path.startsWith("/") || typeof window === "undefined") return path;
  try {
    return `${window.location.origin}${path}`;
  } catch {
    return path;
  }
}

function postPaymentActionXhr(
  url: string,
  payload: string
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.withCredentials = true;
      xhr.timeout = 15000;
      xhr.onload = () => {
        let data: Record<string, unknown> = {};
        try {
          data = JSON.parse(xhr.responseText || "{}") as Record<string, unknown>;
        } catch {
          data = {};
        }
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          data,
        });
      };
      xhr.onerror = () => reject(new Error("Payment request network error"));
      xhr.ontimeout = () => reject(new Error("Payment request timed out"));
      xhr.send(payload);
    } catch (error) {
      reject(error instanceof Error ? error : new Error(errorMessage(error)));
    }
  });
}

async function postPaymentAction(
  path: string,
  body: Record<string, unknown>,
  options?: { urgent?: boolean }
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const lite = readLiteSession();
  const payload = JSON.stringify({
    ...body,
    username: lite?.username || undefined,
    uid: lite?.uid || undefined,
  });
  const url = sameOriginApiUrl(path);

  if (options?.urgent) {
    try {
      return await postPaymentActionXhr(url, payload);
    } catch (xhrError) {
      logError(xhrError);
    }
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    keepalive: options?.urgent === true,
    body: payload,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

function resultFromComplete(
  paymentId: string,
  txid: string,
  data: Record<string, unknown>
): CreatePiPaymentResult {
  return {
    paymentId,
    txid,
    payment: (data.payment as PiPaymentDTO) || null,
    premiumUntil: typeof data.premiumUntil === "string" ? data.premiumUntil : null,
    alreadyGranted: data.alreadyGranted === true,
    granted: data.granted === true,
    neonGranted: typeof data.neonGranted === "number" ? data.neonGranted : 0,
    skipped: typeof data.skipped === "string" ? data.skipped : null,
    piStatus: typeof data.piStatus === "number" ? data.piStatus : undefined,
  };
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
    emitPurchaseFeedback({ type: "error", message: PI_SDK_UNAVAILABLE });
    throw new Error(PI_SDK_UNAVAILABLE);
  }

  const summaryFrom = (payload?: CreatePiPaymentResult | null) =>
    purchaseSummaryFromPayment(payload?.payment) ||
    purchaseSummaryFromPayment(paymentData);

  return new Promise((resolve, reject) => {
    let settled = false;
    let lastPaymentId = "";
    let lastTxid = "";
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const completeOnServer = async (
      paymentId: string,
      txid: string
    ): Promise<CreatePiPaymentResult> => {
      const sandbox = getPiInitOptions().sandbox;
      console.log("[Pi] complete request", {
        paymentId,
        txidLength: txid.length,
        sandbox,
      });
      const result = await postPaymentAction(PI_COMPLETE_API_PATH, {
        paymentId,
        txid,
      });
      const piStatus =
        typeof result.data.piStatus === "number" ? result.data.piStatus : result.status;
      console.log("[Pi] complete response", {
        paymentId,
        txidLength: txid.length,
        status: result.status,
        piStatus,
        sandbox,
        apiKeyPresent: result.data.apiKeyPresent === true,
      });
      if (!result.ok || result.status !== 200) {
        const authFail =
          isPiAuthFailureStatus(result.status) || isPiAuthFailureStatus(piStatus);
        const error = new Error(
          authFail
            ? wrongPiApiKeyMessage(sandbox)
            : (typeof result.data.error === "string" && result.data.error) ||
              `Pi complete failed: ${result.status}`
        );
        emitPurchaseFeedback({ type: "error", message: error.message });
        throw error;
      }
      return resultFromComplete(paymentId, txid, result.data);
    };

    const retryCompleteIfPending = () => {
      if (settled || !lastPaymentId || !lastTxid) return;
      void completeOnServer(lastPaymentId, lastTxid)
        .then((payload) => {
          emitPurchaseFeedback({ type: "success", summary: summaryFrom(payload) });
          finishWith(() => resolve(payload));
        })
        .catch((error) => {
          logError(error);
        });
    };

    const onVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      retryCompleteIfPending();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", onVisible);
      window.addEventListener("pageshow", onVisible);
      document.addEventListener("visibilitychange", onVisible);
    }

    const cleanup = () => {
      if (typeof window === "undefined") return;
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };

    const finishWith = (fn: () => void) => {
      cleanup();
      finish(fn);
    };

    Pi.createPayment(paymentData, {
      onReadyForServerApproval: async (paymentId) => {
        const id =
          typeof paymentId === "string"
            ? paymentId.trim()
            : readPaymentIdAndTxid(paymentId, "").paymentId;
        if (id) lastPaymentId = id;
        const approveId = id || (typeof paymentId === "string" ? paymentId : "");
        const sandbox = getPiInitOptions().sandbox;
        // Always approve immediately — including Open App sandbox:false.
        // Wallet expires if this POST is skipped or delayed.
        console.log("[Pi] approve request", { paymentId: approveId, sandbox });
        try {
          const result = await postPaymentAction(
            PI_APPROVE_API_PATH,
            { paymentId: approveId || paymentId },
            { urgent: true }
          );
          const piStatus =
            typeof result.data.piStatus === "number" ? result.data.piStatus : result.status;
          console.log("[Pi] approve response", {
            paymentId: approveId || paymentId,
            status: result.status,
            piStatus,
            sandbox,
            apiKeyPresent: result.data.apiKeyPresent === true,
          });
          if (!result.ok) {
            const authFail =
              isPiAuthFailureStatus(result.status) || isPiAuthFailureStatus(piStatus);
            const error = new Error(
              authFail
                ? wrongPiApiKeyMessage(sandbox)
                : (typeof result.data.error === "string" && result.data.error) ||
                  `Payment approval failed (${result.status})`
            );
            logError(error);
            emitPurchaseFeedback({ type: "error", message: error.message });
            finishWith(() => reject(error));
            throw error;
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(errorMessage(error));
          logError(err);
          emitPurchaseFeedback({ type: "error", message: err.message });
          finishWith(() => reject(err));
          throw err;
        }
        try {
          extraCallbacks?.onReadyForServerApproval?.(paymentId);
        } catch (callbackError) {
          logError(callbackError);
        }
        emitPurchaseFeedback({ type: "waiting", message: "Waiting for Pi payment…" });
      },
      onReadyForServerCompletion: async (paymentIdArg, txidArg) => {
        extraCallbacks?.onReadyForServerCompletion?.(
          typeof paymentIdArg === "string" ? paymentIdArg : lastPaymentId,
          typeof txidArg === "string" ? txidArg : ""
        );
        const { paymentId, txid } = readPaymentIdAndTxid(paymentIdArg, txidArg);
        if (paymentId) lastPaymentId = paymentId;
        if (txid) lastTxid = txid;
        if (!paymentId || !txid) {
          console.warn("[Pi] complete waiting for txid", {
            paymentId: paymentId || lastPaymentId,
            txidLength: txid.length,
          });
          emitPurchaseFeedback({
            type: "waiting",
            message: "Waiting for Pi transaction id…",
          });
          return;
        }
        try {
          const payload = await completeOnServer(paymentId, txid);
          emitPurchaseFeedback({ type: "success", summary: summaryFrom(payload) });
          finishWith(() => resolve(payload));
        } catch (error) {
          const err = error instanceof Error ? error : new Error(errorMessage(error));
          logError(err);
          finishWith(() => reject(err));
        }
      },
      onCancel: async (paymentId) => {
        extraCallbacks?.onCancel?.(paymentId);
        await postPaymentAction("/api/pi/payment/cancel", { paymentId }).catch(logError);
        emitPurchaseFeedback({ type: "error", message: "Payment cancelled" });
        finishWith(() => reject(new Error("Payment cancelled")));
      },
      onError: (error, payment) => {
        extraCallbacks?.onError?.(error, payment);
        logError(error);
        const err = error instanceof Error ? error : new Error(errorMessage(error));
        emitPurchaseFeedback({ type: "error", message: purchaseErrorMessage(err) });
        finishWith(() => reject(err));
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
    emitPurchaseFeedback({ type: "error", message: "Unknown Neon pack" });
    throw new Error("Unknown Neon pack");
  }
  return createPiPayment(paymentData);
}
