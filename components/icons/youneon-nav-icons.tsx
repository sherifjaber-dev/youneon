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

const neon: { stroke: string; fill: string; strokeWidth: number; strokeLinejoin: "round"; strokeLinecap: "round" } = {
  stroke: "currentColor",
  fill: "none",
  strokeWidth: 1.7,
  strokeLinejoin: "round",
  strokeLinecap: "round",
};

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

/** Video camera with play mark — matches the neon bar reference. */
export function YouNeonNavCameraIcon({ size = 30, className }: NavIconProps) {
  return (
    <OutlineSvg size={size} className={className}>
      <g {...neon}>
        <rect x="2.2" y="6.6" width="13.4" height="10.8" rx="2.4" />
        <path d="M15.7 9.15 21.1 6.7v10.6L15.7 14.85z" />
        <path d="M7.15 9.55 13.05 12.05 7.15 14.55z" />
      </g>
    </OutlineSvg>
  );
}

/** Lounge sofa. */
export function YouNeonNavSofaIcon({ size = 30, className }: NavIconProps) {
  return (
    <OutlineSvg size={size} className={className}>
      <g {...neon}>
        <path d="M5.4 11.1V8.4c0-1.7 1.4-3.1 3.1-3.1h7c1.7 0 3.1 1.4 3.1 3.1v2.7" />
        <path d="M3.4 12.35c0-.85.7-1.55 1.55-1.55h14.1c.85 0 1.55.7 1.55 1.55v4.35c0 .9-.73 1.65-1.65 1.65H5.05c-.92 0-1.65-.75-1.65-1.65z" />
        <path d="M8.15 10.8v7.55M15.85 10.8v7.55" />
        <path d="M5.2 18.55v1.55M18.8 18.55v1.55" />
      </g>
    </OutlineSvg>
  );
}

/** History clock with neon hanger. */
export function YouNeonNavClockIcon({ size = 30, className }: NavIconProps) {
  return (
    <OutlineSvg size={size} className={className}>
      <g {...neon}>
        <path d="M12 2.1v3.15" />
        <circle cx="12" cy="13.05" r="7.35" />
        <path d="M12 9.05v4.05l3.15.05" />
      </g>
    </OutlineSvg>
  );
}

/** Messages bubble. */
export function YouNeonNavChatIcon({ size = 30, className }: NavIconProps) {
  return (
    <OutlineSvg size={size} className={className}>
      <g {...neon}>
        <path d="M6.6 5.15h10.8A3.35 3.35 0 0 1 20.75 8.5v5.15A3.35 3.35 0 0 1 17.4 17H9.35L4.4 20.05V8.5A3.35 3.35 0 0 1 6.6 5.15Z" />
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
