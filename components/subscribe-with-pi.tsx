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
          ? "mx-4 mt-4 mb-1 rounded-2xl border border-pink-500/50 bg-gradient-to-b from-purple-900/80 to-zinc-900 p-4"
          : "w-full rounded-xl border-2 border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50 p-4"
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            isShop
              ? "w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0"
              : "w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 text-white"
          }
        >
          <Crown size={isShop ? 18 : 22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={isShop ? "text-white font-bold text-sm" : "text-gray-900 font-bold text-sm"}>
            {SUBSCRIPTION_PLAN.name}
          </div>
          <p className={isShop ? "text-purple-200 text-xs mt-0.5" : "text-gray-600 text-xs mt-0.5"}>
            {SUBSCRIPTION_PLAN.amount} Pi / {SUBSCRIPTION_PLAN.days} days
          </p>
        </div>
      </div>

      <Button
        onClick={handleSubscribe}
        disabled={status === "loading"}
        className={
          isShop
            ? "w-full h-10 mt-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-xl"
            : "w-full h-11 mt-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold rounded-xl"
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
