"use client";

import React from "react";
import { Check, X } from "lucide-react";
import {
  KOB_GENNEMFORT,
  PURCHASE_FEEDBACK_EVENT,
  type PurchaseFeedback,
} from "@/lib/purchase-feedback";

export function PurchaseCompleteBanner() {
  const [feedback, setFeedback] = React.useState<PurchaseFeedback | null>(null);

  React.useEffect(() => {
    const onFeedback = (event: Event) => {
      const detail = (event as CustomEvent<PurchaseFeedback>).detail;
      if (!detail?.type) return;
      setFeedback(detail);
    };
    window.addEventListener(PURCHASE_FEEDBACK_EVENT, onFeedback);
    return () => window.removeEventListener(PURCHASE_FEEDBACK_EVENT, onFeedback);
  }, []);

  if (!feedback || feedback.type === "waiting") return null;

  const success = feedback.type === "success";

  return (
    <div
      className="fixed inset-x-0 top-0 z-[2147483646] flex justify-center px-3 pt-[max(12px,env(safe-area-inset-top))] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 shadow-xl ${
          success
            ? "border border-emerald-400/40 bg-emerald-600 text-white"
            : "border border-red-400/40 bg-red-700 text-white"
        }`}
      >
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
          {success ? <Check size={18} strokeWidth={2.5} /> : <X size={18} strokeWidth={2.5} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold leading-tight">
            {success ? KOB_GENNEMFORT : "Pi complete failed"}
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-white/90">
            {success
              ? feedback.message || "Your Pi payment is complete."
              : feedback.message}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          className="mt-0.5 rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
          onClick={() => setFeedback(null)}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
