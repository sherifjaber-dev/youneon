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
        className="z-[2147483646] max-h-[90dvh] max-w-[360px] gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none"
        data-testid="subscribe-modal"
      >
        <div className="yn-premium-interstitial-card">
          <div className="yn-premium-sheet">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="yn-premium-sheet-close"
              aria-label="Close"
            >
              <X size={18} strokeWidth={2} />
            </button>

            <div className="yn-premium-sheet-mark" aria-hidden>
              <Crown size={22} strokeWidth={1.75} />
            </div>
            <p className="yn-premium-sheet-kicker">YouNeon</p>
            <DialogTitle
              className="yn-premium-sheet-title text-white"
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            >
              Premium
            </DialogTitle>
            <DialogDescription className="sr-only">
              Subscribe to YouNeon Premium for {SUBSCRIPTION_PLAN.amount} π every {SUBSCRIPTION_PLAN.days} days.
            </DialogDescription>

            <p className="yn-premium-sheet-price">
              <span className="yn-premium-sheet-amount">{SUBSCRIPTION_PLAN.amount} π</span>
              <span className="yn-premium-sheet-term">/ {SUBSCRIPTION_PLAN.days} days</span>
            </p>

            {active && premiumUntil ? (
              <p className="yn-premium-sheet-status">Active until {formatUntil(premiumUntil)}</p>
            ) : null}

            <ul className="yn-premium-sheet-list">
              {PREMIUM_BENEFITS.map((benefit) => (
                <li key={benefit.title} className="yn-premium-sheet-item">
                  <span className="yn-premium-sheet-check" aria-hidden>
                    <Check size={12} strokeWidth={2.5} />
                  </span>
                  <span>
                    <span className="yn-premium-sheet-benefit">{benefit.title}</span>
                    <span className="yn-premium-sheet-detail">{benefit.detail}</span>
                  </span>
                </li>
              ))}
            </ul>

            <Button
              onClick={handleSubscribe}
              disabled={busy}
              className="yn-gold-cta yn-premium-sheet-cta w-full"
            >
              {busy ? "Processing Pi payment..." : active ? "Renew with Pi" : "Subscribe with Pi"}
            </Button>

            {busy && message ? <p className="yn-premium-sheet-wait">{message}</p> : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
