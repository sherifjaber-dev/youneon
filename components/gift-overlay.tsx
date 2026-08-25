"use client";

import { useEffect, useMemo } from "react";
import type { GiftSoundId } from "@/lib/gift-sounds";

export type GiftId = GiftSoundId;

export interface CallGift {
  id: GiftId;
  emoji: string;
  label: string;
  tagline: string;
}

export const CALL_GIFTS: CallGift[] = [
  { id: "rose", emoji: "🌹", label: "Rose", tagline: "A velvet bloom" },
  { id: "heart", emoji: "❤️", label: "Heart", tagline: "A quiet spark" },
  { id: "bouquet", emoji: "💐", label: "Bouquet", tagline: "A full flourish" },
  { id: "diamond", emoji: "💎", label: "Diamond", tagline: "Cut to catch light" },
  { id: "gift", emoji: "🎁", label: "Gift", tagline: "Wrapped in neon" },
  { id: "teddy", emoji: "🧸", label: "Teddy", tagline: "Soft and lasting" },
];

const EMOJI_TO_ID: Record<string, GiftId> = {
  "🌹": "rose",
  "❤️": "heart",
  "❤": "heart",
  "💐": "bouquet",
  "💎": "diamond",
  "🎁": "gift",
  "🧸": "teddy",
};

const ACCENT: Record<GiftId, { a: string; b: string; c: string }> = {
  rose: { a: "#fb7185", b: "#e879f9", c: "#a855f7" },
  heart: { a: "#fb7185", b: "#f472b6", c: "#ec4899" },
  bouquet: { a: "#f0abfc", b: "#c084fc", c: "#818cf8" },
  diamond: { a: "#e0e7ff", b: "#c4b5fd", c: "#f5d0fe" },
  gift: { a: "#f9a8d4", b: "#a855f7", c: "#ec4899" },
  teddy: { a: "#e9d5ff", b: "#d8b4fe", c: "#f5d0fe" },
};

export function resolveGiftId(giftId?: unknown, emoji?: unknown): GiftId | null {
  const id = String(giftId || "");
  if (CALL_GIFTS.some((g) => g.id === id)) return id as GiftId;
  const fromEmoji = EMOJI_TO_ID[String(emoji || "")];
  return fromEmoji || null;
}

function GiftArt({ id, size = 56, variant = "pick" }: { id: GiftId; size?: number; variant?: "pick" | "burst" }) {
  const uid = `yn-ga-${id}-${variant}-${size}`;
  const g = `${uid}-g`;
  const glow = `${uid}-glow`;
  const accent = ACCENT[id];

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="yn-gift-art">
      <defs>
        <linearGradient id={g} x1="12" y1="6" x2="54" y2="58">
          <stop stopColor={accent.a} />
          <stop offset="0.5" stopColor={accent.b} />
          <stop offset="1" stopColor={accent.c} />
        </linearGradient>
        <radialGradient id={`${g}-fill`} cx="38%" cy="28%" r="70%">
          <stop stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.28" stopColor={accent.a} stopOpacity="0.95" />
          <stop offset="1" stopColor={accent.c} />
        </radialGradient>
        <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.15" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {id === "rose" && (
        <g filter={`url(#${glow})`} fill="none" stroke={`url(#${g})`} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 58c0-8 .4-16 .6-22" />
          <path d="M32 44c-7-1.5-11-7-6.5-9.5 2.2 2.4 5 5.2 6.5 9.5z" fill={`url(#${g}-fill)`} stroke="none" opacity="0.85" />
          <path d="M32 44c7-1.5 11-7 6.5-9.5-2.2 2.4-5 5.2-6.5 9.5z" fill={`url(#${g}-fill)`} stroke="none" opacity="0.85" />
          <path d="M32 36c-8.5-1-13.5-9-8-14 4 2 7.2 7 8 14z" fill={`url(#${g}-fill)`} opacity="0.9" />
          <path d="M32 36c8.5-1 13.5-9 8-14-4 2-7.2 7-8 14z" fill={`url(#${g}-fill)`} opacity="0.9" />
          <ellipse cx="32" cy="20" rx="9.5" ry="11" fill={`url(#${g}-fill)`} />
          <path d="M32 12c-3.2 4-3.4 8.5 0 12 3.2-4 3.4-8.5 0-12z" fill="#fff" fillOpacity="0.28" stroke="none" />
          <circle cx="32" cy="21" r="2.2" fill="#fff" fillOpacity="0.45" stroke="none" />
        </g>
      )}

      {id === "heart" && (
        <g filter={`url(#${glow})`}>
          <path
            d="M32 54C32 54 8.5 37.2 8.5 22.4 8.5 13.6 16.2 9 24.6 12.8 28.4 14.6 32 20.2 32 20.2s3.6-5.6 7.4-7.4C47.8 9 55.5 13.6 55.5 22.4 55.5 37.2 32 54 32 54z"
            fill={`url(#${g}-fill)`}
            stroke={`url(#${g})`}
            strokeWidth="1.2"
          />
          <path d="M22 22c2.5-6 8-7 10-2" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}

      {id === "bouquet" && (
        <g filter={`url(#${glow})`}>
          <path d="M32 58c-1-8 0-16 0-22" fill="none" stroke={`url(#${g})`} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M32 42c-8 2-12 8-10 12 4-1 8-6 10-12z" fill={`url(#${g})`} opacity="0.35" />
          <path d="M32 42c8 2 12 8 10 12-4-1-8-6-10-12z" fill={`url(#${g})`} opacity="0.35" />
          <ellipse cx="22" cy="22" rx="8" ry="9.5" fill={`url(#${g}-fill)`} />
          <ellipse cx="42" cy="22" rx="8" ry="9.5" fill={`url(#${g}-fill)`} />
          <ellipse cx="32" cy="16" rx="8.5" ry="10" fill={`url(#${g}-fill)`} />
          <circle cx="32" cy="16" r="2" fill="#fff" fillOpacity="0.5" />
          <circle cx="22" cy="22" r="1.6" fill="#fff" fillOpacity="0.4" />
          <circle cx="42" cy="22" r="1.6" fill="#fff" fillOpacity="0.4" />
        </g>
      )}

      {id === "diamond" && (
        <g filter={`url(#${glow})`} stroke={`url(#${g})`} strokeWidth="1.35" strokeLinejoin="round">
          <polygon points="32,6 54,24 32,58 10,24" fill={`url(#${g}-fill)`} />
          <polygon points="10,24 22,10 32,6 42,10 54,24 32,24" fill="#fff" fillOpacity="0.22" />
          <polyline points="10,24 32,24 54,24" fill="none" />
          <polyline points="22,10 32,24 42,10" fill="none" />
          <polyline points="32,24 32,58" fill="none" />
          <path d="M18 20l6-10M46 20l-6-10" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.1" />
        </g>
      )}

      {id === "gift" && (
        <g filter={`url(#${glow})`}>
          <rect x="12" y="28" width="40" height="26" rx="4" fill={`url(#${g}-fill)`} stroke={`url(#${g})`} strokeWidth="1.3" />
          <rect x="10" y="20" width="44" height="10" rx="3" fill={`url(#${g})`} opacity="0.95" />
          <rect x="29" y="20" width="6" height="34" fill="#fff" fillOpacity="0.28" />
          <path d="M32 20c-5.5-8-13-7-13-2 0 4 7 6 13 8 6-2 13-4 13-8 0-5-7.5-6-13 2z" fill={`url(#${g}-fill)`} stroke={`url(#${g})`} strokeWidth="1.2" />
          <circle cx="32" cy="20" r="2.4" fill="#fff" fillOpacity="0.7" />
        </g>
      )}

      {id === "teddy" && (
        <g filter={`url(#${glow})`} fill={`url(#${g}-fill)`} stroke={`url(#${g})`} strokeWidth="1.35">
          <circle cx="18" cy="18" r="8" />
          <circle cx="46" cy="18" r="8" />
          <circle cx="18" cy="18" r="4.2" fill="#fff" fillOpacity="0.22" stroke="none" />
          <circle cx="46" cy="18" r="4.2" fill="#fff" fillOpacity="0.22" stroke="none" />
          <circle cx="32" cy="28" r="14.5" />
          <ellipse cx="32" cy="48" rx="13" ry="10" />
          <ellipse cx="32" cy="32" rx="7" ry="5.5" fill="#fff" fillOpacity="0.2" stroke="none" />
          <circle cx="26.5" cy="26" r="1.7" fill="#2e1064" stroke="none" />
          <circle cx="37.5" cy="26" r="1.7" fill="#2e1064" stroke="none" />
          <ellipse cx="32" cy="31.5" rx="2.2" ry="1.6" fill="#2e1064" stroke="none" />
        </g>
      )}
    </svg>
  );
}

function burstParticles(seed: string, giftId: GiftId) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const accent = ACCENT[giftId];
  const colors = [accent.a, accent.b, accent.c, "#ffffff"];
  return Array.from({ length: 20 }, (_, i) => {
    h = (Math.imul(1664525, h) + 1013904223) | 0;
    const angle = (i / 20) * Math.PI * 2 + (h % 100) / 220;
    const dist = 88 + (Math.abs(h) % 70);
    return {
      i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      delay: (i % 7) * 0.05,
      size: 3 + (i % 4),
      color: colors[i % colors.length],
    };
  });
}

export function GiftBurstOverlay({
  giftId,
  burstKey,
  onDone,
}: {
  giftId: GiftId;
  burstKey: string;
  onDone: () => void;
}) {
  const gift = CALL_GIFTS.find((g) => g.id === giftId) || CALL_GIFTS[0];
  const particles = useMemo(() => burstParticles(burstKey, giftId), [burstKey, giftId]);
  const accent = ACCENT[giftId];

  useEffect(() => {
    const t = window.setTimeout(onDone, 2300);
    return () => window.clearTimeout(t);
  }, [burstKey, onDone]);

  return (
    <div className="yn-gift-burst" key={burstKey} aria-live="polite" aria-label={`${gift.label} sent`}>
      <div
        className="yn-gift-bloom"
        style={{
          background: `radial-gradient(circle, ${accent.a}66 0%, ${accent.b}33 32%, transparent 68%)`,
        }}
      />
      {particles.map((p) => (
        <span
          key={p.i}
          className="yn-gift-particle"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 10px ${p.color}`,
            animationDelay: `${p.delay}s`,
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
          }}
        />
      ))}
      <div className="yn-gift-fly">
        <div className="yn-gift-fly-core">
          <GiftArt id={giftId} size={152} variant="burst" />
        </div>
        <p className="yn-gift-fly-label">{gift.label}</p>
      </div>
    </div>
  );
}

export function GiftPickerPanel({
  onSelect,
  onClose,
}: {
  onSelect: (gift: CallGift) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="yn-gift-panel"
      role="dialog"
      aria-label="Send a gift"
      style={{ bottom: "calc(76px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="yn-gift-panel-head">
        <div>
          <p className="yn-gift-panel-title">Send a gift</p>
          <p className="yn-gift-panel-sub">A neon gesture for this moment</p>
        </div>
        <button type="button" className="yn-gift-close" onClick={onClose} aria-label="Close gift picker">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="yn-gift-grid">
        {CALL_GIFTS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelect(g)}
            className="yn-gift-tile"
            data-testid={`gift-${g.id}`}
            aria-label={`Send ${g.label}`}
          >
            <span className="yn-gift-tile-art">
              <GiftArt id={g.id} size={52} variant="pick" />
            </span>
            <span className="yn-gift-tile-label">{g.label}</span>
            <span className="yn-gift-tile-tag">{g.tagline}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
