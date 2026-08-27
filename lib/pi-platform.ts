import type { PiPaymentDTO } from "@/lib/pi-types";

if (typeof window !== "undefined") {
  throw new Error("pi-platform is server-only");
}

/** Official Platform API. sandbox.minepi.com is the desktop sandbox UI, not this API. */
export const PI_PLATFORM_BASE_DEFAULT = "https://api.minepi.com/v2";

export const MISSING_PI_API_KEY =
  "Pi Server API Key is missing. Set PI_API_KEY on Vercel to the Sandbox Server API Key from Pi Develop → your app → API Keys. Until that is set, purchases cannot be approved or completed.";

export class PiPlatformError extends Error {
  status: number;
  constructor(message: string, status = 503) {
    super(message);
    this.name = "PiPlatformError";
    this.status = status;
  }
}

export function isPiSandbox(): boolean {
  return process.env.NEXT_PUBLIC_PI_SANDBOX !== "false";
}

/**
 * Platform API base for approve/complete.
 * Sandbox vs production is the Server API Key (Developer Portal), not a different host.
 * Override with PI_PLATFORM_API_BASE only if Pi documents a different base.
 */
export function getPiPlatformBase(): string {
  const override = (process.env.PI_PLATFORM_API_BASE || "").trim().replace(/\/$/, "");
  if (override) return override;
  return PI_PLATFORM_BASE_DEFAULT;
}

/** @deprecated Use getPiPlatformBase() — kept so existing imports keep working. */
export const PI_PLATFORM_BASE = PI_PLATFORM_BASE_DEFAULT;

export function getPiServerApiKey(): string {
  const raw =
    process.env.PI_API_KEY ||
    process.env.PI_NETWORK_API_KEY ||
    process.env.PI_PLATFORM_API_KEY ||
    "";
  return raw.replace(/^Key\s+/i, "").trim();
}

export function hasPiServerApiKey(): boolean {
  return getPiServerApiKey().length > 0;
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

/** Log payment actions without ever printing the API key. */
export function logPiPaymentAction(
  action: "approve" | "complete" | "cancel" | "get",
  info: { paymentId: string; txidLength?: number; status: number }
): void {
  const keyLen = getPiServerApiKey().length;
  console.info("[Pi]", action, {
    paymentId: info.paymentId,
    txidLength: info.txidLength ?? 0,
    status: info.status,
    apiKeyPresent: keyLen > 0,
    apiKeyLength: keyLen,
    host: getPiPlatformBase(),
    sandbox: isPiSandbox(),
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

export function describePiApiFailure(action: string, status: number, data: unknown): string {
  const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const piError = typeof body.error === "string" ? body.error : "";
  const piMessage = typeof body.error_message === "string" ? body.error_message : "";
  const detail = [piError, piMessage].filter(Boolean).join(" — ");
  if (status === 401 || status === 403) {
    return (
      `Pi ${action} failed (${status}). Use the Sandbox Server API Key from Pi Develop for this Testnet app, then set PI_API_KEY on Vercel.` +
      (detail ? ` ${detail}` : "")
    );
  }
  return `Pi ${action} failed (${status})${detail ? `: ${detail}` : ""}`;
}

type PiApiOptions = {
  method?: string;
  body?: unknown;
};

export async function piApi<T = unknown>(
  path: string,
  options: PiApiOptions = {}
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const apiKey = getPiServerApiKey();
  if (!apiKey) {
    throw new PiPlatformError(MISSING_PI_API_KEY, 503);
  }

  const method = options.method || "GET";
  const base = getPiPlatformBase();
  const url = path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Authorization: `Key ${apiKey}`,
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
  return { ok: res.ok, status: res.status, data };
}

export async function getPiPayment(paymentId: string) {
  return piApi<PiPaymentDTO>(`/payments/${paymentId}`, { method: "GET" });
}

export async function approvePiPayment(paymentId: string) {
  const result = await piApi<PiPaymentDTO>(`/payments/${paymentId}/approve`, {
    method: "POST",
    body: {},
  });
  logPiPaymentAction("approve", { paymentId, status: result.status });
  return result;
}

export async function completePiPayment(paymentId: string, txid: string) {
  const result = await piApi<PiPaymentDTO>(`/payments/${paymentId}/complete`, {
    method: "POST",
    body: { txid },
  });
  logPiPaymentAction("complete", {
    paymentId,
    txidLength: txid.length,
    status: result.status,
  });
  return { ...result, ok: result.status === 200 };
}

export async function cancelPiPayment(paymentId: string) {
  const result = await piApi<PiPaymentDTO>(`/payments/${paymentId}/cancel`, {
    method: "POST",
    body: {},
  });
  logPiPaymentAction("cancel", { paymentId, status: result.status });
  return result;
}
