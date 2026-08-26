"use client";

import { cn } from "@/lib/utils";

export function YouNeonScriptLogo({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={cn("yn-script-logo", className)}
      aria-hidden="true"
    >
      <img
        src="/youneon/logo.png"
        alt=""
        className="yn-script-logo-img"
        draggable={false}
      />
    </span>
  );
}
