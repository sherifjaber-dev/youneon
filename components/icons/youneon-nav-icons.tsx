"use client";

import { useId, type ReactNode } from "react";

type NavIconProps = {
  size?: number;
  className?: string;
};

function NeonStrokeDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-stroke`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="var(--pink)" />
        <stop offset="52%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
  );
}

function NavSvg({
  size = 30,
  className,
  children,
}: NavIconProps & { children: (stroke: string, uid: string) => ReactNode }) {
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
      {children(stroke, uid)}
    </svg>
  );
}

/** Video camera — rounded body, top handle, right lens trapezoid, inner circle. */
export function YouNeonNavCameraIcon({ size = 30, className }: NavIconProps) {
  return (
    <NavSvg size={size} className={className}>
      {(stroke) => (
        <g stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" fill="none">
          <rect x="5.2" y="3.7" width="7.4" height="2.5" rx="1.15" />
          <rect x="2.15" y="6.15" width="14" height="12" rx="3.15" />
          <circle cx="11.55" cy="12.15" r="2.2" />
          <path d="M16.15 9.05 21.2 7.2c.55-.2.95.12.95.82v7.96c0 .7-.4 1.02-.95.82L16.15 14.95" />
        </g>
      )}
    </NavSvg>
  );
}

/** Lounge armchair — backrest, arms, seat, feet. */
export function YouNeonNavSofaIcon({ size = 30, className }: NavIconProps) {
  return (
    <NavSvg size={size} className={className}>
      {(stroke) => (
        <g stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" fill="none">
          <rect x="6.35" y="3.15" width="11.3" height="9" rx="2.25" />
          <rect x="3.05" y="9.15" width="4.35" height="10.2" rx="2.05" />
          <rect x="16.6" y="9.15" width="4.35" height="10.2" rx="2.05" />
          <rect x="7.15" y="11.2" width="9.7" height="4.35" rx="1.7" />
          <path d="M4.15 19.35v1.35M19.85 19.35v1.35" />
        </g>
      )}
    </NavSvg>
  );
}

/** History clock — open ring with clockwise arrow, V-shaped hands. */
export function YouNeonNavClockIcon({ size = 30, className }: NavIconProps) {
  return (
    <NavSvg size={size} className={className}>
      {(stroke) => (
        <g stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" fill="none">
          <path d="M16.2 18.7A8.2 8.2 0 1 1 19.7 15.75" />
          <path d="M17.55 14.2 19.7 15.75 18.85 13.15" />
          <path d="M12 12 8.35 9.05" />
          <path d="M12 12 16.35 8.35" />
        </g>
      )}
    </NavSvg>
  );
}

/** Messages — rounded bubble with bottom-left tail. */
export function YouNeonNavChatIcon({ size = 30, className }: NavIconProps) {
  return (
    <NavSvg size={size} className={className}>
      {(stroke) => (
        <g stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" fill="none">
          <path d="M7.7 4.85h8.6A3.7 3.7 0 0 1 20 8.55v4.7A3.7 3.7 0 0 1 16.3 17H10.2l-5.15 3.55.95-3.55H7.7A3.7 3.7 0 0 1 4 13.25v-4.7A3.7 3.7 0 0 1 7.7 4.85Z" />
        </g>
      )}
    </NavSvg>
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
