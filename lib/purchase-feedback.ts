"use client";

export const PURCHASE_FEEDBACK_EVENT = "youneon:purchase-feedback";
export const KOB_GENNEMFORT = "Køb gennemført";

export type PurchaseFeedback =
  | { type: "waiting"; message?: string }
  | { type: "success"; message?: string }
  | { type: "error"; message: string };

export function emitPurchaseFeedback(detail: PurchaseFeedback): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PURCHASE_FEEDBACK_EVENT, { detail }));
}

export function purchaseErrorMessage(error: unknown, fallback = "Purchase failed"): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
