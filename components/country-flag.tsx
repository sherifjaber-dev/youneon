"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { countryLabel, countryToIso, flagSvgCdnUrl, flagSvgUrl } from "@/lib/countries";

function GlobeMark({ size, className }: { size: number; className?: string }) {
  const width = Math.round((size * 4) / 3);
  return (
    <svg
      viewBox="0 0 24 18"
      width={width}
      height={size}
      className={cn("shrink-0 rounded-[2px]", className)}
      aria-hidden
    >
      <rect width="24" height="18" rx="2" fill="#94a3b8" />
      <circle cx="12" cy="9" r="5.6" fill="none" stroke="#f8fafc" strokeWidth="1.25" />
      <ellipse cx="12" cy="9" rx="2.3" ry="5.6" fill="none" stroke="#f8fafc" strokeWidth="1.1" />
      <path d="M6.4 9h11.2" stroke="#f8fafc" strokeWidth="1.1" />
      <path d="M7.1 5.7h9.8M7.1 12.3h9.8" stroke="#f8fafc" strokeWidth="1" />
    </svg>
  );
}

export function CountryFlag({
  country,
  size = 18,
  className,
  title,
  fallback = "none",
}: {
  country?: string | null;
  size?: number;
  className?: string;
  title?: string;
  fallback?: "none" | "globe";
}) {
  const iso = countryToIso(country);
  const local = iso ? flagSvgUrl(iso) : "";
  const cdn = iso ? flagSvgCdnUrl(iso) : "";
  const [src, setSrc] = useState(local || cdn);
  const [failed, setFailed] = useState(!iso);

  useEffect(() => {
    setSrc(local || cdn);
    setFailed(!iso);
  }, [iso, local, cdn]);

  const width = Math.round((size * 4) / 3);
  const globe = <GlobeMark size={size} className={className} />;

  if (!iso) return fallback === "globe" ? globe : null;
  if (failed) return fallback === "globe" ? globe : null;

  const label = title || countryLabel(iso) || iso;

  return (
    <img
      src={src}
      alt=""
      title={label}
      width={width}
      height={size}
      draggable={false}
      decoding="async"
      className={cn(
        "inline-block shrink-0 rounded-[2px] object-cover",
        "shadow-[0_0_0_1px_rgba(15,23,42,0.12)]",
        className
      )}
      style={{ width, height: size }}
      onError={() => {
        if (cdn && src !== cdn) {
          setSrc(cdn);
          return;
        }
        setFailed(true);
      }}
    />
  );
}

export function CountryLabel({
  country,
  name,
  size = 18,
  className,
  nameClassName,
}: {
  country?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  nameClassName?: string;
}) {
  const iso = countryToIso(country) || countryToIso(name);
  const label = (name && name.trim()) || countryLabel(country) || countryLabel(name) || "";
  if (!label && !iso) return null;

  return (
    <span className={cn("inline-flex min-w-0 max-w-full items-center gap-1.5", className)}>
      <CountryFlag country={iso || country} size={size} fallback={label ? "globe" : "none"} />
      {label ? (
        <span className={cn("truncate", nameClassName)}>{label}</span>
      ) : null}
    </span>
  );
}
