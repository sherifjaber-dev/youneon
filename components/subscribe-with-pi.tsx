"use client";

import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeWithPi } from "@/lib/pi-sdk";
import { PREMIUM_BENEFITS, PREMIUM_SUBSCRIBE_NEON, SUBSCRIPTION_PLAN } from "@/lib/product-config";
import { emitPremiumGranted, isPremiumActive } from "@/lib/premium";
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

type SubscribeWithPiProps = {
  variant?: "shop" | "settings";
  isPremium?: boolean;
  premiumUntil?: string | null;
};

export function SubscribeWithPi({
  isPremium = false,
  premiumUntil: premiumUntilProp = null,
}: SubscribeWithPiProps) {
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");
  const [premiumUntil, setPremiumUntil] = React.useState<string | null>(premiumUntilProp);
  const inFlightRef = React.useRef(false);

  React.useEffect(() => {
    setPremiumUntil(premiumUntilProp);
  }, [premiumUntilProp]);

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

  const handleSubscribe = async () => {
    setStatus("loading");
    setMessage("Opening Pi payment...");
    inFlightRef.current = true;

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
    <div className="yn-premium-interstitial-card mx-4 mt-4 mb-1">
      <div className="yn-premium-sheet">
        <p className="yn-premium-sheet-kicker">YouNeon</p>
        <div className="yn-premium-sheet-title">Premium</div>
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
          disabled={status === "loading"}
          className="yn-gold-cta yn-premium-sheet-cta w-full"
        >
          {status === "loading"
            ? "Processing Pi payment..."
            : active
              ? "Renew with Pi"
              : "Subscribe with Pi"}
        </Button>

        {status === "loading" && message ? <p className="yn-premium-sheet-wait">{message}</p> : null}
      </div>
    </div>
  );
}
