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
  fire: { a: "#ff8a00", b: "#ff2ec8", c: "#9d00ff" },
  teddy: { a: "#ff2ec8", b: "#ff8a00", c: "#ffd600" },
  cool: { a: "#ff8a00", b: "#ff2ec8", c: "#9d00ff" },
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

/** Awesome — gift box with bow, lid, ribbon, and wrap folds. */
function GiftBoxMarks() {
  return (
    <>
      <path d="M32 15.2C25.2 6.4 16.2 9.8 21.4 18.2C24.6 21.4 29.2 19.4 32 15.2C34.8 19.4 39.4 21.4 42.6 18.2C47.8 9.8 38.8 6.4 32 15.2Z" />
      <rect x="10.5" y="21.2" width="43" height="9.2" rx="2.2" />
      <path d="M13.2 31.8H50.8C52.9 31.8 54.6 33.5 54.6 35.6V50.4C54.6 53.8 51.8 56.6 48.4 56.6H15.6C12.2 56.6 9.4 53.8 9.4 50.4V35.6C9.4 33.5 11.1 31.8 13.2 31.8Z" />
      <path d="M32 14.8V56.6" />
      <path d="M15.8 33.6L32 45.8" />
      <path d="M48.2 33.6L32 45.8" />
    </>
  );
}

/** Funny — circular laugh face, squinting eyes, open mouth. */
function LaughMarks() {
  return (
    <>
      <circle cx="32" cy="32" r="19.4" />
      <path d="M19.6 27.4C21.8 22.6 27.4 22.6 29.6 27.4" />
      <path d="M34.4 27.4C36.6 22.6 42.2 22.6 44.4 27.4" />
      <path d="M19.2 36.8C19.2 36.8 22.6 34.2 32 34.2C41.4 34.2 44.8 36.8 44.8 36.8C44.8 36.8 43.2 51.6 32 51.6C20.8 51.6 19.2 36.8 19.2 36.8Z" />
      <path d="M25.8 47.4C28.2 50.2 35.8 50.2 38.2 47.4" />
    </>
  );
}

/** Friendly — three oval balloons with knots, highlights, and wavy strings. */
function BalloonMarks({
  cx,
  cy,
  stringX,
}: {
  cx: number;
  cy: number;
  stringX: number;
}) {
  const knotY = cy + 12.4;
  return (
    <>
      <ellipse cx={cx} cy={cy} rx="8" ry="10.8" />
      <path d={`M${cx - 3.2} ${cy - 4.4}C${cx - 1.5} ${cy - 6.8} ${cx + 1} ${cy - 6} ${cx + 1.3} ${cy - 3.6}`} />
      <path d={`M${cx - 1.5} ${cy - 1.8}C${cx - 0.4} ${cy - 3.4} ${cx + 1.2} ${cy - 2.8} ${cx + 1.3} ${cy - 1.2}`} />
      <path d={`M${cx} ${cy + 10.8}L${cx - 1.45} ${knotY}H${cx + 1.45}Z`} />
      <path
        d={`M${cx} ${knotY}C${cx - 3.4} ${knotY + 5.5} ${stringX + 3.2} ${knotY + 10} ${stringX} ${knotY + 15.5}C${stringX - 2.6} ${knotY + 20.5} ${stringX + 2.4} ${knotY + 24.5} ${stringX} 58`}
      />
    </>
  );
}

/** Magic Rabbit — purple face, ears, whiskers, and a four-point sparkle. */
function RabbitMarks() {
  return (
    <>
      <path d="M20.4 27.6C18.2 11.8 20.8 5.4 25.6 5.4C29.2 5.4 30.4 11.2 30 21.6" />
      <path d="M43.2 27.6C45.4 11.8 42.8 5.4 38 5.4C34.4 5.4 33.2 11.2 33.6 21.6" />
      <path d="M22.8 16.2C21.8 10.4 25 7.8 27.4 11.8" />
      <path d="M40.8 16.2C41.8 10.4 38.6 7.8 36.2 11.8" />
      <ellipse cx="31.8" cy="40.4" rx="14.2" ry="13.2" />
      <path d="M24.4 36.4C25.8 33.8 29 33.8 30.2 36.4" />
      <path d="M33.6 36.4C35 33.8 38.2 33.8 39.4 36.4" />
      <path d="M31.8 41.2L30.2 44H33.4Z" />
      <ellipse cx="31.8" cy="46.8" rx="1.65" ry="2.2" />
      <path d="M21.2 42.4H25.8" />
      <path d="M21.6 45.2H26" />
      <path d="M37.6 42.4H42.2" />
      <path d="M37.4 45.2H41.8" />
      <path d="M51.2 13.6L53.1 19.4L59 21.2L53.1 23L51.2 28.8L49.3 23L43.4 21.2L49.3 19.4Z" />
      <circle cx="46.8" cy="15.8" r="0.7" />
      <circle cx="55.8" cy="16" r="0.7" />
      <circle cx="55.8" cy="26.4" r="0.7" />
      <circle cx="46.8" cy="26.2" r="0.7" />
    </>
  );
}

/** WOW — purple diamond outline with gold inner facets. */
function DiamondOutline() {
  return (
    <>
      <path d="M21.2 12.5H42.8L53.2 28.2L32 55.5L10.8 28.2Z" />
      <path d="M21.2 12.5L32 28.2L42.8 12.5" />
      <path d="M21.2 12.5L10.8 28.2H53.2L42.8 12.5" />
    </>
  );
}

function DiamondGold() {
  return (
    <>
      <path d="M10.8 28.2H53.2" />
      <path d="M32 28.2V55.5" />
      <path d="M10.8 28.2L32 41.5L53.2 28.2" />
      <path d="M21.6 28.2L32 55.5" />
      <path d="M42.4 28.2L32 55.5" />
    </>
  );
}

/** Charming — classic neon heart. */
function HeartMarks() {
  return (
    <path d="M32 53.2C32 53.2 11.2 37.4 11.2 22.8C11.2 14.8 17.8 10.2 25.2 13.4C28.8 15 32 20.6 32 20.6C32 20.6 35.2 15 38.8 13.4C46.2 10.2 52.8 14.8 52.8 22.8C52.8 37.4 32 53.2 32 53.2Z" />
  );
}

/** Rose bloom — nested rounded petals (not a tulip cup). */
function RoseBloom() {
  return (
    <>
      <path d="M32 17.2C33.6 15.4 36.4 16.2 35.6 18.6C34.6 21.2 30.8 21 30.4 18.2C29.8 14.8 34.2 12.8 37.2 15.2" />
      <path d="M34.8 14.4C38.2 10.2 44.4 12.4 43.4 18.2C41.4 16.2 38.2 15.8 35.2 16.8" />
      <path d="M41.6 18.6C47.6 18.4 48.4 26.6 42.2 29C44.2 25.2 43.4 21.2 41 19.6" />
      <path d="M40 28.2C44.4 33.4 38.4 37.6 32.2 35.2C36.2 33.2 38.2 30.4 38.8 27.4" />
      <path d="M24 28.2C19.6 33.4 25.6 37.6 31.8 35.2C27.8 33.2 25.8 30.4 25.2 27.4" />
      <path d="M22.4 18.6C16.4 18.4 15.6 26.6 21.8 29C19.8 25.2 20.6 21.2 23 19.6" />
      <path d="M29.2 14.4C25.8 10.2 19.6 12.4 20.6 18.2C22.6 16.2 25.8 15.8 28.8 16.8" />
      <path d="M26.4 22.6C28.6 20 35.4 20 37.6 22.6" />
    </>
  );
}

function RoseStem() {
  return (
    <>
      <path d="M32 34.4C33.4 42.2 30.6 50.2 32.2 58" />
      <path d="M31.2 42.6C26.2 40.2 20.4 41.6 18.4 45.4" />
      <path d="M32.8 46.8C37.8 44.4 43.6 46.4 45.4 50.4" />
    </>
  );
}

function RoseLeaves() {
  return (
    <>
      <path d="M31 42.2C22.4 36.2 14.6 38.4 16.8 46.2C21 48.2 27.2 46.4 31 43.4Z" />
      <path d="M33 46.4C41.6 40.4 50 44.6 47 52.4C42.4 53.6 36.4 50.8 33 47.6Z" />
    </>
  );
}

/** Naughty — devil head with horns, wink, smirk, and tongue. */
function NaughtyMarks() {
  return (
    <>
      <path d="M18.4 18.6C14.2 8.4 10.6 5.8 14.8 4.2C19.4 2.6 22.6 10.4 22.8 16.4C25.2 14.6 38.8 14.6 41.2 16.4C41.4 10.4 44.6 2.6 49.2 4.2C53.4 5.8 49.8 8.4 45.6 18.6C52.2 24.8 51.8 42.2 32 54.2C12.2 42.2 11.8 24.8 18.4 18.6Z" />
      <path d="M21.6 27.2L28.6 26.6L25.2 34.4Z" />
      <path d="M36.4 30.6C38.8 27.6 44.6 27.8 46.6 31.4" />
      <path d="M23.8 40.6C28.6 46.4 38.8 46 43.6 40.2" />
      <path d="M41.2 42.4C45.4 45.2 46.2 50.4 41.6 51.4C38.2 51.8 37.4 47.2 40.2 44.6" />
    </>
  );
}

/** Beautiful — one four-pointed concave sparkle, fully inside the frame. */
function BeautifulMarks() {
  return (
    <path d="M32 9C33.15 23.6 40.4 30.85 55 32C40.4 33.15 33.15 40.4 32 55C30.85 40.4 23.6 33.15 9 32C23.6 30.85 30.85 23.6 32 9Z" />
  );
}

/** Fire — nested flame, open at the base, fully inside the frame. */
function FireMarks() {
  return (
    <>
      <path d="M24.2 53.4C14.8 44.6 15.6 30.2 24.8 17.6C28.2 23.8 34.2 23.2 36.8 15.2C40.2 6.8 49.2 9.4 50.2 20.2C54.4 26.4 50.8 37.6 45.6 42.8C51.6 45.2 48.4 52.6 39.6 54.2" />
      <path d="M28.4 49.2C22.6 42.4 23.4 32.6 29.6 24.8C31.6 28.8 35.6 28.2 36.8 22.6C38.8 16.8 44.4 18.4 43.8 25.6C45.6 31.8 42.8 40.2 36.4 46.6C34.2 48.8 31 49.8 28.4 49.2" />
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
        <linearGradient id={`${g}-fire`} x1="16" y1="10" x2="50" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff8a00" />
          <stop offset="0.42" stopColor="#ff2ec8" />
          <stop offset="1" stopColor="#9d00ff" />
        </linearGradient>
        <linearGradient id={`${g}-spark`} x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffd700" />
          <stop offset="0.38" stopColor="#ff8a00" />
          <stop offset="1" stopColor="#ff2ec8" />
        </linearGradient>
        <filter id={glow} x="-70%" y="-70%" width="240%" height="240%">
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
            <BalloonMarks cx={16.4} cy={23.6} stringX={17.6} />
          </NeonLayers>
          <NeonLayers color="#22d3ee" glowId={glow} stroke={stroke * 0.92} core={core}>
            <BalloonMarks cx={32} cy={16.8} stringX={32} />
          </NeonLayers>
          <NeonLayers color="#a855f7" glowId={glow} stroke={stroke * 0.92} core={core}>
            <BalloonMarks cx={47.6} cy={24.8} stringX={46.4} />
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
          <NeonLayers color="#ffb000" glowId={glow} stroke={stroke * 0.92} core={core}>
            <DiamondGold />
          </NeonLayers>
        </>
      )}

      {visual === "heart" && (
        <NeonLayers color="#ff2ec8" glowId={glow} stroke={stroke} core={core}>
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
          <NeonLayers color="#a032ff" glowId={glow} stroke={stroke * 0.92} core={core}>
            <RoseLeaves />
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
