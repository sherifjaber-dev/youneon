"use client";

import React from "react";
import { Check, Crown, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { subscribeWithPi } from "@/lib/pi-sdk";
import { PREMIUM_BENEFITS, PREMIUM_SUBSCRIBE_NEON, SUBSCRIPTION_PLAN } from "@/lib/product-config";
import { emitPremiumGranted, isPremiumActive } from "@/lib/premium";
import { hideStaticLoginOverlays } from "@/lib/pi-client-session";
import { PURCHASE_FEEDBACK_EVENT, type PurchaseFeedback } from "@/lib/purchase-feedback";

function formatUntil(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function stopOverlayTheft(event: React.SyntheticEvent) {
  event.stopPropagation();
}

type SubscribeModalProps = {
  open: boolean;
  onClose: () => void;
  isPremium?: boolean;
  premiumUntil?: string | null;
};

export function SubscribeModal({
  open,
  onClose,
  isPremium = false,
  premiumUntil: premiumUntilProp = null,
}: SubscribeModalProps) {
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");
  const [premiumUntil, setPremiumUntil] = React.useState<string | null>(premiumUntilProp);
  const inFlightRef = React.useRef(false);

  React.useEffect(() => {
    setPremiumUntil(premiumUntilProp);
  }, [premiumUntilProp]);

  React.useEffect(() => {
    if (open) hideStaticLoginOverlays();
  }, [open]);

  React.useEffect(() => {
    const onFeedback = (event: Event) => {
      if (!inFlightRef.current) return;
      const detail = (event as CustomEvent<PurchaseFeedback>).detail;
      if (!detail?.type) return;
      if (detail.type === "waiting") {
        setStatus("loading");
        setMessage(detail.message || "Waiting for Pi payment…");
        return;
      }
      setStatus("idle");
      setMessage("");
    };
    window.addEventListener(PURCHASE_FEEDBACK_EVENT, onFeedback);
    return () => window.removeEventListener(PURCHASE_FEEDBACK_EVENT, onFeedback);
  }, []);

  const active = isPremium || isPremiumActive(premiumUntil);
  const busy = status === "loading";

  const handleSubscribe = async () => {
    setStatus("loading");
    setMessage("Opening Pi payment...");
    inFlightRef.current = true;
    hideStaticLoginOverlays();

    try {
      const result = await subscribeWithPi();
      const until = result.premiumUntil || null;
      const neonGranted =
        result.alreadyGranted
          ? 0
          : typeof result.neonGranted === "number" && result.neonGranted > 0
            ? result.neonGranted
            : result.granted === false
              ? 0
              : PREMIUM_SUBSCRIBE_NEON;
      setPremiumUntil(until);
      emitPremiumGranted({
        premiumUntil: until,
        neonGranted,
        alreadyGranted: result.alreadyGranted === true,
      });
      setStatus("idle");
      setMessage("");
    } catch {
      setStatus("idle");
      setMessage("");
    } finally {
      inFlightRef.current = false;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[2147483646] bg-black/78 backdrop-blur-[18px]"
        onPointerDown={stopOverlayTheft}
        onPointerUp={stopOverlayTheft}
        onMouseDown={stopOverlayTheft}
        onTouchStart={stopOverlayTheft}
        onClick={stopOverlayTheft}
        className="z-[2147483646] max-h-[90vh] max-w-[360px] gap-0 overflow-y-auto border-0 bg-transparent p-0 shadow-none"
        data-testid="subscribe-modal"
      >
        <div className="yn-premium-interstitial-card px-5 pb-5 pt-4 text-white">
          <div className="relative mb-3 pr-8">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="absolute -right-1 -top-0.5 flex h-8 w-8 items-center justify-center rounded-full text-[#f5d76e] drop-shadow-[0_0_8px_rgba(245,215,110,0.7)] transition hover:bg-white/8 disabled:opacity-40"
              aria-label="Close"
            >
              <X size={18} strokeWidth={2.2} />
            </button>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#C9A227] to-purple-600 shadow-[0_0_16px_rgba(201,162,39,0.45)]">
                <Crown size={18} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="yn-premium-interstitial-title text-left text-[26px]">
                  YouNeon Premium
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Subscribe to YouNeon Premium for {SUBSCRIPTION_PLAN.amount} π every {SUBSCRIPTION_PLAN.days} days.
                </DialogDescription>
                <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 leading-none">
                  <span className="text-[26px] font-bold tabular-nums tracking-tight text-[#f5d76e] drop-shadow-[0_0_8px_rgba(245,215,110,0.7)]">
                    {SUBSCRIPTION_PLAN.amount} π
                  </span>
                  <span className="text-[13px] font-semibold text-white/70">
                    / {SUBSCRIPTION_PLAN.days} days
                  </span>
                </p>
                {active && premiumUntil && (
                  <p className="mt-1.5 text-[11px] font-medium text-emerald-300">
                    Active until {formatUntil(premiumUntil)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <ul className="space-y-2.5">
            {PREMIUM_BENEFITS.map((benefit) => (
              <li key={benefit.title} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                  <Check size={12} strokeWidth={2.5} />
                </span>
                <span>
                  <span className="block text-[13px] font-medium text-white">{benefit.title}</span>
                  <span className="text-[12px] leading-relaxed text-white/60">{benefit.detail}</span>
                </span>
              </li>
            ))}
          </ul>

          <Button
            onClick={handleSubscribe}
            disabled={busy}
            className="yn-gold-cta mt-4 h-[52px] w-full rounded-xl bg-gradient-to-r from-[#C9A227] to-[#D4AF37] text-[17px] font-bold text-[#1a1408] shadow-[0_4px_18px_rgba(201,162,39,0.42)] hover:from-[#D4AF37] hover:to-[#C9A227] hover:bg-transparent"
          >
            {busy ? "Processing Pi payment..." : active ? "Renew with Pi" : "Subscribe with Pi"}
          </Button>

          {busy && message && (
            <p className="mt-2 text-center text-xs font-medium text-[#e9d5ff]">{message}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
