"use client";

import React from "react";
import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PI_SDK_UNAVAILABLE, subscribeWithPi } from "@/lib/pi-sdk";
import { PREMIUM_BENEFITS, PREMIUM_SUBSCRIBE_NEON, SUBSCRIPTION_PLAN } from "@/lib/product-config";
import { emitPremiumGranted, isPremiumActive } from "@/lib/premium";

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

  React.useEffect(() => {
    setPremiumUntil(premiumUntilProp);
  }, [premiumUntilProp]);

  const active = isPremium || isPremiumActive(premiumUntil);

  const handleSubscribe = async () => {
    setStatus("loading");
    setMessage("Opening Pi payment...");

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
          ? `YouNeon Premium is active until ${formatUntil(until)}.${neonGranted > 0 ? ` +${neonGranted} Neon added.` : ""}`
          : "Payment complete. YouNeon Premium is now active."
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
          <p className={isShop ? "mt-0.5 text-[13px] font-medium text-yn-accent" : "mt-0.5 text-[13px] font-medium text-purple-700"}>
            {SUBSCRIPTION_PLAN.amount} π / {SUBSCRIPTION_PLAN.days} days
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
        className="mt-4 h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-[15px] font-semibold text-white hover:from-purple-500 hover:to-pink-500"
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
