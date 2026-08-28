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

/** Video camera — rounded body, top handle, right lens. */
export function YouNeonNavCameraIcon({ size = 30, className, filled }: NavIconProps) {
  return (
    <NavSvg size={size} className={className} filled={filled}>
      {(stroke, fill) => (
        <g stroke={stroke} strokeWidth={filled ? 1.9 : 1.75} strokeLinejoin="round" strokeLinecap="round">
          <rect x="5.2" y="3.5" width="7.6" height="2.7" rx="1.2" fill={fill} />
          <rect x="2.05" y="6.05" width="14.2" height="12.2" rx="3.2" fill={fill} />
          <circle cx="9.15" cy="12.15" r="2.35" fill={filled ? "#120814" : "none"} />
          <path d="M16.2 9.05 21.25 7.15c.55-.2.95.14.95.84v7.92c0 .7-.4 1.04-.95.84L16.2 14.95z" fill={fill} />
        </g>
      )}
    </NavSvg>
  );
}

/** Lounge armchair — backrest, arms, seat, feet. */
export function YouNeonNavSofaIcon({ size = 30, className, filled }: NavIconProps) {
  return (
    <NavSvg size={size} className={className} filled={filled}>
      {(stroke, fill) => (
        <g stroke={stroke} strokeWidth={filled ? 1.9 : 1.75} strokeLinejoin="round" strokeLinecap="round">
          <rect x="6.2" y="3.05" width="11.6" height="9.1" rx="2.3" fill={fill} />
          <rect x="2.9" y="9.05" width="4.5" height="10.3" rx="2.1" fill={fill} />
          <rect x="16.6" y="9.05" width="4.5" height="10.3" rx="2.1" fill={fill} />
          <rect x="7" y="11.1" width="10" height="4.5" rx="1.7" fill={filled ? "#120814" : "none"} />
          <path d="M4.1 19.4v1.4M19.9 19.4v1.4" fill="none" />
        </g>
      )}
    </NavSvg>
  );
}

/** History clock — ring, hands, rewind arrow. */
export function YouNeonNavClockIcon({ size = 30, className, filled }: NavIconProps) {
  return (
    <NavSvg size={size} className={className} filled={filled}>
      {(stroke, fill) => (
        <g stroke={stroke} strokeWidth={filled ? 1.9 : 1.75} strokeLinejoin="round" strokeLinecap="round">
          <circle cx="12" cy="12.1" r="8.15" fill={fill} />
          <path d="M12 8.15v4.15l2.85 1.7" fill="none" stroke={filled ? "#fff" : stroke} strokeWidth={filled ? 1.7 : 1.75} />
          <path d="M16.35 4.55 18.7 6.15 16.9 8.05" fill="none" />
        </g>
      )}
    </NavSvg>
  );
}

/** Messages — rounded bubble with tail. */
export function YouNeonNavChatIcon({ size = 30, className, filled }: NavIconProps) {
  return (
    <NavSvg size={size} className={className} filled={filled}>
      {(stroke, fill) => (
        <g stroke={stroke} strokeWidth={filled ? 1.9 : 1.75} strokeLinejoin="round" strokeLinecap="round">
          <path
            d="M7.7 4.7h8.6A3.8 3.8 0 0 1 20.1 8.5v4.75A3.8 3.8 0 0 1 16.3 17.05H10.15L4.9 20.7l1.05-3.65H7.7A3.8 3.8 0 0 1 3.9 13.25V8.5A3.8 3.8 0 0 1 7.7 4.7Z"
            fill={fill}
          />
          {filled ? (
            <g fill="#fff" stroke="none">
              <circle cx="9.1" cy="11.15" r="0.95" />
              <circle cx="12" cy="11.15" r="0.95" />
              <circle cx="14.9" cy="11.15" r="0.95" />
            </g>
          ) : null}
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
