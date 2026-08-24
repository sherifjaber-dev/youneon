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
import { X, Zap, Star } from "lucide-react";

interface NeonShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium?: boolean;
  premiumUntil?: string | null;
}

export function NeonShopModal({
  isOpen,
  onClose,
  isPremium = false,
  premiumUntil = null,
}: NeonShopModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const handlePurchase = async (packageId: string) => {
    const neonPackage = NEON_PACKAGES.find((pkg) => pkg.id === packageId);
    if (!neonPackage) return;

    setIsLoading(true);
    setMessage(null);

    try {
      setMessage({
        type: "success",
        text: `+${neonPackage.neon} Neon added!`,
      });

      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 1600);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Purchase failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-[360px] overflow-y-auto rounded-2xl border border-white/10 bg-[#0f0117] p-0 shadow-xl">
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3.5">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 text-white/80 transition hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="text-center">
            <DialogTitle className="text-lg font-semibold tracking-tight text-white">
              Neon Shop
            </DialogTitle>
            <p className="mt-0.5 text-[12px] text-white/80">Subscribe or buy Neon with Pi</p>
          </div>
        </div>

        <SubscribeWithPi variant="shop" isPremium={isPremium} premiumUntil={premiumUntil} />

        <div className="px-4 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Neon packs</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 p-4">
          {NEON_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative flex flex-col rounded-xl border bg-white/[0.04] p-3.5 transition-colors ${
                pkg.badge
                  ? "border-pink-500/40"
                  : "border-white/10"
              }`}
            >
              {pkg.badge && (
                <div className="absolute -top-1.5 right-2 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Star size={9} /> {pkg.badge}
                </div>
              )}

              <div className="flex-1">
                <div className="text-2xl font-semibold leading-none text-yellow-400">
                  {pkg.neon.toLocaleString()}
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-purple-300">Neon</div>
              </div>

              <div className="mt-3">
                <div className="mb-2 text-[15px] font-semibold text-white">{pkg.price} π</div>

                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={isLoading}
                  className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-[13px] font-semibold text-white transition-all hover:from-purple-500 hover:to-pink-500 active:scale-[0.985]"
                >
                  <Zap size={14} />
                  Buy with Pi
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4 text-center">
          <p className="text-[10px] text-white/35">
            Secure payment via Pi Network
          </p>
        </div>

        {message && (
          <div className={`mx-4 mb-4 rounded-xl p-2.5 text-center text-xs font-medium ${
            message.type === "success"
              ? "border border-green-500/30 bg-green-500/15 text-green-400"
              : "border border-red-500/30 bg-red-500/15 text-red-400"
          }`}>
            {message.text}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
