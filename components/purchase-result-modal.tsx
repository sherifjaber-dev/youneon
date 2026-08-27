"use client";

import React from "react";
import { Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PURCHASE_COMPLETED_STATUS,
  PURCHASE_COMPLETED_TITLE,
  PURCHASE_FEEDBACK_EVENT,
  PURCHASE_NOT_COMPLETED_TITLE,
  PURCHASE_OK_LABEL,
  purchaseFailureBody,
  type PurchaseFeedback,
} from "@/lib/purchase-feedback";

export function PurchaseResultModal() {
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

  const open = feedback?.type === "success" || feedback?.type === "error";
  const success = feedback?.type === "success";
  const summary = success ? feedback.summary?.trim() || "" : "";
  const errorBody = success ? "" : purchaseFailureBody(feedback?.message);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setFeedback(null);
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[2147483647] bg-black/70"
        className="z-[2147483647] w-full max-w-[340px] gap-0 overflow-hidden rounded-2xl border border-pink-500/35 bg-[#12081c] p-0 text-white shadow-[0_18px_48px_rgba(0,0,0,0.55)]"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const ok = (event.currentTarget as HTMLElement).querySelector<HTMLButtonElement>(
            "[data-youneon-purchase-ok]"
          );
          ok?.focus();
        }}
      >
        <div
          className={`flex items-center gap-3 px-5 py-4 ${
            success
              ? "bg-gradient-to-r from-purple-700/80 to-pink-700/70"
              : "bg-gradient-to-r from-[#3a1020] to-[#2a0818]"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              success ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-white/10 text-pink-300"
            }`}
          >
            {success ? <Check size={20} strokeWidth={2.6} /> : <X size={20} strokeWidth={2.6} />}
          </div>
          <DialogTitle className="text-[18px] font-semibold tracking-tight text-white">
            {success ? PURCHASE_COMPLETED_TITLE : PURCHASE_NOT_COMPLETED_TITLE}
          </DialogTitle>
        </div>

        <DialogDescription asChild>
          <div className="space-y-2 px-5 py-4 text-center">
            {success ? (
              <>
                {summary ? (
                  <p className="text-[20px] font-semibold tabular-nums tracking-tight text-[#D4AF37]">
                    {summary}
                  </p>
                ) : null}
                <p className="text-[15px] font-semibold text-emerald-400">
                  {PURCHASE_COMPLETED_STATUS}
                </p>
              </>
            ) : (
              <p className="text-[14px] leading-relaxed text-white/85">{errorBody}</p>
            )}
          </div>
        </DialogDescription>

        <div className="px-5 pb-5">
          <button
            type="button"
            data-youneon-purchase-ok
            className="h-11 w-full rounded-xl bg-gradient-to-r from-[#C9A227] to-[#D4AF37] text-[15px] font-bold text-[#1a1408] shadow-[0_4px_18px_rgba(201,162,39,0.42)]"
            onClick={() => setFeedback(null)}
          >
            {PURCHASE_OK_LABEL}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
