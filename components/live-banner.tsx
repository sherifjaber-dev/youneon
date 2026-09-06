"use client";

import "./report-live.css";

export function LiveBanner({
  onlineCount,
}: {
  onlineCount: number;
}) {
  return (
    <div className="yn-live-card relative w-full flex-shrink-0 overflow-hidden" data-testid="live-banner">
      <div className="yn-live-banner-stage relative w-full overflow-hidden rounded-[22px] border border-[#a855f7]/35 bg-[#0a0514]">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse at 70% 20%, rgba(168,85,247,0.35), transparent 55%), radial-gradient(ellipse at 20% 90%, rgba(236,72,153,0.28), transparent 50%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.12) 1px, transparent 1.6px), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08) 1px, transparent 1.6px)",
            backgroundSize: "42px 42px",
          }}
        />
        <div className="relative flex min-h-[168px] flex-col justify-end px-4 pb-4 pt-5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-red-400/50 bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-red-200">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)]" />
            Live
          </span>
          <p className="mt-3 text-[22px] font-semibold leading-tight tracking-[-0.03em] text-white">
            Start random
            <span className="bg-gradient-to-r from-[#f0abfc] to-[#818cf8] bg-clip-text text-transparent"> video chat</span>
          </p>
          <p className="mt-1.5 text-[13px] leading-5 text-[#d4c4e8]">
            Real Pioneers. No stock faces.
            {onlineCount > 0
              ? ` ${onlineCount} online now.`
              : " Be first in the room."}
          </p>
        </div>
      </div>
    </div>
  );
}
