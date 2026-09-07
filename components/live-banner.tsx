"use client";

export function LiveBanner({
  onlineCount,
}: {
  onlineCount: number;
}) {
  return (
    <div className="yn-live-card relative w-full flex-shrink-0 overflow-hidden" data-testid="live-banner">
      <div className="yn-live-banner-stage relative w-full">
        <img
          src="/youneon/live-banner.png?v=map3"
          alt=""
          draggable={false}
          className="yn-live-banner-img"
        />
        <span className="yn-live-dot">LIVE</span>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#080412] via-[#080412]/55 to-transparent px-3.5 pb-3 pt-8">
          <p className="text-[17px] font-semibold leading-tight text-white">Real people.</p>
          <p className="mt-1 text-[13px] text-[#d4c4e8]">
            {onlineCount > 0
              ? `${onlineCount} Pioneer${onlineCount === 1 ? "" : "s"} online now`
              : "Be first in the room — matching is free"}
          </p>
        </div>
      </div>
    </div>
  );
}
