import { isPiAuthFailureStatus, wrongPiApiKeyMessage } from "@/lib/pi-network-copy";
import type { PiPaymentDTO } from "@/lib/pi-types";
import { resolvePiSandboxFromHost } from "@/lib/system-config";

if (typeof window !== "undefined") {
  throw new Error("pi-platform is server-only");
}

/** Official Platform API. sandbox.minepi.com is the desktop sandbox UI, not this API. */
export const PI_PLATFORM_BASE_DEFAULT = "https://api.minepi.com/v2";

export const MISSING_PI_API_KEY =
  "Pi Server API Key is missing. Set PI_API_KEY on Vercel to the Develop Testnet / Sandbox Server API Key for this Testnet app (Connected App Wallet). Do not use old App Studio keys or a Production Mainnet key. Until that is set, purchases cannot be approved or completed.";

export const MISSING_PI_API_KEY_PRODUCTION =
  "Pi Server API Key is missing for Open App. Set PI_API_KEY_PRODUCTION on Vercel to the Develop Testnet Server API Key of the SAME Pi app that Open App uses (not Studio-only, not Stripe, not a sandbox-only key).";

export type PiKeySource =
  | "PI_API_KEY_PRODUCTION"
  | "PI_API_KEY"
  | "PI_NETWORK_API_KEY"
  | "PI_PLATFORM_API_KEY"
  | "";

export type PiAuthScheme = "Key" | "Bearer";

export class PiPlatformError extends Error {
  status: number;
  constructor(message: string, status = 503) {
    super(message);
    this.name = "PiPlatformError";
    this.status = status;
  }
}

function stripApiKey(raw: string): string {
  return raw.replace(/^(Key|Bearer)\s+/i, "").trim();
}

function envKey(name: string): string {
  return stripApiKey(process.env[name] || "");
}

/**
 * sandbox:true (Studio / localhost / sandbox.minepi.com) → PI_API_KEY (Develop).
 * sandbox:false (Open App / vercel.app / pinet.com) → PI_API_KEY_PRODUCTION,
 * falling back to PI_API_KEY if production is unset.
 */
export function getPiServerApiKeyInfo(sandbox: boolean): { key: string; source: PiKeySource } {
  if (!sandbox) {
    const production = envKey("PI_API_KEY_PRODUCTION");
    if (production) return { key: production, source: "PI_API_KEY_PRODUCTION" };
  }
  const primary = envKey("PI_API_KEY");
  if (primary) return { key: primary, source: "PI_API_KEY" };
  const network = envKey("PI_NETWORK_API_KEY");
  if (network) return { key: network, source: "PI_NETWORK_API_KEY" };
  const platform = envKey("PI_PLATFORM_API_KEY");
  if (platform) return { key: platform, source: "PI_PLATFORM_API_KEY" };
  return { key: "", source: "" };
}

export function getPiServerApiKey(sandbox = false): string {
  return getPiServerApiKeyInfo(sandbox).key;
}

export function hasPiServerApiKey(sandbox = false): boolean {
  return getPiServerApiKeyInfo(sandbox).key.length > 0;
}

export function missingPiApiKeyMessage(sandbox: boolean): string {
  return sandbox ? MISSING_PI_API_KEY : MISSING_PI_API_KEY_PRODUCTION;
}

/** Hostname-only helper. Key selection uses parseClientSandbox(), not this. */
export function isPiSandbox(): boolean {
  return false;
}

/**
 * Platform API base for approve/complete.
 * Always api.minepi.com/v2 — never sandbox.minepi.com (that is the desktop UI).
 * Client Pi.init sandbox (Studio vs Open App) must not change this host.
 * Override with PI_PLATFORM_API_BASE only if Pi documents a different base.
 */
export function getPiPlatformBase(): string {
  const override = (process.env.PI_PLATFORM_API_BASE || "").trim().replace(/\/$/, "");
  if (override) return override;
  return PI_PLATFORM_BASE_DEFAULT;
}

/** @deprecated Use getPiPlatformBase() — kept so existing imports keep working. */
export const PI_PLATFORM_BASE = PI_PLATFORM_BASE_DEFAULT;

export type PiPaymentDebugMeta = {
  sandbox: boolean;
  apiKeyPresent: boolean;
  keyPrefix: string;
  keyLength: number;
  keySource: PiKeySource;
  piUrl: string;
  looksLikeStripe: boolean;
};

function looksLikeStripeKey(key: string): boolean {
  return key.startsWith("sk_live") || key.startsWith("sk_test");
}

/** Safe-to-log flags only — never the full API key. */
export function piPaymentDebugMeta(sandbox = false): PiPaymentDebugMeta {
  const info = getPiServerApiKeyInfo(sandbox);
  return {
    sandbox,
    apiKeyPresent: info.key.length > 0,
    keyPrefix: info.key.slice(0, 6),
    keyLength: info.key.length,
    keySource: info.source,
    piUrl: getPiPlatformBase(),
    looksLikeStripe: looksLikeStripeKey(info.key),
  };
}

/**
 * Client sandbox from JSON `{ sandbox }`, `X-Pi-Sandbox` header, or Origin/Referer host.
 * Matches Pi.init: true on sandbox.minepi.com / localhost; false on vercel.app / pinet.com.
 */
export function parseClientSandbox(body: unknown, request?: Request): boolean {
  if (body && typeof body === "object") {
    const rec = body as Record<string, unknown>;
    if (rec.sandbox === true || rec.sandbox === "true" || rec.sandbox === 1) return true;
    if (rec.sandbox === false || rec.sandbox === "false" || rec.sandbox === 0) return false;
  }
  if (request) {
    const header = (request.headers.get("x-pi-sandbox") || "").trim().toLowerCase();
    if (header === "true" || header === "1") return true;
    if (header === "false" || header === "0") return false;
    const origin = request.headers.get("origin") || request.headers.get("referer") || "";
    if (origin) {
      try {
        return resolvePiSandboxFromHost(new URL(origin).hostname);
      } catch {
        /* ignore */
      }
    }
  }
  return false;
}

function unwrapId(value: unknown, keys: string[]): unknown {
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    for (const key of keys) {
      if (typeof rec[key] === "string") return rec[key];
    }
  }
  return value;
}

export function parsePaymentId(value: unknown): string {
  const raw = unwrapId(value, ["identifier", "paymentId", "payment_id"]);
  const id = typeof raw === "string" ? raw.trim() : "";
  if (!id || id === "undefined" || id === "null" || id.length > 256 || !/^[\w-]+$/.test(id)) {
    return "";
  }
  return id;
}

export function parseTxid(value: unknown): string {
  const raw = unwrapId(value, ["txid", "txId", "tx_id"]);
  const id = typeof raw === "string" ? raw.trim() : "";
  if (!id || id === "undefined" || id === "null" || id.length > 256) return "";
  return id;
}

function safePiResponseBody(data: unknown): unknown {
  if (data == null) return null;
  if (typeof data === "string") {
    return data.length > 800 ? `${data.slice(0, 800)}…` : data;
  }
  if (typeof data !== "object") return data;
  try {
    const json = JSON.stringify(data);
    if (json.length > 1200) return { truncated: true, preview: json.slice(0, 1200) };
    return JSON.parse(json) as unknown;
  } catch {
    return { unserializable: true };
  }
}

/** Log payment actions without ever printing the full API key. */
export function logPiPaymentAction(
  action: "approve" | "complete" | "cancel" | "get",
  info: {
    paymentId: string;
    txidLength?: number;
    status: number;
    sandbox: boolean;
    authScheme?: PiAuthScheme;
    piUrl?: string;
    piBody?: unknown;
  }
): void {
  const debug = piPaymentDebugMeta(info.sandbox);
  console.info("[Pi]", action, {
    paymentId: info.paymentId,
    txidLength: info.txidLength ?? 0,
    status: info.status,
    authScheme: info.authScheme || "Key",
    piUrl: info.piUrl || debug.piUrl,
    piBody: safePiResponseBody(info.piBody),
    ...debug,
  });
}

export function isAlreadyCompletedPayload(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const rec = data as Record<string, unknown>;
  const err = typeof rec.error === "string" ? rec.error : "";
  if (/already[_ ]?completed/i.test(err)) return true;
  const status = rec.status as { developer_completed?: boolean } | undefined;
  if (status?.developer_completed) return true;
  const nested = rec.payment;
  if (nested && typeof nested === "object") {
    const paymentStatus = (nested as { status?: { developer_completed?: boolean } }).status;
    if (paymentStatus?.developer_completed) return true;
  }
  return false;
}

export function isAlreadyApprovedPayload(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const rec = data as Record<string, unknown>;
  const err = typeof rec.error === "string" ? rec.error : "";
  if (/already[_ ]?approved/i.test(err)) return true;
  const status = rec.status as { developer_approved?: boolean } | undefined;
  if (status?.developer_approved) return true;
  const nested = rec.payment;
  if (nested && typeof nested === "object") {
    const paymentStatus = (nested as { status?: { developer_approved?: boolean } }).status;
    if (paymentStatus?.developer_approved) return true;
  }
  return false;
}

export function describePiApiFailure(
  action: string,
  status: number,
  data: unknown,
  sandbox = false
): string {
  const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const piError = typeof body.error === "string" ? body.error : "";
  const piMessage = typeof body.error_message === "string" ? body.error_message : "";
  const detail = [piError, piMessage].filter(Boolean).join(" — ");
  if (isPiAuthFailureStatus(status)) {
    const hint = wrongPiApiKeyMessage(sandbox);
    return detail ? `${hint} ${detail}` : hint;
  }
  if (status === 404) {
    const hint = sandbox
      ? "Payment not found for PI_API_KEY (Develop / Studio)."
      : "Payment not found for this API key. Open App needs PI_API_KEY_PRODUCTION set to the Server API Key of the SAME Pi app that created the payment.";
    return `Pi ${action} failed (404): ${hint}${detail ? ` ${detail}` : ""}`;
  }
  return `Pi ${action} failed (${status})${detail ? `: ${detail}` : ""}`;
}

type PiApiOptions = {
  method?: string;
  body?: unknown;
  sandbox?: boolean;
  paymentId?: string;
  authScheme?: PiAuthScheme;
};

export type PiApiResult<T = unknown> = { ok: boolean; status: number; data: T | null; url: string; authScheme: PiAuthScheme };

export async function piApi<T = unknown>(
  path: string,
  options: PiApiOptions = {}
): Promise<PiApiResult<T>> {
  const sandbox = options.sandbox === true;
  const info = getPiServerApiKeyInfo(sandbox);
  const apiKey = info.key;
  if (!apiKey) {
    throw new PiPlatformError(missingPiApiKeyMessage(sandbox), 503);
  }

  if (!sandbox && info.source !== "PI_API_KEY_PRODUCTION") {
    console.warn("[Pi] PI_API_KEY_PRODUCTION missing; using", info.source, "for Open App. A 404 means this key is not the Open App's Server API Key.");
  }

  const method = options.method || "GET";
  const base = getPiPlatformBase();
  const url = path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const authScheme: PiAuthScheme = options.authScheme || "Key";

  const headers: Record<string, string> = {
    Authorization: `${authScheme} ${apiKey}`,
    Accept: "application/json",
  };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const data = (await res.json().catch(() => null)) as T | null;
  const debug = piPaymentDebugMeta(sandbox);
  console.info("[Pi] platform HTTP", {
    method,
    url,
    status: res.status,
    paymentId: options.paymentId,
    authScheme,
    piBody: safePiResponseBody(data),
    ...debug,
  });
  return { ok: res.ok, status: res.status, data, url, authScheme };
}

export async function getPiPayment(paymentId: string, sandbox = false) {
  return piApi<PiPaymentDTO>(`/payments/${paymentId}`, {
    method: "GET",
    sandbox,
    paymentId,
  });
}

export async function approvePiPayment(paymentId: string, sandbox = false) {
  const path = `/payments/${paymentId}/approve`;
  try {
    const keyResult = await piApi<PiPaymentDTO>(path, {
      method: "POST",
      body: {},
      sandbox,
      paymentId,
      authScheme: "Key",
    });
    logPiPaymentAction("approve", {
      paymentId,
      status: keyResult.status,
      sandbox,
      authScheme: "Key",
      piUrl: keyResult.url,
      piBody: keyResult.data,
    });

    if (keyResult.status !== 404) return keyResult;

    const bearerResult = await piApi<PiPaymentDTO>(path, {
      method: "POST",
      body: {},
      sandbox,
      paymentId,
      authScheme: "Bearer",
    });
    logPiPaymentAction("approve", {
      paymentId,
      status: bearerResult.status,
      sandbox,
      authScheme: "Bearer",
      piUrl: bearerResult.url,
      piBody: bearerResult.data,
    });
    console.info("[Pi] approve Key vs Bearer", {
      paymentId,
      keyStatus: keyResult.status,
      keyBody: safePiResponseBody(keyResult.data),
      bearerStatus: bearerResult.status,
      bearerBody: safePiResponseBody(bearerResult.data),
      ...piPaymentDebugMeta(sandbox),
    });
    if (bearerResult.ok || bearerResult.status !== 404) return bearerResult;
    return keyResult;
  } catch (error) {
    const status = error instanceof PiPlatformError ? error.status : 0;
    logPiPaymentAction("approve", { paymentId, status, sandbox, authScheme: "Key" });
    throw error;
  }
}

export async function completePiPayment(paymentId: string, txid: string, sandbox = false) {
  const result = await piApi<PiPaymentDTO>(`/payments/${paymentId}/complete`, {
    method: "POST",
    body: { txid },
    sandbox,
    paymentId,
  });
  logPiPaymentAction("complete", {
    paymentId,
    txidLength: txid.length,
    status: result.status,
    sandbox,
    authScheme: result.authScheme,
    piUrl: result.url,
    piBody: result.data,
  });
  return { ...result, ok: result.status === 200 };
}

export async function cancelPiPayment(paymentId: string, sandbox = false) {
  const result = await piApi<PiPaymentDTO>(`/payments/${paymentId}/cancel`, {
    method: "POST",
    body: {},
    sandbox,
    paymentId,
  });
  logPiPaymentAction("cancel", {
    paymentId,
    status: result.status,
    sandbox,
    authScheme: result.authScheme,
    piUrl: result.url,
    piBody: result.data,
  });
  return result;
}
