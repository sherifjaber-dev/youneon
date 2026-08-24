"use client";

import React from "react";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PI_SDK_UNAVAILABLE, subscribeWithPi } from "@/lib/pi-sdk";
import { SUBSCRIPTION_PLAN } from "@/lib/product-config";

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
};

export function SubscribeWithPi({ variant = "shop" }: SubscribeWithPiProps) {
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");
  const [premiumUntil, setPremiumUntil] = React.useState<string | null>(null);

  const handleSubscribe = async () => {
    setStatus("loading");
    setMessage("Opening Pi payment...");

    try {
      const result = await subscribeWithPi();
      const until = result.premiumUntil || null;
      setPremiumUntil(until);
      setStatus("success");
      setMessage(
        until
          ? `YouNeon Premium is active until ${formatUntil(until)}.`
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

  return (
    <div
      className={
        isShop
          ? "mx-4 mt-4 mb-1 rounded-xl border border-pink-500/30 bg-gradient-to-b from-purple-900/50 to-transparent p-3.5"
          : "w-full rounded-xl border border-purple-400/40 bg-gradient-to-r from-purple-50 to-pink-50 p-3.5"
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            isShop
              ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600"
              : "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white"
          }
        >
          <Crown size={isShop ? 16 : 18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className={isShop ? "text-sm font-semibold text-white" : "text-sm font-semibold text-gray-900"}>
            {SUBSCRIPTION_PLAN.name}
          </div>
          <p className={isShop ? "mt-0.5 text-xs text-purple-200/80" : "mt-0.5 text-xs text-gray-600"}>
            {SUBSCRIPTION_PLAN.amount} Pi / {SUBSCRIPTION_PLAN.days} days
          </p>
        </div>
      </div>

      <Button
        onClick={handleSubscribe}
        disabled={status === "loading"}
        className={
          isShop
            ? "mt-3 h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-[15px] font-semibold text-white hover:from-purple-500 hover:to-pink-500"
            : "mt-3 h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-[15px] font-semibold text-white hover:from-purple-500 hover:to-pink-500"
        }
      >
        {status === "loading" ? "Processing Pi payment..." : "Subscribe with Pi"}
      </Button>

      {status !== "idle" && message && (
        <p
          className={`mt-2 text-xs font-medium ${
            status === "success"
              ? isShop
                ? "text-green-400"
                : "text-green-700"
              : status === "error"
                ? isShop
                  ? "text-red-400"
                  : "text-red-600"
                : isShop
                  ? "text-purple-200"
                  : "text-purple-700"
          }`}
        >
          {message}
        </p>
      )}

      {status === "success" && premiumUntil && (
        <p className={isShop ? "mt-1 text-[10px] text-purple-300" : "mt-1 text-[10px] text-purple-500"}>
          Premium until {formatUntil(premiumUntil)}
        </p>
      )}
    </div>
  );
}
