import type { GiftSoundId } from "@/lib/gift-sounds";

export type GiftArtId = GiftSoundId;

export const GIFT_ACCENT: Record<GiftArtId, { a: string; b: string; c: string }> = {
  rose: { a: "#fb7185", b: "#e879f9", c: "#a855f7" },
  heart: { a: "#fb7185", b: "#f472b6", c: "#ec4899" },
  bouquet: { a: "#c084fc", b: "#f472b6", c: "#818cf8" },
  diamond: { a: "#67e8f9", b: "#c4b5fd", c: "#e0e7ff" },
  gift: { a: "#f9a8d4", b: "#a855f7", c: "#ec4899" },
  teddy: { a: "#e9d5ff", b: "#d8b4fe", c: "#f5d0fe" },
  naughty: { a: "#f43f5e", b: "#e11d48", c: "#a21caf" },
  funny: { a: "#fbbf24", b: "#f472b6", c: "#a855f7" },
  beautiful: { a: "#fde68a", b: "#f9a8d4", c: "#c4b5fd" },
  cool: { a: "#818cf8", b: "#c084fc", c: "#22d3ee" },
  fire: { a: "#fb923c", b: "#f43f5e", c: "#fbbf24" },
  rabbit: { a: "#f9a8d4", b: "#e879f9", c: "#c084fc" },
};

export function GiftArt({
  id,
  size = 56,
  variant = "pick",
  instance = "0",
  className,
}: {
  id: GiftArtId;
  size?: number;
  variant?: "pick" | "burst" | "rain";
  instance?: string;
  className?: string;
}) {
  const uid = `yn-ga-${id}-${variant}-${size}-${instance}`;
  const g = `${uid}-g`;
  const glow = `${uid}-glow`;
  const accent = GIFT_ACCENT[id];
  const withGlow = variant === "burst";
  const stroke = variant === "pick" ? 1.85 : 1.55;

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className={className ? `yn-gift-art ${className}` : "yn-gift-art"}>
      <defs>
        <linearGradient id={g} x1="12" y1="6" x2="54" y2="58">
          <stop stopColor={accent.a} />
          <stop offset="0.5" stopColor={accent.b} />
          <stop offset="1" stopColor={accent.c} />
        </linearGradient>
        <radialGradient id={`${g}-fill`} cx="38%" cy="28%" r="70%">
          <stop stopColor="#fff" stopOpacity="0.62" />
          <stop offset="0.28" stopColor={accent.a} stopOpacity="0.98" />
          <stop offset="1" stopColor={accent.c} />
        </radialGradient>
        {withGlow && (
          <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.15" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {id === "rose" && (
        <g filter={withGlow ? `url(#${glow})` : undefined} fill="none" stroke={`url(#${g})`} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 58c0-8 .4-16 .6-22" />
          <path d="M32 44c-7-1.5-11-7-6.5-9.5 2.2 2.4 5 5.2 6.5 9.5z" fill={`url(#${g}-fill)`} stroke="none" />
          <path d="M32 44c7-1.5 11-7 6.5-9.5-2.2 2.4-5 5.2-6.5 9.5z" fill={`url(#${g}-fill)`} stroke="none" />
          <path d="M32 36c-8.5-1-13.5-9-8-14 4 2 7.2 7 8 14z" fill={`url(#${g}-fill)`} />
          <path d="M32 36c8.5-1 13.5-9 8-14-4 2-7.2 7-8 14z" fill={`url(#${g}-fill)`} />
          <ellipse cx="32" cy="20" rx="9.5" ry="11" fill={`url(#${g}-fill)`} />
          <path d="M32 12c-3.2 4-3.4 8.5 0 12 3.2-4 3.4-8.5 0-12z" fill="#fff" fillOpacity="0.32" stroke="none" />
          <circle cx="32" cy="21" r="2.2" fill="#fff" fillOpacity="0.5" stroke="none" />
        </g>
      )}

      {id === "heart" && (
        <g filter={withGlow ? `url(#${glow})` : undefined}>
          <path
            d="M32 54C32 54 8.5 37.2 8.5 22.4 8.5 13.6 16.2 9 24.6 12.8 28.4 14.6 32 20.2 32 20.2s3.6-5.6 7.4-7.4C47.8 9 55.5 13.6 55.5 22.4 55.5 37.2 32 54 32 54z"
            fill={`url(#${g}-fill)`}
            stroke={`url(#${g})`}
            strokeWidth={stroke}
          />
          <path d="M22 22c2.5-6 8-7 10-2" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {id === "bouquet" && (
        <g filter={withGlow ? `url(#${glow})` : undefined} fill="none" stroke={`url(#${g})`} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 38c-6.2-1.2-10-8.2-7.4-14.4C17.2 17.4 24 16 26.8 21.6 29 26.4 26.6 34.2 22 38z" fill={`url(#${g}-fill)`} />
          <path d="M32 14c-6.4 0-10.6 7.6-7.2 14.2C28.2 35 36 36.2 39 30.2 41.6 24.8 38.4 14 32 14z" fill={`url(#${g}-fill)`} />
          <path d="M44 38c6.2-1.2 10-8.2 7.4-14.4C48.8 17.4 42 16 39.2 21.6 37 26.4 39.4 34.2 44 38z" fill={`url(#${g}-fill)`} />
          <path d="M22 38c2.4 6 6.6 12.5 10 18" />
          <path d="M32 28.5V56" />
          <path d="M44 38c-2.4 6-6.6 12.5-10 18" />
          <circle cx="24" cy="24" r="1.5" fill="#fff" fillOpacity="0.55" stroke="none" />
          <circle cx="30" cy="18" r="1.7" fill="#fff" fillOpacity="0.62" stroke="none" />
          <circle cx="42" cy="24" r="1.5" fill="#fff" fillOpacity="0.55" stroke="none" />
        </g>
      )}

      {id === "diamond" && (
        <g filter={withGlow ? `url(#${glow})` : undefined} stroke={`url(#${g})`} strokeWidth={stroke} strokeLinejoin="round">
          <polygon points="32,6 54,24 32,58 10,24" fill={`url(#${g}-fill)`} />
          <polygon points="10,24 22,10 32,6 42,10 54,24 32,24" fill="#fff" fillOpacity="0.28" />
          <polyline points="10,24 32,24 54,24" fill="none" />
          <polyline points="22,10 32,24 42,10" fill="none" />
          <polyline points="32,24 32,58" fill="none" />
          <path d="M18 20l6-10M46 20l-6-10" stroke="#fff" strokeOpacity="0.62" strokeWidth="1.2" />
        </g>
      )}

      {id === "gift" && (
        <g filter={withGlow ? `url(#${glow})` : undefined}>
          <rect x="12" y="28" width="40" height="26" rx="4" fill={`url(#${g}-fill)`} stroke={`url(#${g})`} strokeWidth={stroke} />
          <rect x="10" y="20" width="44" height="10" rx="3" fill={`url(#${g})`} />
          <rect x="29" y="20" width="6" height="34" fill="#fff" fillOpacity="0.34" />
          <path d="M32 20c-5.5-8-13-7-13-2 0 4 7 6 13 8 6-2 13-4 13-8 0-5-7.5-6-13 2z" fill={`url(#${g}-fill)`} stroke={`url(#${g})`} strokeWidth="1.35" />
          <circle cx="32" cy="20" r="2.4" fill="#fff" fillOpacity="0.78" />
        </g>
      )}

      {id === "teddy" && (
        <g filter={withGlow ? `url(#${glow})` : undefined} fill={`url(#${g}-fill)`} stroke={`url(#${g})`} strokeWidth={stroke}>
          <circle cx="18" cy="18" r="8" />
          <circle cx="46" cy="18" r="8" />
          <circle cx="18" cy="18" r="4.2" fill="#fff" fillOpacity="0.28" stroke="none" />
          <circle cx="46" cy="18" r="4.2" fill="#fff" fillOpacity="0.28" stroke="none" />
          <circle cx="32" cy="28" r="14.5" />
          <ellipse cx="32" cy="48" rx="13" ry="10" />
          <ellipse cx="32" cy="32" rx="7" ry="5.5" fill="#fff" fillOpacity="0.28" stroke="none" />
          <circle cx="26.5" cy="26" r="1.85" fill="#2e1064" stroke="none" />
          <circle cx="37.5" cy="26" r="1.85" fill="#2e1064" stroke="none" />
          <ellipse cx="32" cy="31.5" rx="2.2" ry="1.6" fill="#2e1064" stroke="none" />
        </g>
      )}

      {id === "naughty" && (
        <g filter={withGlow ? `url(#${glow})` : undefined}>
          <path d="M18 22c-1.5-11 8.5-15 13-7" fill="none" stroke={`url(#${g})`} strokeWidth={stroke} strokeLinecap="round" />
          <path d="M46 22c1.5-11-8.5-15-13-7" fill="none" stroke={`url(#${g})`} strokeWidth={stroke} strokeLinecap="round" />
          <path d="M20 16c-1-6 4-9 7-4M44 16c1-6-4-9-7-4" fill={`url(#${g}-fill)`} stroke={`url(#${g})`} strokeWidth="1.3" />
          <circle cx="32" cy="36" r="16.5" fill={`url(#${g}-fill)`} stroke={`url(#${g})`} strokeWidth={stroke} />
          <path d="M22.5 33c2.6 1.2 5.4 1.1 7.2-1.2" fill="none" stroke="#2e1064" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="40.2" cy="32.4" r="2.05" fill="#2e1064" />
          <circle cx="40.8" cy="31.7" r="0.7" fill="#fff" />
          <path d="M24.5 42.5c3.6 4.6 11.4 4.8 15.2.4" fill="none" stroke="#2e1064" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="44.5" cy="40.5" r="2.1" fill="#fb7185" opacity="0.85" />
        </g>
      )}

      {id === "funny" && (
        <g filter={withGlow ? `url(#${glow})` : undefined}>
          <circle cx="32" cy="32" r="20" fill={`url(#${g}-fill)`} stroke={`url(#${g})`} strokeWidth={stroke} />
          <path d="M21 28c2.2-3.4 6-3.6 8.2 0" fill="none" stroke="#2e1064" strokeWidth="2" strokeLinecap="round" />
          <path d="M35 28c2.2-3.4 6-3.6 8.2 0" fill="none" stroke="#2e1064" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 36.5c4.8 9.5 19.2 9.5 24 0" fill="#2e1064" />
          <path d="M22.5 36.8c4 6.6 15 6.6 19 0" fill="#fff" fillOpacity="0.88" />
          <circle cx="47.5" cy="38" r="3.1" fill={`url(#${g})`} opacity="0.9" />
          <circle cx="47.5" cy="38" r="1.5" fill="#fff" fillOpacity="0.55" />
        </g>
      )}

      {id === "beautiful" && (
        <g filter={withGlow ? `url(#${glow})` : undefined}>
          <path
            d="M32 8l3.2 12.2L48 18l-9.4 8.2 8.2 9.4-12.2-3.2L32 56l-2.6-13.6L17.2 45.6l8.2-9.4L16 18l12.8 2.2z"
            fill={`url(#${g}-fill)`}
            stroke={`url(#${g})`}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          <circle cx="32" cy="32" r="7.2" fill={`url(#${g})`} />
          <circle cx="32" cy="32" r="3.1" fill="#fff" fillOpacity="0.72" />
          <path d="M32 10v6M32 48v6M12 32h6M46 32h6" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )}

      {id === "cool" && (
        <g filter={withGlow ? `url(#${glow})` : undefined}>
          <circle cx="32" cy="33" r="19" fill={`url(#${g}-fill)`} stroke={`url(#${g})`} strokeWidth={stroke} />
          <path d="M14 30.5h36" stroke={`url(#${g})`} strokeWidth="2.4" strokeLinecap="round" />
          <rect x="16.5" y="26.5" width="13.5" height="9.5" rx="4.2" fill="#2e1064" />
          <rect x="34" y="26.5" width="13.5" height="9.5" rx="4.2" fill="#2e1064" />
          <path d="M30 31h4" stroke="#2e1064" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M19.2 29.4h8.2" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M36.6 29.4h8.2" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M24 42.5c3.4 3.2 12.6 3.2 16 0" fill="none" stroke="#2e1064" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {id === "fire" && (
        <g filter={withGlow ? `url(#${glow})` : undefined} fill="none" stroke={`url(#${g})`} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M32 58c-11.4 0-18.6-9.2-18.6-20.2 0-7.6 4.2-13.6 8.8-19.4 1.6 5.2 4.6 8.4 8.2 9.2-1.2-7.8 1.4-14.6 7.6-19.6 1.8 6.4 5.8 10.6 10.8 12.2 2.8 5.6 3.8 11.2 3.8 17.6C52.6 48.4 45.2 58 32 58z"
            fill={`url(#${g}-fill)`}
          />
          <path d="M32 50c-6.2 0-10-5-10-11.2 0-4.2 2.2-7.6 4.8-10.8 1 3 2.8 4.8 5.2 5.2-.4-4.4 1.4-8.2 5.2-11 1.2 3.6 3.4 6 6.2 7 1.4 3.2 2 6.2 2 9.6 0 6.4-4.2 11.2-13.4 11.2z" fill="#fff" fillOpacity="0.22" />
          <path d="M32 44c-3.4 0-5.6-2.8-5.6-6.2 0-2.4 1.2-4.4 2.6-6.2.6 1.8 1.6 2.8 3 3-.2-2.6 1-4.8 3.2-6.4.8 2.2 2.2 3.6 3.8 4.2.8 1.8 1.2 3.4 1.2 5.2 0 3.6-2.4 6.4-8.2 6.4z" fill="#fff" fillOpacity="0.4" stroke="none" />
        </g>
      )}

      {id === "rabbit" && (
        <g filter={withGlow ? `url(#${glow})` : undefined} fill="none" stroke={`url(#${g})`} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 28c-2.4-14 2.2-22.5 7.2-22.5 3.2 0 5.2 4.8 4.4 14.2" />
          <path d="M46 28c2.4-14-2.2-22.5-7.2-22.5-3.2 0-5.2 4.8-4.4 14.2" />
          <path d="M20.4 16c-1.2-6.5 2.6-10 5-6.2M43.6 16c1.2-6.5-2.6-10-5-6.2" fill={`url(#${g}-fill)`} />
          <circle cx="32" cy="36" r="16" fill={`url(#${g}-fill)`} />
          <circle cx="25.6" cy="33.4" r="2.1" fill="#2e1064" stroke="none" />
          <circle cx="38.4" cy="33.4" r="2.1" fill="#2e1064" stroke="none" />
          <circle cx="26.2" cy="32.7" r="0.7" fill="#fff" stroke="none" />
          <circle cx="39" cy="32.7" r="0.7" fill="#fff" stroke="none" />
          <ellipse cx="32" cy="38.4" rx="2.4" ry="1.7" fill="#2e1064" stroke="none" />
          <path d="M27.2 43.2c1.8 2.4 7.8 2.4 9.6 0" stroke="#2e1064" strokeWidth="1.6" />
          <path d="M48 22.5l4.2-4.2M50.6 24.8l3.4.2M50.2 20.2l1.8-3" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
}
