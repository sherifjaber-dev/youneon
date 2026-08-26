"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, X } from "lucide-react";
import { MyItemsInventory } from "@/components/my-items-inventory";
import { YouNeonBagIcon } from "@/components/icons/youneon-chat-connect";
import { useLanguage } from "@/contexts/language-context";
import { piAuthService } from "@/lib/pi-auth-service";

type MyItemsSheetProps = {
  open: boolean;
  onClose: () => void;
  freeUnlocksRemaining: number;
  onEnterShop?: () => void;
  username?: string;
};

export function MyItemsSheet({
  open,
  onClose,
  freeUnlocksRemaining,
  onEnterShop,
  username,
}: MyItemsSheetProps) {
  const { t } = useLanguage();
  const [showFull, setShowFull] = useState(false);
  const startY = useRef<number | null>(null);
  const dragYRef = useRef(0);
  const [dragY, setDragY] = useState(0);
  const count = Math.max(0, Math.floor(freeUnlocksRemaining));
  const resolved = username || piAuthService.getCurrentUser()?.username || "";

  useEffect(() => {
    if (!open) {
      setShowFull(false);
      dragYRef.current = 0;
      setDragY(0);
      startY.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showFull) setShowFull(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, showFull]);

  if (!open) return null;

  const enterShop = () => {
    onClose();
    onEnterShop?.();
  };

  const onTouchStart = (event: React.TouchEvent) => {
    if (showFull) return;
    startY.current = event.touches[0].clientY;
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (showFull || startY.current == null) return;
    const next = Math.max(0, event.touches[0].clientY - startY.current);
    dragYRef.current = next;
    setDragY(next);
  };

  const onTouchEnd = () => {
    if (showFull) return;
    if (dragYRef.current > 88) onClose();
    startY.current = null;
    dragYRef.current = 0;
    setDragY(0);
  };

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label={t("common.close")}
        onClick={onClose}
      />

      <div
        className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] w-full flex-col rounded-t-[28px] border-t border-black/6 bg-yn-card px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-1 text-yn-text shadow-[0_-12px_40px_rgba(31,31,35,0.12)]"
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragY ? "none" : "transform 180ms ease-out",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-items-sheet-title"
        data-testid="my-items-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex touch-none flex-col items-center py-2"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="h-1.5 w-12 rounded-full bg-black/15" />
        </div>

        <div className="mb-4 flex h-12 items-center gap-2">
          <h2 id="my-items-sheet-title" className="min-w-0 flex-1 text-[22px] font-bold tracking-tight text-yn-text">
            {t("settings.myItems")}
          </h2>
          <button
            type="button"
            onClick={() => setShowFull(true)}
            className="flex h-10 items-center text-[14px] font-semibold text-yn-accent active:scale-95"
          >
            {t("settings.more")}
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-yn-muted transition hover:bg-black/5 hover:text-yn-text active:scale-95"
            aria-label={t("common.close")}
          >
            <X size={20} />
          </button>
        </div>

        {count > 0 ? (
          <div className="flex items-center gap-4 rounded-2xl border border-black/6 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(31,31,35,0.06)]">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/12 to-pink-500/12 text-yn-accent">
              <YouNeonBagIcon size={28} />
            </span>
            <div className="min-w-0">
              <p className="text-[28px] font-bold tabular-nums leading-none text-yn-text">{count}</p>
              <p className="mt-1.5 text-[14px] font-medium text-yn-muted">
                {count === 1 ? t("settings.freeUnlockCountOne") : t("settings.freeUnlockCountMany")}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-black/10 bg-yn-bg px-4 py-10 text-center">
            <p className="text-[15px] font-medium text-yn-muted">{t("settings.noBagItems")}</p>
          </div>
        )}

        <button
          type="button"
          onClick={enterShop}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[var(--pink)] text-[16px] font-bold text-white shadow-[0_8px_24px_var(--pink-soft)] transition active:scale-[0.985] active:bg-[var(--pink-pressed)]"
        >
          {t("settings.enterShop")}
        </button>
      </div>

      {showFull ? (
        <div className="absolute inset-0 z-10 flex flex-col bg-yn-bg text-yn-text">
          <header className="flex min-h-12 shrink-0 items-center justify-between border-b border-black/6 px-2 pt-[env(safe-area-inset-top)]">
            <button
              type="button"
              onClick={() => setShowFull(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-yn-text hover:bg-black/5"
              aria-label={t("common.back")}
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-[17px] font-semibold text-yn-text">{t("settings.myItems")}</h2>
            <span className="w-11" />
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-3 pb-[max(24px,env(safe-area-inset-bottom))]">
            <MyItemsInventory username={resolved} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
