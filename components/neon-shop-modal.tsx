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
          ? "This pack was already granted."
          : `+${neonGranted.toLocaleString()} Neon added!`,
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
        className="z-[2147483647] max-h-[90vh] max-w-[360px] gap-0 overflow-y-auto rounded-2xl border border-white/10 bg-[#0f0117] p-0 shadow-xl"
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Neon packs</p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3">
          {NEON_PACKAGES.map((pkg) => {
            const busy = purchasingId === pkg.id;
            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col rounded-lg border px-3 py-2.5 ${
                  pkg.badge
                    ? "border-pink-500/35 bg-gradient-to-b from-pink-500/10 to-white/[0.03]"
                    : "border-white/[0.08] bg-white/[0.03]"
                }`}
              >
                {pkg.badge && (
                  <div className="absolute -top-1.5 right-2 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-1.5 py-px text-[9px] font-semibold text-white">
                    <Star size={8} /> {pkg.badge}
                  </div>
                )}

                <div className="flex items-baseline justify-between gap-1">
                  <div className="text-[22px] font-semibold leading-none tabular-nums text-yellow-300">
                    {pkg.neon.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-white/40">Neon</div>
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
          <p className="text-[10px] text-white/35">
            Secure payment via Pi Network
          </p>
        </div>

        {message && (
          <div className={`mx-3 mb-3 rounded-lg px-2.5 py-2 text-center text-[11px] font-medium ${
            message.type === "success"
              ? "border border-green-500/30 bg-green-500/15 text-green-400"
              : message.type === "error"
                ? "border border-red-500/30 bg-red-500/15 text-red-400"
                : "border border-purple-400/25 bg-purple-500/15 text-purple-200"
          }`}>
            {message.text}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
