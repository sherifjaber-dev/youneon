"use client";

import { MessageSquare } from "lucide-react";

export function LoungeEmpty({ onOpenVideoChat }: { onOpenVideoChat?: () => void }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--pink)_12%,transparent)] ring-1 ring-[#A855F7]/40 shadow-[0_0_18px_var(--pink-soft)]">
        <MessageSquare size={26} className="text-[var(--pink-text)]" />
      </div>
      <p className="text-[16px] font-semibold text-white">Waiting room is quiet</p>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-[#b9a8c9]">
        People waiting now and Pioneers who were recently online show up here. Start a free video chat so the room has a pulse.
      </p>
      <button
        type="button"
        onClick={() => {
          if (onOpenVideoChat) {
            onOpenVideoChat();
            return;
          }
          document.querySelector<HTMLButtonElement>('[data-testid="nav-tab-discover"]')?.click();
        }}
        className="yn-lounge-empty-cta mt-4"
        data-testid="lounge-start-video-btn"
      >
        Start a free video chat
      </button>
    </div>
  );
}
