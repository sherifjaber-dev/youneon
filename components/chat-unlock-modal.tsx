"use client";

import React from "react";
import { Star, X, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { YouNeonChatConnectArt } from "@/components/icons/youneon-chat-connect";
import { SubscribeWithPi } from "@/components/subscribe-with-pi";
import { CHAT_UNLOCK_NEON, NEON_PACKAGES } from "@/lib/product-config";
import { hideStaticLoginOverlays } from "@/lib/pi-client-session";
import { emitPremiumGranted } from "@/lib/premium";
import { PI_SDK_UNAVAILABLE, purchaseNeonPackWithPi } from "@/lib/pi-sdk";

export type ChatUnlockTarget = {
  id: string;
  name: string;
  avatar?: string;
  photo?: string;
};

interface ChatUnlockModalProps {
  open: boolean;
  remaining: number;
  target: ChatUnlockTarget | null;
  isPremium?: boolean;
  premiumUntil?: string | null;
  confirming?: boolean;
  neonBalance?: number;
  onClose: () => void;
  onUseFreeMessage: () => void;
  onUnlockWithNeon?: () => void;
  onUnlockedByPurchase?: () => void;
}

function stopOverlayTheft(event: React.SyntheticEvent) {
  event.stopPropagation();
}

export function ChatUnlockModal({
  open,
  remaining,
  target,
  isPremium = false,
  premiumUntil = null,
  confirming = false,
  neonBalance = 0,
  onClose,
  onUseFreeMessage,
  onUnlockWithNeon,
  onUnlockedByPurchase,
}: ChatUnlockModalProps) {
  const hasFree = remaining > 0;
  const canPayWithNeon = neonBalance >= CHAT_UNLOCK_NEON;
  const [purchasingId, setPurchasingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  React.useEffect(() => {
    if (open) {
      hideStaticLoginOverlays();
      setMessage(null);
      setPurchasingId(null);
    }
  }, [open]);

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
          : `+${neonGranted.toLocaleString()} Neon added.`,
      });
      if (!result.alreadyGranted) {
        onUnlockedByPurchase?.();
      }
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

  const name = target?.name || "this person";
  const busy = confirming || purchasingId !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next && !busy) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[2147483646]"
        onPointerDown={stopOverlayTheft}
        onPointerUp={stopOverlayTheft}
        onMouseDown={stopOverlayTheft}
        onTouchStart={stopOverlayTheft}
        onClick={stopOverlayTheft}
        className="z-[2147483646] max-h-[90vh] max-w-[360px] gap-0 overflow-y-auto rounded-2xl border border-black/8 bg-yn-card p-0 text-yn-text shadow-xl"
      >
        {hasFree ? (
          <>
            <div className="relative px-4 pb-1 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full text-yn-muted transition hover:bg-black/5 hover:text-yn-text disabled:opacity-40"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2.25} />
              </button>
              <DialogTitle className="pr-8 text-center text-[18px] font-semibold tracking-tight text-yn-text">
                Chat via Messages
              </DialogTitle>
              <DialogDescription className="sr-only">
                Use a free message to start a permanent chat with {name}.
              </DialogDescription>
            </div>

            <div className="px-4 pt-3">
              <YouNeonChatConnectArt className="overflow-hidden rounded-2xl border border-black/8 shadow-[0_8px_28px_rgba(88,28,135,0.08)]" />
            </div>

            <div className="px-5 pb-5 pt-4 text-center">
              <p className="text-[14px] leading-relaxed text-yn-muted">
                You can use a <span className="font-semibold text-sky-600">Free Message</span> to start chatting with{" "}
                <span className="font-semibold text-yn-text">{name}</span>. After this, messages with them stay free forever.
              </p>
              <p className="mt-2 text-[12px] text-yn-muted">
                {remaining} free {remaining === 1 ? "unlock" : "unlocks"} left today
              </p>
              <button
                type="button"
                onClick={onUseFreeMessage}
                disabled={busy}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(168,85,247,0.35)] transition active:scale-[0.98] disabled:opacity-60"
                data-testid="use-free-message-btn"
              >
                {confirming ? "Starting chat..." : "Start chatting – Use a Free Message"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2.25} />
              </button>
              <div className="pr-8 text-center">
                <DialogTitle className="text-[17px] font-semibold tracking-tight text-white">
                  Try our recommendation and continue!
                </DialogTitle>
                <DialogDescription className="mt-1 text-[12px] text-white/80">
                  After your daily free chat, opening a paid chat costs {CHAT_UNLOCK_NEON} Neon.
                  Then messages with {name} stay free forever.
                </DialogDescription>
              </div>
            </div>

            {onUnlockWithNeon && (
              <div className="px-4 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!canPayWithNeon) {
                      setMessage({
                        type: "error",
                        text: `You need ${CHAT_UNLOCK_NEON} Neon to open this chat. Buy a pack below.`,
                      });
                      return;
                    }
                    onUnlockWithNeon();
                  }}
                  disabled={busy}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(168,85,247,0.35)] transition active:scale-[0.98] disabled:opacity-60"
                  data-testid="unlock-paid-chat-neon-btn"
                >
                  {confirming ? "Starting chat..." : `Unlock for ${CHAT_UNLOCK_NEON} Neon`}
                </button>
                <p className="mt-2 text-center text-[12px] text-yn-muted">
                  Your balance: ◆ {neonBalance} Neon
                </p>
              </div>
            )}

            <SubscribeWithPi variant="shop" isPremium={isPremium} premiumUntil={premiumUntil} />

            <div className="px-4 pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-yn-muted">Neon packs</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3">
              {NEON_PACKAGES.map((pkg) => {
                const packBusy = purchasingId === pkg.id;
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
                      disabled={busy}
                      className="mt-2.5 flex h-9 w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-[12px] font-semibold text-white transition-all hover:from-purple-500 hover:to-pink-500 active:scale-[0.985] disabled:opacity-70"
                    >
                      <Zap size={12} />
                      {packBusy ? "Processing..." : `Buy ${pkg.price} π`}
                    </Button>
                  </div>
                );
              })}
            </div>

            {message && (
              <div
                className={`mx-3 mb-2 rounded-lg px-2.5 py-2 text-center text-[11px] font-medium ${
                  message.type === "success"
                    ? "border border-green-500/30 bg-green-500/15 text-green-400"
                    : message.type === "error"
                      ? "border border-red-500/30 bg-red-500/15 text-red-400"
                      : "border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="h-11 w-full rounded-xl text-[14px] font-semibold text-white/55 transition hover:bg-white/6 hover:text-white/80 disabled:opacity-40"
                data-testid="chat-unlock-maybe-next"
              >
                Maybe next time
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
