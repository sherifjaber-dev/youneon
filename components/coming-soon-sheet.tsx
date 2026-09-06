"use client";

type ComingSoonSheetProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
};

export function ComingSoonSheet({
  open,
  title = "Kommer snart",
  onClose,
}: ComingSoonSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative z-10 mx-4 mb-[max(20px,env(safe-area-inset-bottom))] w-full max-w-sm rounded-[28px] border border-[#e879f9]/35 bg-[#12081c] px-6 py-7 text-center shadow-[0_0_40px_rgba(194,24,117,0.35)]"
        data-testid="coming-soon-sheet"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f0abfc]">YouNeon</p>
        <p className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-white">{title}</p>
        <p className="mt-2 text-[15px] leading-6 text-[#d4c4e8]">
          Neon and Premium are paused while we fill the room. Meeting people stays free.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff4db8] to-[#7c3aed] text-[16px] font-semibold text-white"
        >
          Okay
        </button>
      </div>
    </div>
  );
}
