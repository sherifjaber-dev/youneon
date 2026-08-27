"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubscribeWithPi } from "@/components/subscribe-with-pi";
import { NEON_PACKAGES } from "@/lib/product-config";
import { hideStaticLoginOverlays } from "@/lib/pi-client-session";
import { emitPremiumGranted } from "@/lib/premium";
import { PI_SDK_UNAVAILABLE, purchaseNeonPackWithPi } from "@/lib/pi-sdk";
import { KOB_GENNEMFORT, PURCHASE_FEEDBACK_EVENT, type PurchaseFeedback } from "@/lib/purchase-feedback";
import { X, Zap, Star } from "lucide-react";

interface NeonShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium?: boolean;
  premiumUntil?: string | null;
}

function stopOverlayTheft(event: React.SyntheticEvent) {
  event.stopPropagation();
}

export function NeonShopModal({
  isOpen,
  onClose,
  isPremium = false,
  premiumUntil = null,
}: NeonShopModalProps) {
  const [purchasingId, setPurchasingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  React.useEffect(() => {
    if (isOpen) hideStaticLoginOverlays();
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onFeedback = (event: Event) => {
      const detail = (event as CustomEvent<PurchaseFeedback>).detail;
      if (!detail?.type) return;
      if (detail.type === "success") {
        setMessage({ type: "success", text: KOB_GENNEMFORT });
        return;
      }
      if (detail.type === "error") {
        setMessage({ type: "error", text: detail.message });
        return;
      }
      setMessage({ type: "info", text: detail.message || "Waiting for Pi payment…" });
    };
    window.addEventListener(PURCHASE_FEEDBACK_EVENT, onFeedback);
    return () => window.removeEventListener(PURCHASE_FEEDBACK_EVENT, onFeedback);
  }, [isOpen]);

  const handlePurchase = async (event: React.MouseEvent, packageId: string) => {
    event.preventDefault();
    event.stopPropagation();

    const neonPackage = NEON_PACKAGES.find((pkg) => pkg.id === packageId);
    if (!neonPackage || purchasingId) return;

    hideStaticLoginOverlays();
    setPurchasingId(packageId);
    setMessage({ type: "info", text: "Opening Pi payment..." });

    try {
      const result = await purchaseNeonPackWithPi(packageId);
      const neonGranted =
        result.alreadyGranted
          ? 0
          : typeof result.neonGranted === "number" && result.neonGranted > 0
            ? result.neonGranted
            : result.granted === false
              ? 0
              : neonPackage.neon;

      emitPremiumGranted({
        premiumUntil: result.premiumUntil || null,
        neonGranted,
        alreadyGranted: result.alreadyGranted === true,
      });

      setMessage({
        type: "success",
        text: result.alreadyGranted
          ? `${KOB_GENNEMFORT}. This pack was already granted.`
          : neonGranted > 0
            ? `${KOB_GENNEMFORT}. +${neonGranted.toLocaleString()} Neon added!`
            : KOB_GENNEMFORT,
      });
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error ?? "");
      if (raw === PI_SDK_UNAVAILABLE || raw.includes(PI_SDK_UNAVAILABLE)) {
        setMessage({
          type: "error",
          text: "Open YouNeon in Pi Browser to buy Neon with Pi.",
        });
      } else if (/cancel/i.test(raw)) {
        setMessage({
          type: "error",
          text: "Payment cancelled. You can try again when you're ready.",
        });
      } else {
        setMessage({
          type: "error",
          text: raw || "Purchase failed. Please try again.",
        });
      }
    } finally {
      setPurchasingId(null);
    }
  };

  const isLoading = purchasingId !== null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[2147483647]"
        onPointerDown={stopOverlayTheft}
        onPointerUp={stopOverlayTheft}
        onMouseDown={stopOverlayTheft}
        onTouchStart={stopOverlayTheft}
        onClick={stopOverlayTheft}
        className="z-[2147483647] max-h-[90vh] max-w-[360px] gap-0 overflow-y-auto rounded-2xl border border-black/8 bg-yn-card p-0 text-yn-text shadow-xl"
      >
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onClose();
            }}
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.25} />
          </button>

          <div className="pr-8 text-center">
            <DialogTitle className="text-[17px] font-semibold tracking-tight text-white">
              Neon Shop
            </DialogTitle>
            <p className="mt-0.5 text-[11px] text-white/80">Subscribe or buy Neon with Pi</p>
          </div>
        </div>

        <SubscribeWithPi variant="shop" isPremium={isPremium} premiumUntil={premiumUntil} />

        <div className="px-4 pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-yn-muted">Neon packs</p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3">
          {NEON_PACKAGES.map((pkg) => {
            const busy = purchasingId === pkg.id;
            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col rounded-lg border px-3 py-2.5 ${
                  pkg.badge
                    ? "border-pink-300 bg-gradient-to-b from-pink-50 to-white"
                    : "border-black/8 bg-yn-bg"
                }`}
              >
                {pkg.badge && (
                  <div className="absolute -top-1.5 right-2 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-1.5 py-px text-[9px] font-semibold text-white">
                    <Star size={8} /> {pkg.badge}
                  </div>
                )}

                <div className="flex items-baseline justify-between gap-1">
                  <div className="text-[22px] font-semibold leading-none tabular-nums text-amber-600">
                    {pkg.neon.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-yn-muted">Neon</div>
                </div>

                <Button
                  type="button"
                  onClick={(event) => void handlePurchase(event, pkg.id)}
                  disabled={isLoading}
                  className="mt-2.5 flex h-9 w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-[12px] font-semibold text-white transition-all hover:from-purple-500 hover:to-pink-500 active:scale-[0.985] disabled:opacity-70"
                >
                  <Zap size={12} />
                  {busy ? "Processing..." : `Buy ${pkg.price} π`}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="px-4 pb-3.5 text-center">
          <p className="text-[10px] text-yn-muted">
            Secure payment via Pi Network
          </p>
        </div>

        {message && (
          <div className={`mx-3 mb-3 rounded-lg px-2.5 py-2 text-center text-[11px] font-medium ${
            message.type === "success"
              ? "border border-green-500/30 bg-green-500/15 text-green-400"
              : message.type === "error"
                ? "border border-red-500/30 bg-red-500/15 text-red-400"
                : "border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800"
          }`}>
            {message.text}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
