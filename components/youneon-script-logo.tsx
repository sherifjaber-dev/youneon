"use client";

import { cn } from "@/lib/utils";

export function YouNeonScriptLogo({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("yn-script-logo min-w-0 truncate text-left active:scale-[0.98]", className)}
      aria-label="YouNeon, open profile"
    >
      <span className="yn-script-you">You</span>
      <span className="yn-script-neon">Neon</span>
    </button>
  );
}
