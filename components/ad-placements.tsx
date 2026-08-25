"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Announcement } from "@/lib/announcements";

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

export function AdInterstitial({ ads, onSubscribe }: AdInterstitialProps) {
  const [open, setOpen] = useState(false);
  const ad = useMemo(() => pickAd(ads), [ads]);

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[#a855f7]/40 bg-[#0c0616] p-5 text-white shadow-[0_0_28px_rgba(168,85,247,0.28)]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f5d76e]">Sponsored</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 text-[#b9a8c9] hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-lg font-semibold text-white">{ad.title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#b9a8c9]">{ad.body}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-11 flex-1 rounded-xl border border-white/12 text-[15px] font-semibold text-[#c4b5d8]"
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
              className="yn-gold-cta h-12 flex-1 text-[16px] font-bold text-[#1a1408]"
            >
              See Premium
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
