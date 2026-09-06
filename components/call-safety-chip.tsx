"use client";

import "./report-live.css";

export function CallSafetyChip({ className = "" }: { className?: string }) {
  return (
    <p
      className={`rounded-full border border-white/15 bg-black/35 px-3 py-1 text-center text-[11px] font-medium tracking-wide text-white/90 ${className}`}
      data-testid="call-safety-chip"
    >
      18+ · no recording · skip / block if needed
    </p>
  );
}
