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
        <div className="relative flex min-h-[198px] flex-col justify-between px-4 pb-4 pt-4">
          <p className="inline-flex w-fit items-center rounded-full border border-[#f0abfc]/35 bg-black/35 px-3 py-1 text-[12px] font-semibold tracking-[0.04em] text-[#f5e9ff]">
            Start  →  Match  →  Talk
          </p>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#f0abfc]">Live video</p>
            <p className="mt-1 text-[20px] font-semibold leading-tight tracking-[-0.03em] text-white">
              Real people.
            </p>
            <p className="mt-1 text-[13px] text-[#d4c4e8]">
              {onlineCount > 0
                ? `${onlineCount} Pioneer${onlineCount === 1 ? "" : "s"} in the room right now.`
                : "The room is quiet — start and the next Pioneer lands here."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
