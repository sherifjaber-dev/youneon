"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubscribeWithPi } from "@/components/subscribe-with-pi";
import { NEON_PACKAGES } from "@/lib/product-config";
import { X, Zap, Star } from "lucide-react";

interface NeonShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NeonShopModal({ isOpen, onClose }: NeonShopModalProps) {
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
        text: `✨ +${neonPackage.neon} Neon added!`,
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
      <DialogContent className="bg-[#0a0a0f] border border-purple-500/40 shadow-2xl shadow-purple-500/30 max-w-[360px] max-h-[90vh] overflow-y-auto rounded-3xl p-0">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 px-5 py-4 relative">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 text-white/80 hover:text-white transition"
          >
            <X size={20} />
          </button>
          
          <div className="text-center">
            <DialogTitle className="text-2xl font-black text-white tracking-tight">
              Neon Shop
            </DialogTitle>
            <p className="text-white/90 text-xs mt-0.5">Subscribe or buy Neon with Pi</p>
          </div>
        </div>

        <SubscribeWithPi variant="shop" />

        {/* Packages */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {NEON_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-zinc-900 border rounded-2xl p-4 transition-all hover:scale-[1.01] flex flex-col ${
                pkg.badge 
                  ? "border-pink-500/60 shadow-lg shadow-pink-500/20" 
                  : "border-purple-500/30 hover:border-purple-400"
              }`}
            >
              {/* Badge */}
              {pkg.badge && (
                <div className="absolute -top-1.5 right-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Star size={10} /> {pkg.badge}
                </div>
              )}

              <div className="flex-1">
                <div className="text-4xl font-black text-yellow-400 leading-none">
                  {pkg.neon}
                </div>
                <div className="text-xs text-purple-300 font-medium -mt-1">Neon</div>
              </div>

              <div className="mt-3">
                <div className="text-xl font-bold text-white mb-2">{pkg.price} Pi</div>
                
                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={isLoading}
                  className="w-full h-9 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.985]"
                >
                  <Zap size={15} />
                  Buy with Pi
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 text-center">
          <p className="text-[10px] text-purple-400/70">
            Secure payment via Pi Network
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-4 mb-4 p-3 rounded-xl text-center text-xs font-medium ${
            message.type === "success" 
              ? "bg-green-500/20 text-green-400 border border-green-500/40" 
              : "bg-red-500/20 text-red-400 border border-red-500/40"
          }`}>
            {message.text}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}