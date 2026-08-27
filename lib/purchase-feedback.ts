"use client";

export const PURCHASE_FEEDBACK_EVENT = "youneon:purchase-feedback";

export const PURCHASE_COMPLETED_TITLE = "Purchase completed";
export const PURCHASE_COMPLETED_STATUS = "Completed";
export const PURCHASE_NOT_COMPLETED_TITLE = "Not completed";
export const PURCHASE_NOT_COMPLETED_FALLBACK = "Your purchase was not completed.";
export const PURCHASE_OK_LABEL = "OK";

export type PurchaseFeedback =
  | { type: "waiting"; message?: string }
  | { type: "success"; summary?: string; message?: string }
  | { type: "error"; message?: string };

type PaymentLike = {
  amount?: number;
  metadata?: Record<string, unknown> | null;
} | null | undefined;

export function emitPurchaseFeedback(detail: PurchaseFeedback): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PURCHASE_FEEDBACK_EVENT, { detail }));
}

export function purchaseErrorMessage(
  error: unknown,
  fallback = PURCHASE_NOT_COMPLETED_FALLBACK
): string {
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return fallback;
}

export function formatPiAmount(amount: number): string {
  if (!Number.isFinite(amount)) return "";
  const rounded = Math.round(amount * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function purchaseSummaryFromPayment(payment: PaymentLike): string {
  if (!payment) return "";
  const amount = typeof payment.amount === "number" ? payment.amount : Number.NaN;
  const pi = formatPiAmount(amount);
  const meta = payment.metadata || {};
  const type = typeof meta.type === "string" ? meta.type : "";
  const planId = typeof meta.planId === "string" ? meta.planId : "";
  const neon = typeof meta.neon === "number" ? meta.neon : 0;

  if (type === "subscription" || planId === "youneon_premium_subscribe") {
    return pi ? `${pi} π · Premium` : "Premium";
  }
  if (neon > 0) {
    const neonLabel = `${neon.toLocaleString("en-US")} Neon`;
    return pi ? `${pi} π · ${neonLabel}` : neonLabel;
  }
  return pi ? `${pi} π` : "";
}

export function purchaseFailureBody(message?: string): string {
  const text = typeof message === "string" ? message.trim() : "";
  if (!text) return PURCHASE_NOT_COMPLETED_FALLBACK;
  if (text === "PI_SDK_UNAVAILABLE" || text.includes("PI_SDK_UNAVAILABLE")) {
    return "Open YouNeon in Pi Browser to complete this purchase.";
  }
  return text;
}
