import type { ReactNode } from "react";
import type { GiftSoundId } from "@/lib/gift-sounds";

export type GiftArtId = GiftSoundId;

export const GIFT_ACCENT: Record<GiftArtId, { a: string; b: string; c: string }> = {
  gift: { a: "#ff4fd8", b: "#e879f9", c: "#c026d3" },
  funny: { a: "#ff2ec8", b: "#ff8a00", c: "#ffd600" },
  bouquet: { a: "#ff2ec8", b: "#22d3ee", c: "#a855f7" },
  rabbit: { a: "#c084fc", b: "#d946ef", c: "#a855f7" },
  diamond: { a: "#b026ff", b: "#ffd700", c: "#e879f9" },
  heart: { a: "#ff2ec8", b: "#ff4fd8", c: "#fb7185" },
  rose: { a: "#ff1ec8", b: "#5fff3c", c: "#a032ff" },
  naughty: { a: "#ff2ec8", b: "#ff00ff", c: "#e879f9" },
  beautiful: { a: "#ffd700", b: "#ff8a00", c: "#ff2ec8" },
  fire: { a: "#ff007a", b: "#ff8a00", c: "#9d00ff" },
  teddy: { a: "#ff2ec8", b: "#ff8a00", c: "#ffd600" },
  cool: { a: "#ff007a", b: "#ff8a00", c: "#9d00ff" },
};

const VISUAL_ID: Record<GiftArtId, Exclude<GiftArtId, "teddy" | "cool">> = {
  gift: "gift",
  funny: "funny",
  bouquet: "bouquet",
  rabbit: "rabbit",
  diamond: "diamond",
  heart: "heart",
  rose: "rose",
  naughty: "naughty",
  beautiful: "beautiful",
  fire: "fire",
  teddy: "funny",
  cool: "fire",
};

function NeonLayers({
  color,
  glowId,
  stroke,
  core,
  children,
}: {
  color: string;
  glowId: string;
  stroke: number;
  core: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <g
        filter={`url(#${glowId})`}
        fill="none"
        stroke={color}
        strokeWidth={stroke * 2.35}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.52}
      >
        {children}
      </g>
      <g
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
      {core && (
        <g
          fill="none"
          stroke="#fff"
          strokeOpacity={0.48}
          strokeWidth={Math.max(0.5, stroke * 0.34)}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {children}
        </g>
      )}
    </>
  );
}

function GiftBoxMarks() {
  return (
    <>
      <path d="M32 16C24.5 6 15 10 20.5 18.5C24 22 29 19.5 32 16C35 19.5 40 22 43.5 18.5C49 10 39.5 6 32 16Z" />
      <rect x="11" y="21.5" width="42" height="9.5" rx="2.4" />
      <path d="M13.5 32.5H50.5C52.7 32.5 54.5 34.3 54.5 36.5V50.5C54.5 54.2 51.5 57.2 47.8 57.2H16.2C12.5 57.2 9.5 54.2 9.5 50.5V36.5C9.5 34.3 11.3 32.5 13.5 32.5Z" />
      <path d="M32 15.5V57" />
      <path d="M16 34.5L32 47" />
      <path d="M48 34.5L32 47" />
    </>
  );
}

function LaughMarks() {
  return (
    <>
      <circle cx="32" cy="32" r="20" />
      <path d="M18.8 26.2C21.2 21.8 26.6 21.8 29 26.2" />
      <path d="M35 26.2C37.4 21.8 42.8 21.8 45.2 26.2" />
      <path d="M18.5 37.2C18.5 37.2 22.2 34.4 32 34.4C41.8 34.4 45.5 37.2 45.5 37.2C45.5 37.2 43.6 52.4 32 52.4C20.4 52.4 18.5 37.2 18.5 37.2Z" />
      <path d="M25.5 47.6C27.8 50.6 36.2 50.6 38.5 47.6" />
    </>
  );
}

function BalloonMarks({
  cx,
  cy,
  stringX,
}: {
  cx: number;
  cy: number;
  stringX: number;
}) {
  const knotY = cy + 12.2;
  return (
    <>
      <ellipse cx={cx} cy={cy} rx="8.2" ry="11.1" />
      <path d={`M${cx - 3.4} ${cy - 4.6}C${cx - 1.6} ${cy - 7.1} ${cx + 1.1} ${cy - 6.2} ${cx + 1.4} ${cy - 3.8}`} />
      <path d={`M${cx} ${cy + 11.1}L${cx - 1.7} ${knotY}H${cx + 1.7}Z`} />
      <path
        d={`M${cx} ${knotY}C${cx - 3.2} ${knotY + 6} ${stringX + 3} ${knotY + 10} ${stringX} ${knotY + 16}C${stringX - 2.4} ${knotY + 21} ${stringX + 2} ${knotY + 24} ${stringX} 58`}
      />
    </>
  );
}

function RabbitMarks() {
  return (
    <>
      <path d="M19.2 28.5C17.2 12.4 19.6 5.2 24.4 5.2C28.2 5.2 29.6 11.2 29.2 22" />
      <path d="M42.8 28.5C44.8 12.4 42.4 5.2 37.6 5.2C33.8 5.2 32.4 11.2 32.8 22" />
      <path d="M21.6 16.5C20.6 10.4 23.8 7.6 26.4 11.8" />
      <path d="M40.4 16.5C41.4 10.4 38.2 7.6 35.6 11.8" />
      <ellipse cx="31" cy="40.2" rx="14.6" ry="13.6" />
      <path d="M23.4 36.2C24.8 33.6 28.2 33.6 29.4 36.2" />
      <path d="M32.8 36.2C34.2 33.6 37.6 33.6 38.8 36.2" />
      <path d="M24.2 32.4C25.2 30.8 27.6 30.8 28.6 32.4" />
      <path d="M33.6 32.4C34.6 30.8 37 30.8 38 32.4" />
      <path d="M31 41.2L29.2 44.2H32.8Z" />
      <ellipse cx="31" cy="46.8" rx="1.7" ry="2.3" />
      <path d="M20.4 42.6H25.2" />
      <path d="M20.8 45.4H25.4" />
      <path d="M36.8 42.6H41.6" />
      <path d="M36.6 45.4H41.2" />
      <path d="M52 14L54.1 20.2L60.4 22.2L54.1 24.2L52 30.4L49.9 24.2L43.6 22.2L49.9 20.2Z" />
      <circle cx="47.4" cy="16.6" r="0.7" />
      <circle cx="56.8" cy="16.8" r="0.7" />
      <circle cx="56.8" cy="27.6" r="0.7" />
      <circle cx="47.4" cy="27.4" r="0.7" />
    </>
  );
}

function DiamondOutline() {
  return (
    <>
      <path d="M21.5 12H42.5L53.5 28L32 58L10.5 28Z" />
      <path d="M21.5 12L32 28L42.5 12" />
      <path d="M21.5 12L10.5 28H53.5L42.5 12" />
    </>
  );
}

function DiamondGold() {
  return (
    <>
      <path d="M10.5 28H53.5" />
      <path d="M32 28V58" />
      <path d="M10.5 28L32 42L53.5 28" />
      <path d="M21.5 28L32 58" />
      <path d="M42.5 28L32 58" />
    </>
  );
}

function HeartMarks() {
  return (
    <path d="M32 54C32 54 10 37.6 10 22.6C10 14.2 16.8 9.4 24.6 12.8C28.4 14.5 32 20.2 32 20.2C32 20.2 35.6 14.5 39.4 12.8C47.2 9.4 54 14.2 54 22.6C54 37.6 32 54 32 54Z" />
  );
}

function RoseBloom() {
  return (
    <>
      <path d="M32 28.5C24 28.5 18.5 22.5 20.5 16C23 18.5 27 22 32 22C37 22 41 18.5 43.5 16C45.5 22.5 40 28.5 32 28.5Z" />
      <path d="M22 20C16 16 16.5 8.5 23 8C23.5 13 27 17.5 32 18" />
      <path d="M42 20C48 16 47.5 8.5 41 8C40.5 13 37 17.5 32 18" />
      <path d="M32 8.5C28.5 12.5 28 17.5 32 21.5C36 17.5 35.5 12.5 32 8.5Z" />
      <path d="M27.5 24.5C29.5 21.5 34.5 21.5 36.5 24.5" />
    </>
  );
}

function RoseStem() {
  return (
    <>
      <path d="M32 28.5C33.2 38 30.8 48 32.2 58" />
      <path d="M32 41C23 36.5 16.5 40.5 18.5 47.5C22.5 47 28 45.5 32 43" />
      <path d="M32 45C41 40.5 47.5 44.5 45.5 51.5C41.5 51 36 49.5 32 47" />
    </>
  );
}

function RoseVeins() {
  return (
    <>
      <path d="M22 41.5C24.5 43.5 28 44.8 31.2 44" />
      <path d="M42 45.5C39.5 47.5 36 48.8 32.8 48" />
    </>
  );
}

function NaughtyMarks() {
  return (
    <>
      <path d="M16.5 8.5C13.5 4 21 2.2 23.8 11.5C25.2 16 23.2 19 20.8 20" />
      <path d="M47.5 8.5C50.5 4 43 2.2 40.2 11.5C38.8 16 40.8 19 43.2 20" />
      <path d="M20.5 21C14.8 26.5 14.2 42 32 52.5C49.8 42 49.2 26.5 43.5 21C38 16.5 26 16.5 20.5 21Z" />
      <path d="M22.5 31.5L28.5 28.2L27.2 36.2Z" />
      <path d="M36.2 32.4C38.4 30.6 43.6 30.8 45.6 33.2" />
      <path d="M24.5 42C29 47.2 38.5 46.6 42.5 41.2" />
      <path d="M40.8 42.4C44.6 44.8 45.8 49.2 41.6 50.6" />
    </>
  );
}

function Sparkle({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const k = s * 0.2;
  return (
    <path
      d={`M${cx} ${cy - s}C${cx + k} ${cy - k} ${cx + k} ${cy - k} ${cx + s} ${cy}C${cx + k} ${cy + k} ${cx + k} ${cy + k} ${cx} ${cy + s}C${cx - k} ${cy + k} ${cx - k} ${cy + k} ${cx - s} ${cy}C${cx - k} ${cy - k} ${cx - k} ${cy - k} ${cx} ${cy - s}Z`}
    />
  );
}

function BeautifulMarks() {
  return (
    <>
      <Sparkle cx="30" cy="33" s="20" />
      <Sparkle cx="50" cy="14.5" s="7.2" />
      <Sparkle cx="51.5" cy="48" s="6.2" />
    </>
  );
}

function FireMarks() {
  return (
    <>
      <path d="M22.5 52.5C13.5 44 12.5 28.5 21 16C25.5 22.5 30 24.5 35 21C38.5 10.5 45.5 7 51 9.5C53.5 22 54 38 42.5 51C37.5 55 30.5 56 22.5 52.5" />
      <path d="M28 48.5C22.5 42 22 32.5 27.5 24C30 28 33.5 28.5 36 25C38.5 19 43 18.5 45.5 22C46.2 31 44.5 40.5 37.5 47.5C35 49.5 31.5 50 28 48.5" />
    </>
  );
}

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
  const visual = VISUAL_ID[id] || "gift";
  const uid = `yn-ga-${visual}-${variant}-${size}-${instance}`;
  const g = `${uid}-g`;
  const glow = `${uid}-glow`;
  const accent = GIFT_ACCENT[visual];
  const core = variant === "burst";
  const stroke = variant === "pick" ? 1.9 : variant === "rain" ? 1.45 : 1.7;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      overflow="visible"
      className={className ? `yn-gift-art ${className}` : "yn-gift-art"}
    >
      <defs>
        <linearGradient id={g} x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor={accent.a} />
          <stop offset="0.5" stopColor={accent.b} />
          <stop offset="1" stopColor={accent.c} />
        </linearGradient>
        <linearGradient id={`${g}-lr`} x1="12" y1="32" x2="52" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff2ec8" />
          <stop offset="0.45" stopColor="#ff8a00" />
          <stop offset="1" stopColor="#ffd600" />
        </linearGradient>
        <linearGradient id={`${g}-fire`} x1="16" y1="56" x2="52" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff007a" />
          <stop offset="0.32" stopColor="#ff8a00" />
          <stop offset="0.58" stopColor="#ffd600" />
          <stop offset="1" stopColor="#9d00ff" />
        </linearGradient>
        <linearGradient id={`${g}-spark`} x1="14" y1="12" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffd700" />
          <stop offset="0.42" stopColor="#ff8a00" />
          <stop offset="1" stopColor="#ff2ec8" />
        </linearGradient>
        <filter id={glow} x="-55%" y="-55%" width="210%" height="210%">
          <feGaussianBlur stdDeviation={core ? 1.55 : 0.95} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {visual === "gift" && (
        <NeonLayers color={`url(#${g})`} glowId={glow} stroke={stroke} core={core}>
          <GiftBoxMarks />
        </NeonLayers>
      )}

      {visual === "funny" && (
        <NeonLayers color={`url(#${g}-lr)`} glowId={glow} stroke={stroke} core={core}>
          <LaughMarks />
        </NeonLayers>
      )}

      {visual === "bouquet" && (
        <>
          <NeonLayers color="#ff2ec8" glowId={glow} stroke={stroke * 0.92} core={core}>
            <BalloonMarks cx={16.5} cy={24} stringX={18} />
          </NeonLayers>
          <NeonLayers color="#22d3ee" glowId={glow} stroke={stroke * 0.92} core={core}>
            <BalloonMarks cx={32} cy={17.5} stringX={32} />
          </NeonLayers>
          <NeonLayers color="#a855f7" glowId={glow} stroke={stroke * 0.92} core={core}>
            <BalloonMarks cx={47.5} cy={25.5} stringX={46} />
          </NeonLayers>
        </>
      )}

      {visual === "rabbit" && (
        <NeonLayers color={`url(#${g})`} glowId={glow} stroke={stroke} core={core}>
          <RabbitMarks />
        </NeonLayers>
      )}

      {visual === "diamond" && (
        <>
          <NeonLayers color="#b026ff" glowId={glow} stroke={stroke} core={core}>
            <DiamondOutline />
          </NeonLayers>
          <NeonLayers color="#ffd700" glowId={glow} stroke={stroke * 0.92} core={core}>
            <DiamondGold />
          </NeonLayers>
        </>
      )}

      {visual === "heart" && (
        <NeonLayers color={`url(#${g})`} glowId={glow} stroke={stroke} core={core}>
          <HeartMarks />
        </NeonLayers>
      )}

      {visual === "rose" && (
        <>
          <NeonLayers color="#ff1ec8" glowId={glow} stroke={stroke} core={core}>
            <RoseBloom />
          </NeonLayers>
          <NeonLayers color="#5fff3c" glowId={glow} stroke={stroke} core={core}>
            <RoseStem />
          </NeonLayers>
          <NeonLayers color="#a032ff" glowId={glow} stroke={stroke * 0.9} core={core}>
            <RoseVeins />
          </NeonLayers>
        </>
      )}

      {visual === "naughty" && (
        <NeonLayers color="#ff2ec8" glowId={glow} stroke={stroke} core={core}>
          <NaughtyMarks />
        </NeonLayers>
      )}

      {visual === "beautiful" && (
        <NeonLayers color={`url(#${g}-spark)`} glowId={glow} stroke={stroke} core={core}>
          <BeautifulMarks />
        </NeonLayers>
      )}

      {visual === "fire" && (
        <NeonLayers color={`url(#${g}-fire)`} glowId={glow} stroke={stroke} core={core}>
          <FireMarks />
        </NeonLayers>
      )}
    </svg>
  );
}
