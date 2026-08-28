"use client";

import { useId } from "react";

type ChromeIconProps = {
  size?: number;
  className?: string;
};

function NeonStrokeDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-stroke`} x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="var(--pink)" />
        <stop offset="48%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
  );
}

function CyanStrokeDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-stroke`} x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#67e8f9" />
        <stop offset="48%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#3b9eff" />
      </linearGradient>
    </defs>
  );
}

/** Outline notification bell — neon pink → purple stroke, matching the header chrome. */
export function YouNeonBellIcon({ size = 28, className }: ChromeIconProps) {
  const uid = useId().replace(/:/g, "");
  const stroke = `url(#${uid}-stroke)`;
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
      <g stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round">
        <path d="M18 8.2A6 6 0 0 0 6 8.2c0 6.6-2.7 8.5-2.7 8.5h17.4S18 14.8 18 8.2Z" />
        <path d="M10.2 19.55a2.05 2.05 0 0 0 3.6 0" />
      </g>
    </svg>
  );
}

/** Outline shopping bag — two arched handles, neon cyan stroke. */
export function YouNeonBagIconNeon({ size = 28, className }: ChromeIconProps) {
  const uid = useId().replace(/:/g, "");
  const stroke = `url(#${uid}-stroke)`;
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
      <CyanStrokeDefs uid={uid} />
      <g stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round">
        <path d="M5.35 8.85h13.3a1.35 1.35 0 0 1 1.34 1.5l-.95 9.35A1.55 1.55 0 0 1 17.52 21.4H6.48a1.55 1.55 0 0 1-1.52-1.7l-.95-9.35a1.35 1.35 0 0 1 1.34-1.5Z" />
        <path d="M9.1 8.85V6.35a2.9 2.9 0 0 1 5.8 0v2.5" />
      </g>
    </svg>
  );
}

export function GoldSparkle({ size = 10, className }: ChromeIconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden className={className}>
      <path d="M8 0.6 9.15 6.4 15.4 8 9.15 9.6 8 15.4 6.85 9.6.6 8 6.85 6.4Z" />
    </svg>
  );
}
