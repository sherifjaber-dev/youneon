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
      className={cn("yn-script-logo min-w-0 text-left active:scale-[0.98]", className)}
      aria-label="YouNeon, open profile"
    >
      <img
        src="/youneon/logo.png"
        alt="YouNeon"
        className="yn-script-logo-img"
        draggable={false}
      />
    </button>
  );
}
