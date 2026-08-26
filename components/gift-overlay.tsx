"use client";

import { useEffect, useMemo, useState } from "react";
import { GiftArt, GIFT_ACCENT } from "@/components/icons/gift-art";
import type { GiftSoundId } from "@/lib/gift-sounds";

export type GiftId = GiftSoundId;

export interface CallGift {
  id: GiftId;
  emoji: string;
  label: string;
  tagline: string;
}

export const CALL_GIFTS: CallGift[] = [
  { id: "gift", emoji: "🎁", label: "Awesome", tagline: "Share the vibe" },
  { id: "funny", emoji: "😂", label: "Funny", tagline: "Light up the chat" },
  { id: "bouquet", emoji: "🎈", label: "Friendly", tagline: "Keep it cool" },
  { id: "rabbit", emoji: "🐰", label: "Magic Rabbit", tagline: "Spark some wonder" },
  { id: "diamond", emoji: "💎", label: "WOW", tagline: "Pure reaction" },
  { id: "heart", emoji: "❤️", label: "Charming", tagline: "Win the moment" },
  { id: "rose", emoji: "🌹", label: "Rose", tagline: "Classic & sweet" },
  { id: "naughty", emoji: "😈", label: "Naughty", tagline: "A little trouble" },
  { id: "beautiful", emoji: "✨", label: "Beautiful", tagline: "For the glow" },
  { id: "fire", emoji: "🔥", label: "Fire", tagline: "Turn it up" },
];

const LEGACY_GIFT_IDS: Record<string, GiftId> = {
  cool: "fire",
  teddy: "funny",
};

const EMOJI_TO_ID: Record<string, GiftId> = {
  "🌹": "rose",
  "❤️": "heart",
  "❤": "heart",
  "💐": "bouquet",
  "🎈": "bouquet",
  "💎": "diamond",
  "🎁": "gift",
  "🧸": "funny",
  "😏": "naughty",
  "😈": "naughty",
  "😂": "funny",
  "✨": "beautiful",
  "😍": "beautiful",
  "😎": "fire",
  "🔥": "fire",
  "🐰": "rabbit",
  "🐇": "rabbit",
};

export function resolveGiftId(giftId?: unknown, emoji?: unknown): GiftId | null {
  const raw = String(giftId || "");
  if (LEGACY_GIFT_IDS[raw]) return LEGACY_GIFT_IDS[raw];
  if (CALL_GIFTS.some((g) => g.id === raw)) return raw as GiftId;
  const fromEmoji = EMOJI_TO_ID[String(emoji || "")];
  return fromEmoji || null;
}

function rainParticles(seed: string, count: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return Array.from({ length: count }, (_, i) => {
    h = (Math.imul(1664525, h) + 1013904223) | 0;
    const lane = (i + 0.5) / count;
    const jitter = ((h % 1000) / 1000 - 0.5) * 5.5;
    return {
      i,
      x: 5 + lane * 90 + jitter,
      delay: i * 0.052,
      duration: 2.38 + (Math.abs(h) % 22) / 100,
      drift: ((h % 17) - 8) * 0.28,
      fall: 78 + (Math.abs(h >> 8) % 10),
      size: 22 + (i % 3) * 4,
      rot: (h % 13) - 6,
      rotEnd: ((h >> 4) % 15) - 7,
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
  const [reduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const particles = useMemo(
    () => rainParticles(burstKey, reduceMotion ? 0 : 18),
    [burstKey, reduceMotion]
  );
  const accent = GIFT_ACCENT[giftId];

  useEffect(() => {
    const t = window.setTimeout(onDone, reduceMotion ? 1800 : 3400);
    return () => window.clearTimeout(t);
  }, [burstKey, onDone, reduceMotion]);

  return (
    <div className="yn-gift-burst" key={burstKey} aria-live="polite" aria-label={`${gift.label} sent`}>
      <div
        className="yn-gift-bloom"
        style={{
          background: `radial-gradient(circle, ${accent.a}66 0%, ${accent.b}33 34%, transparent 70%)`,
        }}
      />
      {particles.length > 0 && (
        <div className="yn-gift-rain" aria-hidden="true">
          {particles.map((p) => (
            <span
              key={p.i}
              className="yn-gift-rain-item"
              style={{
                width: p.size,
                height: p.size,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                ["--x" as string]: `${p.x}vw`,
                ["--drift" as string]: `${p.drift}vw`,
                ["--fall" as string]: `${p.fall}vh`,
                ["--rot" as string]: `${p.rot}deg`,
                ["--rot-end" as string]: `${p.rotEnd}deg`,
              }}
            >
              <GiftArt id={giftId} size={p.size} variant="rain" instance={String(p.i)} />
            </span>
          ))}
        </div>
      )}
      <div className="yn-gift-fly">
        <div className="yn-gift-fly-core">
          <GiftArt id={giftId} size={236} variant="burst" />
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
    <>
      <button
        type="button"
        className="yn-gift-scrim"
        aria-label="Close gift picker"
        onClick={onClose}
      />
      <div
        className="yn-gift-panel"
        role="dialog"
        aria-label="Send a gift"
        style={{ bottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="yn-gift-panel-head">
          <p className="yn-gift-panel-title">Send a gift</p>
          <p className="yn-gift-panel-sub">A neon gesture for this moment.</p>
          <button type="button" className="yn-gift-close" onClick={onClose} aria-label="Close gift picker">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="yn-gift-grid">
          {CALL_GIFTS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelect(g)}
              className={`yn-gift-tile${g.id === "rabbit" ? " is-name-wrap" : ""}`}
              data-testid={`gift-${g.id}`}
              aria-label={`Send ${g.label}`}
            >
              <span className="yn-gift-tile-art">
                <GiftArt id={g.id} size={34} variant="pick" instance={`pick-${g.id}`} />
              </span>
              <span className="yn-gift-tile-label">{g.label}</span>
              <span className="yn-gift-tile-tag">{g.tagline}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export function ChatReactionPicker({
  onSelect,
}: {
  onSelect: (gift: CallGift) => void;
}) {
  return (
    <div className="yn-chat-rx-picker" role="listbox" aria-label="Send a reaction">
      {CALL_GIFTS.map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => onSelect(g)}
          className="yn-chat-rx-tile"
          data-testid={`chat-rx-${g.id}`}
          aria-label={`Send ${g.label}`}
        >
          <GiftArt id={g.id} size={28} variant="pick" instance={`chat-${g.id}`} />
        </button>
      ))}
    </div>
  );
}
