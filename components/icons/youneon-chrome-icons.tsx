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
        <stop offset="0%" stopColor="#ff4fd8" />
        <stop offset="48%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <filter id={`${uid}-glow`} x="-55%" y="-55%" width="210%" height="210%">
        <feGaussianBlur stdDeviation="1.55" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/** Outline notification bell — neon pink → purple stroke, matching the header chrome. */
export function YouNeonBellIcon({ size = 27, className }: ChromeIconProps) {
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
      <g filter={`url(#${uid}-glow)`} stroke={stroke} strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M12 3.15c-3.62 0-6.35 2.78-6.35 6.42 0 4.28-1.48 5.82-2.28 6.85-.22.28-.08.78.32.78h16.62c.4 0 .54-.5.32-.78-.8-1.03-2.28-2.57-2.28-6.85 0-3.64-2.73-6.42-6.35-6.42Z"
          strokeWidth="1.65"
        />
        <path d="M10.15 18.55c.42 1.42 1.2 2.2 1.85 2.2s1.43-.78 1.85-2.2" strokeWidth="1.65" />
      </g>
    </svg>
  );
}

/** Outline shopping bag — two arched handles, neon pink → purple stroke. */
export function YouNeonBagIconNeon({ size = 27, className }: ChromeIconProps) {
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
      <g filter={`url(#${uid}-glow)`} stroke={stroke} strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M6.85 9.55h10.3c.88 0 1.56.73 1.5 1.6l-.72 9.05A1.55 1.55 0 0 1 16.4 21.6H7.6a1.55 1.55 0 0 1-1.53-1.4l-.72-9.05a1.52 1.52 0 0 1 1.5-1.6Z"
          strokeWidth="1.65"
        />
        <circle cx="8.85" cy="9.55" r="1.05" strokeWidth="1.45" />
        <circle cx="15.15" cy="9.55" r="1.05" strokeWidth="1.45" />
        <path d="M8.85 8.45c0-2.7 1.15-4.05 2.45-4.05" strokeWidth="1.65" />
        <path d="M15.15 8.45c0-2.7-1.15-4.05-2.45-4.05" strokeWidth="1.65" />
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
