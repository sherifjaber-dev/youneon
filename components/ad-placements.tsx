"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown, X } from "lucide-react";
import type { Announcement } from "@/lib/announcements";
import { PremiumGem } from "@/components/premium-gem";
import { GoldSparkle } from "@/components/icons/youneon-chrome-icons";

const INTERSTITIAL_KEY = "youneon_ad_interstitial_at";
const INTERSTITIAL_INTERVAL_MS = 12 * 60 * 1000;

const FALLBACK_AD: Pick<Announcement, "title" | "body"> = {
  title: "YouNeon Premium",
  body: "Go ad-free, unlock unlimited chats, and get 1,000 Neon — 5 π for 30 days.",
};

function pickAd(ads: Announcement[]): Pick<Announcement, "title" | "body"> {
  const active = ads.filter((item) => item.active);
  if (active.length === 0) return FALLBACK_AD;
  return active[0];
}

type AdBannerProps = {
  ads: Announcement[];
  onSubscribe?: () => void;
};

export function AdBanner({ ads, onSubscribe }: AdBannerProps) {
  const ad = useMemo(() => pickAd(ads), [ads]);

  return (
    <div className="flex-shrink-0 rounded-xl border border-black/6 bg-yn-card px-3 py-2 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-yn-muted">Sponsored</p>
      <p className="mt-0.5 text-[13px] font-semibold text-yn-text">{ad.title}</p>
      <p className="text-[11px] leading-snug text-yn-muted">{ad.body}</p>
      {onSubscribe && (
        <button
          type="button"
          onClick={onSubscribe}
          className="yn-gold-cta mt-2 inline-flex h-10 items-center justify-center px-4 text-[13px] font-bold text-[#1a1408]"
        >
          See Premium
        </button>
      )}
    </div>
  );
}

type AdInterstitialProps = {
  ads: Announcement[];
  onSubscribe?: () => void;
};

export function AdInterstitial({ ads: _ads, onSubscribe }: AdInterstitialProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let shownThisSession = false;
    try {
      shownThisSession = sessionStorage.getItem("youneon_ad_interstitial_session") === "1";
    } catch {
      /* ignore */
    }
    const lastRaw = Number(localStorage.getItem(INTERSTITIAL_KEY) || "0");
    const due = !Number.isFinite(lastRaw) || Date.now() - lastRaw >= INTERSTITIAL_INTERVAL_MS;
    if (shownThisSession || !due) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
      try {
        sessionStorage.setItem("youneon_ad_interstitial_session", "1");
        localStorage.setItem(INTERSTITIAL_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    }, 1800);

    return () => window.clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <div className="yn-premium-interstitial fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="yn-premium-interstitial-card w-full max-w-[340px] text-center text-white">
        <div className="mb-1 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f5d76e] drop-shadow-[0_0_8px_rgba(245,215,110,0.7)]">
            <GoldSparkle size={9} className="text-[#f5d76e] drop-shadow-[0_0_6px_rgba(245,215,110,0.9)]" />
            Sponsored
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center text-[#f5d76e] drop-shadow-[0_0_8px_rgba(245,215,110,0.7)] active:scale-95"
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        <PremiumGem className="mx-auto mt-1 h-[84px] w-[74px]" />

        <h2 className="yn-premium-interstitial-title mt-1">YouNeon Premium</h2>
        <GoldSparkle size={11} className="mx-auto mt-2 block text-[#f5d76e] drop-shadow-[0_0_8px_rgba(245,215,110,0.9)]" />

        <p className="mt-3 text-[14px] leading-relaxed text-white">
          Go ad-free, unlock unlimited chats, and get{" "}
          <span className="yn-premium-hl-neon">1,000 Neon</span>
          {" — "}
          <span className="yn-premium-hl-gold">5 π</span>
          {" for 30 days."}
        </p>

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="yn-premium-notnow flex-1 active:scale-[0.98]"
          >
            Not now
          </button>
          {onSubscribe && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSubscribe();
              }}
              className="yn-premium-seecta flex flex-1 items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Crown size={15} strokeWidth={2.3} className="text-[#1a1408]" />
              See Premium
            </button>
          )}
        </div>

        <Crown
          size={20}
          strokeWidth={1.6}
          className="yn-premium-interstitial-crown"
          fill="none"
          aria-hidden
        />
      </div>
    </div>
  );
}
