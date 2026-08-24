"use client";

import { Crown } from "lucide-react";

type PremiumBadgeProps = {
  size?: "sm" | "md";
  className?: string;
};

export function PremiumBadge({ size = "sm", className = "" }: PremiumBadgeProps) {
  const compact = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-gradient-to-r from-amber-400/20 to-pink-500/20 font-semibold text-amber-200 ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-[11px]"
      } ${className}`}
    >
      <Crown size={compact ? 9 : 12} className="text-amber-300" />
      Premium
    </span>
  );
}
