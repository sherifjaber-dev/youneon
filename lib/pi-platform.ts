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

/** Trim Vercel env noise (newlines, wrapping quotes, BOM) that otherwise 401 Key auth. */
function envKey(name: string): string {
  let raw = String(process.env[name] ?? "").replace(/^\uFEFF/, "").trim();
  if (
    (raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) ||
    (raw.startsWith("'") && raw.endsWith("'") && raw.length >= 2)
  ) {
    raw = raw.slice(1, -1).trim();
  }
  raw = raw.replace(/[\r\n]+/g, "").trim();
  return stripApiKey(raw);
}

/**
 * Default key for a request. Both env vars are Testnet Server API Keys.
 * Approve/complete try PI_API_KEY_PRODUCTION first, then PI_API_KEY on 404.
 */
export function getPiServerApiKeyInfo(_sandbox: boolean): { key: string; source: PiKeySource } {
  const attempts = getPiApproveKeyAttempts();
  if (attempts.length > 0) return attempts[0];
  return { key: "", source: "" };
}

/**
 * Unique keys to try for approve/complete. PRODUCTION first (Open App listing),
 * then trimmed PI_API_KEY (Studio / Develop). Same value is not tried twice.
 */
export function getPiApproveKeyAttempts(): { key: string; source: PiKeySource }[] {
  const production = envKey("PI_API_KEY_PRODUCTION");
  const primary = envKey("PI_API_KEY");
  const seen = new Set<string>();
  const attempts: { key: string; source: PiKeySource }[] = [];
  const add = (key: string, source: PiKeySource) => {
    if (!key || seen.has(key)) return;
    seen.add(key);
    attempts.push({ key, source });
  };
  add(production, "PI_API_KEY_PRODUCTION");
  add(primary, "PI_API_KEY");
  if (attempts.length === 0) {
    add(envKey("PI_NETWORK_API_KEY"), "PI_NETWORK_API_KEY");
    add(envKey("PI_PLATFORM_API_KEY"), "PI_PLATFORM_API_KEY");
  }
  return attempts;
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
 * Client Pi.init sandbox (Testnet vs Mainnet) must not change this host.
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
  hasProductionKey: boolean;
  keyPrefix: string;
  keyLength: number;
  keySource: PiKeySource;
  piUrl: string;
  looksLikeStripe: boolean;
  keyStartsWithSkLive: boolean;
};

function looksLikeStripeKey(key: string): boolean {
  return key.startsWith("sk_live") || key.startsWith("sk_test");
}

function clipPiBodyText(text: string): string {
  return text.length > 800 ? `${text.slice(0, 800)}…` : text;
}

/** Safe-to-log flags only — never the full API key. */
export function piPaymentDebugMeta(sandbox = false): PiPaymentDebugMeta {
  const info = getPiServerApiKeyInfo(sandbox);
  const production = envKey("PI_API_KEY_PRODUCTION");
  return {
    sandbox,
    apiKeyPresent: info.key.length > 0,
    hasProductionKey: production.length > 0,
    keyPrefix: info.key.slice(0, 6),
    keyLength: info.key.length,
    keySource: info.source,
    piUrl: getPiPlatformBase(),
    looksLikeStripe: looksLikeStripeKey(info.key),
    keyStartsWithSkLive: info.key.startsWith("sk_live"),
  };
}

/**
 * Client sandbox from JSON `{ sandbox }`, `X-Pi-Sandbox` header, or Origin/Referer host.
 * Testnet-only app: default/force true unless NEXT_PUBLIC_PI_SANDBOX=false (Mainnet).
 * Ignore client sandbox:false so a cached Open App cannot select Mainnet keys.
 */
export function parseClientSandbox(body: unknown, request?: Request): boolean {
  const forced = resolvePiSandboxFromHost();
  if (!forced) return false;

  let client: boolean | undefined;
  if (body && typeof body === "object") {
    const rec = body as Record<string, unknown>;
    if (rec.sandbox === true || rec.sandbox === "true" || rec.sandbox === 1) client = true;
    else if (rec.sandbox === false || rec.sandbox === "false" || rec.sandbox === 0) client = false;
  }
  if (client === undefined && request) {
    const header = (request.headers.get("x-pi-sandbox") || "").trim().toLowerCase();
    if (header === "true" || header === "1") client = true;
    else if (header === "false" || header === "0") client = false;
    else {
      const origin = request.headers.get("origin") || request.headers.get("referer") || "";
      if (origin) {
        try {
          client = resolvePiSandboxFromHost(new URL(origin).hostname);
        } catch {
          /* ignore */
        }
      }
    }
  }
  if (client === false) {
    console.info("[Pi] client sent sandbox:false; forcing true for Testnet app");
  }
  return true;
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
    headerMode?: PiAuthScheme;
    piUrl?: string;
    piBody?: unknown;
    piBodyText?: string;
    keySource?: PiKeySource;
  }
): void {
  const debug = piPaymentDebugMeta(info.sandbox);
  const headerMode = info.headerMode || info.authScheme || "Key";
  console.info("[Pi]", action, {
    paymentId: info.paymentId,
    txidLength: info.txidLength ?? 0,
    status: info.status,
    headerMode,
    authScheme: headerMode,
    piUrl: info.piUrl || debug.piUrl,
    piBody: safePiResponseBody(info.piBody),
    piBodyText: info.piBodyText,
    hasProductionKey: debug.hasProductionKey,
    keyLength: debug.keyLength,
    keyStartsWithSkLive: debug.keyStartsWithSkLive,
    sandbox: debug.sandbox,
    keySource: info.keySource || debug.keySource,
    apiKeyPresent: debug.apiKeyPresent,
    piUrlBase: debug.piUrl,
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
    const hint =
      "Payment not found after trying PI_API_KEY_PRODUCTION and PI_API_KEY. The paymentId is not visible to this Testnet app (wrong app, or Pi.init sandbox:false created a Mainnet payment).";
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
  apiKey?: string;
  keySource?: PiKeySource;
};

export type PiApiResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | null;
  url: string;
  authScheme: PiAuthScheme;
  headerMode: PiAuthScheme;
  bodyText: string;
  keySource: PiKeySource;
};

function logPiAuthAttempt(
  action: string,
  sandbox: boolean,
  headerMode: PiAuthScheme,
  status: number,
  bodyText: string,
  extra?: Record<string, unknown>
): void {
  const debug = piPaymentDebugMeta(sandbox);
  console.info("[Pi]", action, {
    hasProductionKey: debug.hasProductionKey,
    keyLength: debug.keyLength,
    keyStartsWithSkLive: debug.keyStartsWithSkLive,
    headerMode,
    status,
    piBodyText: clipPiBodyText(bodyText),
    sandbox: debug.sandbox,
    keySource: debug.keySource,
    ...extra,
  });
}

export async function piApi<T = unknown>(
  path: string,
  options: PiApiOptions = {}
): Promise<PiApiResult<T>> {
  const sandbox = options.sandbox === true;
  const info = options.apiKey
    ? { key: options.apiKey.trim(), source: options.keySource || getPiServerApiKeyInfo(sandbox).source }
    : getPiServerApiKeyInfo(sandbox);
  const apiKey = info.key.trim();
  if (!apiKey) {
    throw new PiPlatformError(missingPiApiKeyMessage(sandbox), 503);
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

  const bodyText = await res.text();
  let data: T | null = null;
  if (bodyText) {
    try {
      data = JSON.parse(bodyText) as T;
    } catch {
      data = null;
    }
  }
  const debug = piPaymentDebugMeta(sandbox);
  console.info("[Pi] platform HTTP", {
    method,
    url,
    status: res.status,
    paymentId: options.paymentId,
    headerMode: authScheme,
    authScheme,
    hasProductionKey: debug.hasProductionKey,
    keyLength: apiKey.length,
    keyStartsWithSkLive: apiKey.startsWith("sk_live"),
    piBodyText: clipPiBodyText(bodyText),
    piBody: safePiResponseBody(data),
    sandbox: debug.sandbox,
    keySource: info.source,
    apiKeyPresent: apiKey.length > 0,
  });
  return {
    ok: res.ok,
    status: res.status,
    data,
    url,
    authScheme,
    headerMode: authScheme,
    bodyText,
    keySource: info.source,
  };
}

/** Try Key, then Bearer for one API key. Stop at the first response that is not 401. */
async function piApiKeyThenBearer<T = unknown>(
  path: string,
  options: Omit<PiApiOptions, "authScheme"> = {}
): Promise<PiApiResult<T>> {
  const schemes: PiAuthScheme[] = ["Key", "Bearer"];
  let last: PiApiResult<T> | null = null;
  for (const headerMode of schemes) {
    const result = await piApi<T>(path, { ...options, authScheme: headerMode });
    last = result;
    if (result.status !== 401) return result;
  }
  return last!;
}

/**
 * Try PI_API_KEY_PRODUCTION first. On 404, retry once with trimmed PI_API_KEY.
 * Stop at the first 200. 401 still tries Bearer on the same key only.
 */
async function piApiWithKey404Fallback<T = unknown>(
  path: string,
  options: Omit<PiApiOptions, "authScheme" | "apiKey" | "keySource"> = {}
): Promise<PiApiResult<T>> {
  const sandbox = options.sandbox === true;
  const attempts = getPiApproveKeyAttempts();
  if (attempts.length === 0) {
    throw new PiPlatformError(missingPiApiKeyMessage(sandbox), 503);
  }

  let last: PiApiResult<T> | null = null;
  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    last = await piApiKeyThenBearer<T>(path, {
      ...options,
      apiKey: attempt.key,
      keySource: attempt.source,
    });
    if (last.status === 200 || last.ok) {
      console.info("[Pi] platform succeeded", {
        keySource: attempt.source,
        status: last.status,
        path,
        paymentId: options.paymentId,
      });
      return last;
    }
    if (last.status === 404 && i + 1 < attempts.length) {
      console.info("[Pi] 404 with", attempt.source, "- retrying once with", attempts[i + 1].source, {
        paymentId: options.paymentId,
        path,
      });
      continue;
    }
    return last;
  }
  return last!;
}

export async function getPiPayment(paymentId: string, sandbox = false) {
  return piApiWithKey404Fallback<PiPaymentDTO>(`/payments/${paymentId}`, {
    method: "GET",
    sandbox,
    paymentId,
  });
}

export async function approvePiPayment(paymentId: string, sandbox = false) {
  const path = `/payments/${paymentId}/approve`;
  try {
    const result = await piApiWithKey404Fallback<PiPaymentDTO>(path, {
      method: "POST",
      body: {},
      sandbox,
      paymentId,
    });
    logPiAuthAttempt("approve", sandbox, result.headerMode, result.status, result.bodyText, {
      paymentId,
      piUrl: result.url,
      keySource: result.keySource,
    });
    logPiPaymentAction("approve", {
      paymentId,
      status: result.status,
      sandbox,
      authScheme: result.authScheme,
      headerMode: result.headerMode,
      piUrl: result.url,
      piBody: result.data,
      piBodyText: clipPiBodyText(result.bodyText),
      keySource: result.keySource,
    });
    return result;
  } catch (error) {
    const status = error instanceof PiPlatformError ? error.status : 0;
    logPiAuthAttempt("approve", sandbox, "Key", status, "", { paymentId });
    logPiPaymentAction("approve", { paymentId, status, sandbox, authScheme: "Key", headerMode: "Key" });
    throw error;
  }
}

export async function completePiPayment(paymentId: string, txid: string, sandbox = false) {
  const result = await piApiWithKey404Fallback<PiPaymentDTO>(`/payments/${paymentId}/complete`, {
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
    headerMode: result.headerMode,
    piUrl: result.url,
    piBody: result.data,
    piBodyText: clipPiBodyText(result.bodyText),
    keySource: result.keySource,
  });
  return { ...result, ok: result.status === 200 };
}

export async function cancelPiPayment(paymentId: string, sandbox = false) {
  const result = await piApiWithKey404Fallback<PiPaymentDTO>(`/payments/${paymentId}/cancel`, {
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
    headerMode: result.headerMode,
    piUrl: result.url,
    piBody: result.data,
    piBodyText: clipPiBodyText(result.bodyText),
    keySource: result.keySource,
  });
  return result;
}
