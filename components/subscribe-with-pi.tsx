"use client";

import React from "react";
import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PI_SDK_UNAVAILABLE, subscribeWithPi } from "@/lib/pi-sdk";
import { PREMIUM_BENEFITS, PREMIUM_SUBSCRIBE_NEON, SUBSCRIPTION_PLAN } from "@/lib/product-config";
import { emitPremiumGranted, isPremiumActive } from "@/lib/premium";
import { KOB_GENNEMFORT, PURCHASE_FEEDBACK_EVENT, type PurchaseFeedback } from "@/lib/purchase-feedback";

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
  variant = "shop",
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
      if (detail.type === "success") {
        setStatus("success");
        setMessage(KOB_GENNEMFORT);
        return;
      }
      if (detail.type === "error") {
        setStatus("error");
        setMessage(detail.message);
        return;
      }
      setStatus("loading");
      setMessage(detail.message || "Waiting for Pi payment…");
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
      setStatus("success");
      setMessage(
        until
          ? `${KOB_GENNEMFORT}. YouNeon Premium is active until ${formatUntil(until)}.${neonGranted > 0 ? ` +${neonGranted} Neon added.` : ""}`
          : KOB_GENNEMFORT
      );
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error ?? "");
      setStatus("error");
      if (raw === PI_SDK_UNAVAILABLE || raw.includes(PI_SDK_UNAVAILABLE)) {
        setMessage("Open YouNeon in Pi Browser to Subscribe with Pi.");
      } else if (/cancel/i.test(raw)) {
        setMessage("Payment cancelled. You can try again when you're ready.");
      } else {
        setMessage(raw || "Subscription failed. Please try again.");
      }
    } finally {
      inFlightRef.current = false;
    }
  };

  const isShop = variant === "shop";
  const titleClass = "text-[15px] font-semibold text-yn-text";
  const bodyClass = "text-[12px] leading-relaxed text-yn-muted";
  const benefitText = "text-[13px] text-yn-text";

  return (
    <div
      className={
        isShop
          ? "mx-4 mt-4 mb-1 rounded-2xl border border-pink-200 bg-gradient-to-b from-fuchsia-50 to-pink-50 p-4"
          : "w-full rounded-2xl border border-purple-400/40 bg-gradient-to-r from-purple-50 to-pink-50 p-4"
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            isShop
              ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600"
              : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white"
          }
        >
          <Crown size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className={titleClass}>{SUBSCRIPTION_PLAN.name}</div>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 leading-none">
            <span className="text-[26px] font-bold tabular-nums tracking-tight text-yn-gold">
              {SUBSCRIPTION_PLAN.amount} π
            </span>
            <span className="text-[13px] font-semibold text-yn-muted">/ {SUBSCRIPTION_PLAN.days} days</span>
          </p>
          {active && premiumUntil && (
            <p className={isShop ? "mt-1 text-[11px] text-emerald-700" : "mt-1 text-[11px] text-emerald-700"}>
              Active until {formatUntil(premiumUntil)}
            </p>
          )}
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {PREMIUM_BENEFITS.map((benefit) => (
          <li key={benefit.title} className="flex items-start gap-2.5">
            <span
              className={
                isShop
                ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                : "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
              }
            >
              <Check size={12} strokeWidth={2.5} />
            </span>
            <span>
              <span className={`block font-medium ${benefitText}`}>{benefit.title}</span>
              <span className={bodyClass}>{benefit.detail}</span>
            </span>
          </li>
        ))}
      </ul>

      <Button
        onClick={handleSubscribe}
        disabled={status === "loading"}
        className="yn-gold-cta mt-4 h-[52px] w-full rounded-xl bg-gradient-to-r from-[#C9A227] to-[#D4AF37] text-[17px] font-bold text-[#1a1408] shadow-[0_4px_18px_rgba(201,162,39,0.42)] hover:from-[#D4AF37] hover:to-[#C9A227] hover:bg-transparent"
      >
        {status === "loading"
          ? "Processing Pi payment..."
          : active
            ? "Renew with Pi"
            : "Subscribe with Pi"}
      </Button>

      {status !== "idle" && message && (
        <p
          className={`mt-2 text-xs font-medium ${
            status === "success"
              ? "text-green-700"
              : status === "error"
                ? "text-red-600"
                : "text-purple-700"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
