"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const DEFAULT_AVATAR_SRC = "/default-avatar.png";

export function isPhotoSrc(value?: string | null): boolean {
  if (!value || typeof value !== "string") return false;
  const v = value.trim();
  if (!v || v === DEFAULT_AVATAR_SRC) return false;
  return (
    v.startsWith("data:image") ||
    v.startsWith("https://") ||
    v.startsWith("http://") ||
    v.startsWith("blob:") ||
    (v.startsWith("/") && !v.startsWith("//") && /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(v))
  );
}

export function resolvePhotoSrc(src?: string | null, showPhoto = true): string {
  if (showPhoto && isPhotoSrc(src)) return src!.trim();
  return DEFAULT_AVATAR_SRC;
}

/** Shared fallback: empty, invalid, or broken photo URLs use the neon default artwork. */
export function UserPhoto({
  src,
  alt = "",
  className,
  showPhoto = true,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  showPhoto?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const resolved = resolvePhotoSrc(failed ? null : src, showPhoto);

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={() => {
        if (resolved !== DEFAULT_AVATAR_SRC) setFailed(true);
      }}
    />
  );
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
  const ring = Math.max(2, Math.round(size * 0.045));

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#080412]"
        style={{
          boxShadow: `0 0 ${Math.round(size * 0.28)}px rgba(168, 85, 247, 0.45)`,
        }}
        aria-hidden={!alt}
      >
        <UserPhoto
          src={src}
          showPhoto={showPhoto}
          alt={alt || name || ""}
          className="h-full w-full object-cover"
        />
      </div>
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-emerald-400"
          style={{
            width: Math.max(8, Math.round(size * 0.22)),
            height: Math.max(8, Math.round(size * 0.22)),
            boxShadow: `0 0 0 ${ring}px var(--yn-bg)`,
          }}
          aria-label="Online"
        />
      )}
    </div>
  );
}
