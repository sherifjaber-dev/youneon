import type { PiPaymentDTO } from "@/lib/pi-types";

export const PI_PLATFORM_BASE = "https://api.minepi.com/v2";

if (typeof window !== "undefined") {
  throw new Error("pi-platform is server-only");
}

export function getPiServerApiKey(): string {
  const key = process.env.PI_NETWORK_API_KEY || process.env.PI_API_KEY || "";
  return key.trim();
}

export function parsePaymentId(value: unknown): string {
  const id = typeof value === "string" ? value.trim() : "";
  if (!id || id.length > 128 || !/^[\w-]+$/.test(id)) {
    return "";
  }
  return id;
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
    throw new Error("PI_NETWORK_API_KEY is not configured");
  }

  const method = options.method || "GET";
  const url = path.startsWith("http")
    ? path
    : `${PI_PLATFORM_BASE}${path.startsWith("/") ? path : `/${path}`}`;

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
  return piApi<PiPaymentDTO>(`/payments/${paymentId}/approve`, { method: "POST" });
}

export async function completePiPayment(paymentId: string, txid: string) {
  return piApi<PiPaymentDTO>(`/payments/${paymentId}/complete`, {
    method: "POST",
    body: { txid },
  });
}

export async function cancelPiPayment(paymentId: string) {
  return piApi<PiPaymentDTO>(`/payments/${paymentId}/cancel`, { method: "POST" });
}
