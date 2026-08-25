"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function isPhotoSrc(value?: string | null): boolean {
  if (!value || typeof value !== "string") return false;
  const v = value.trim();
  return (
    v.startsWith("data:image") ||
    v.startsWith("https://") ||
    v.startsWith("http://") ||
    v.startsWith("blob:")
  );
}

export function neonInitial(name?: string | null): string {
  if (!name) return "Y";
  const cleaned = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();
  if (!cleaned) return "Y";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  const letters = `${a}${parts.length > 1 ? b : ""}`.toUpperCase();
  return letters || "Y";
}

interface NeonAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  showPhoto?: boolean;
  online?: boolean;
  className?: string;
  alt?: string;
}

export function NeonAvatar({
  src,
  name,
  size = 56,
  showPhoto = true,
  online = false,
  className,
  alt,
}: NeonAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const photo = showPhoto && isPhotoSrc(src) && !imgFailed;
  const initial = neonInitial(name);
  const ring = Math.max(2, Math.round(size * 0.045));

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-full"
        style={{
          background:
            "linear-gradient(145deg, #e879f9 0%, #a855f7 42%, #ec4899 78%, #7c3aed 100%)",
          boxShadow: `0 0 ${Math.round(size * 0.28)}px rgba(168, 85, 247, 0.45), inset 0 1px 0 rgba(255,255,255,0.28)`,
        }}
        aria-hidden={!alt}
      >
        {photo ? (
          <img
            src={src!}
            alt={alt || name || ""}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span
            className="select-none font-bold leading-none text-white"
            style={{
              fontSize: size >= 72 ? Math.round(size * 0.34) : Math.round(size * 0.38),
              textShadow: "0 1px 8px rgba(88, 28, 135, 0.55)",
              letterSpacing: size >= 64 ? "0.04em" : 0,
            }}
          >
            {initial}
          </span>
        )}
      </div>
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-emerald-400"
          style={{
            width: Math.max(8, Math.round(size * 0.22)),
            height: Math.max(8, Math.round(size * 0.22)),
            boxShadow: `0 0 0 ${ring}px #0f0117`,
          }}
          aria-label="Online"
        />
      )}
    </div>
  );
}
