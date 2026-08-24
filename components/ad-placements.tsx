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
    <div className="flex-shrink-0 rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">Sponsored</p>
      <p className="mt-0.5 text-[13px] font-semibold text-white/90">{ad.title}</p>
      <p className="text-[11px] leading-snug text-white/50">{ad.body}</p>
      {onSubscribe && (
        <button
          type="button"
          onClick={onSubscribe}
          className="mt-1.5 text-[11px] font-semibold text-pink-300 hover:text-pink-200"
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#16101f] p-5 text-white shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Sponsored</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-lg font-semibold">{ad.title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-white/60">{ad.body}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-11 flex-1 rounded-xl border border-white/12 text-[15px] font-semibold text-white/75"
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
              className="h-11 flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-[15px] font-semibold text-white"
            >
              See Premium
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
