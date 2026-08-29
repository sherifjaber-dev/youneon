"use client";

import { useId, type ReactNode } from "react";

type NavIconProps = {
  size?: number;
  className?: string;
  filled?: boolean;
};

function NeonStrokeDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-stroke`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="var(--pink)" />
        <stop offset="52%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id={`${uid}-fill`} x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="var(--pink)" />
        <stop offset="55%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
  );
}

function NavSvg({
  size = 30,
  className,
  filled = false,
  children,
}: NavIconProps & { children: (stroke: string, fill: string, uid: string) => ReactNode }) {
  const uid = useId().replace(/:/g, "");
  const stroke = `url(#${uid}-stroke)`;
  const fill = filled ? `url(#${uid}-fill)` : "none";
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      overflow="visible"
      className={className}
    >
      <NeonStrokeDefs uid={uid} />
      {children(stroke, fill, uid)}
    </svg>
  );
}

function OutlineSvg({
  size = 30,
  className,
  children,
}: NavIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      overflow="visible"
      className={className}
    >
      {children}
    </svg>
  );
}

const S = {
  stroke: "currentColor",
  fill: "none" as const,
  strokeWidth: 1.65,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

/** Video camera — body, lens play, viewfinder. */
export function YouNeonNavCameraIcon({ size = 30, className }: NavIconProps) {
  return (
    <OutlineSvg size={size} className={className}>
      <g {...S}>
        <rect x="2.4" y="6.8" width="13.2" height="10.4" rx="2.6" />
        <path d="M15.7 9.35 21.15 6.9v10.2L15.7 14.65z" />
        <path d="M7.05 9.7v4.6L12.85 12z" />
      </g>
    </OutlineSvg>
  );
}

/** Lounge sofa — back, two cushions, arms, legs. */
export function YouNeonNavSofaIcon({ size = 30, className }: NavIconProps) {
  return (
    <OutlineSvg size={size} className={className}>
      <g {...S}>
        <path d="M6.2 10.4V7.7A2.4 2.4 0 0 1 8.6 5.3h6.8A2.4 2.4 0 0 1 17.8 7.7v2.7" />
        <rect x="3.15" y="10.55" width="17.7" height="8.05" rx="2.15" />
        <path d="M12 10.55v8.05" />
        <path d="M6.15 18.6v1.85M17.85 18.6v1.85" />
      </g>
    </OutlineSvg>
  );
}

const CLOCK_TICKS = Array.from({ length: 12 }, (_, i) => {
  const deg = (i * 30 - 90) * (Math.PI / 180);
  const long = i % 3 === 0;
  const inner = long ? 5.15 : 5.45;
  const outer = long ? 6.45 : 6.2;
  return {
    x1: 12 + Math.cos(deg) * inner,
    y1: 13.15 + Math.sin(deg) * inner,
    x2: 12 + Math.cos(deg) * outer,
    y2: 13.15 + Math.sin(deg) * outer,
  };
});

/** History clock — analog face, 10:10 hands, pocket-watch crown. */
export function YouNeonNavClockIcon({ size = 30, className }: NavIconProps) {
  return (
    <OutlineSvg size={size} className={className}>
      <g {...S}>
        <circle cx="12" cy="2.55" r="0.95" />
        <path d="M12 3.5v1.85" />
        <circle cx="12" cy="13.15" r="7.05" />
        {CLOCK_TICKS.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
        ))}
        <path d="M12 13.15 8.85 10.55" />
        <path d="M12 13.15 15.35 10.7" />
        <circle cx="12" cy="13.15" r="0.7" fill="currentColor" stroke="none" />
      </g>
    </OutlineSvg>
  );
}

/** Messages — rounded bubble with a clean tail. */
export function YouNeonNavChatIcon({ size = 30, className }: NavIconProps) {
  return (
    <OutlineSvg size={size} className={className}>
      <g {...S}>
        <path d="M6.4 4.85h11.2A3.15 3.15 0 0 1 20.75 8v5.35A3.15 3.15 0 0 1 17.6 16.5h-6.55L6.15 19.7V8A3.15 3.15 0 0 1 6.4 4.85Z" />
      </g>
    </OutlineSvg>
  );
}

/** Lounge filter — three slider bars with knobs (right / left / center). */
export function YouNeonLoungeFilterIcon({ size = 34, className }: NavIconProps) {
  return (
    <NavSvg size={size} className={className}>
      {(stroke) => (
        <g stroke={stroke} strokeWidth="1.85" strokeLinejoin="round" strokeLinecap="round" fill="none">
          <line x1="3.2" y1="6.1" x2="20.8" y2="6.1" />
          <circle cx="18.35" cy="6.1" r="2.2" />
          <line x1="3.2" y1="12" x2="20.8" y2="12" />
          <circle cx="5.65" cy="12" r="2.2" />
          <line x1="3.2" y1="17.9" x2="20.8" y2="17.9" />
          <circle cx="12" cy="17.9" r="2.2" />
        </g>
      )}
    </NavSvg>
  );
}
