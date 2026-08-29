"use client";

const WELCOME_KEY = "youneon_welcome_v2";

export function hasSeenWelcome() {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(WELCOME_KEY) === "1";
  } catch {
    return false;
  }
}

export function markWelcomeSeen() {
  try {
    localStorage.setItem(WELCOME_KEY, "1");
  } catch {
    /* ignore */
  }
}

type WelcomeSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function WelcomeSheet({ open, onClose }: WelcomeSheetProps) {
  if (!open) return null;

  const finish = () => {
    markWelcomeSeen();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[#050010]/80 backdrop-blur-md"
        aria-label="Close welcome"
        onClick={finish}
      />
      <div className="relative z-10 mx-3 mb-[max(16px,env(safe-area-inset-bottom))] max-h-[min(92vh,720px)] w-full max-w-md overflow-y-auto rounded-[28px] border border-[#e879f9]/35 bg-[#12081c] p-6 shadow-[0_0_48px_rgba(194,24,117,0.35)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0abfc]">Welcome</p>
        <p className="yn-welcome-title mt-2 text-[26px] font-semibold leading-tight tracking-[-0.03em]">
          Hey — you’re in YouNeon
        </p>
        <p className="mt-3 text-[15px] leading-6 text-[#d4c4e8]">
          This is live video chat for meeting people on Pi Network. YouNeon is brand new, and we’re building it with you. Be 18+, be decent, and say hi.
        </p>
        <ul className="mt-5 space-y-3 text-[14px] leading-5 text-[#f5f0ff]">
          <li className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
            <span className="font-semibold text-white">Video Chat</span>
            <span className="mt-0.5 block text-[#c4b5d6]">
              Start a random live call. Skip if it’s not a match. A safety filter can blur nudity, weapons, or drugs on your screen.
            </span>
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
            <span className="font-semibold text-white">Lounge, History, Messages</span>
            <span className="mt-0.5 block text-[#c4b5d6]">
              See who was just online, keep talking, and follow. Video from a chat rings that person — it is not random.
            </span>
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
            <span className="font-semibold text-white">Stay safe</span>
            <span className="mt-0.5 block text-[#c4b5d6]">
              Fill in your profile (18+). Never send Pi or personal info to a stranger. Use Skip, Block, or the shield if something feels wrong.
            </span>
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
            <span className="font-semibold text-white">Help us grow it</span>
            <span className="mt-0.5 block text-[#c4b5d6]">
              Open the bell for a note from us. Comments, ideas, and “this is broken” messages make YouNeon better. Thank you for being early.
            </span>
          </li>
        </ul>
        <button
          type="button"
          onClick={finish}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff4db8] to-[#7c3aed] text-[16px] font-semibold text-white shadow-[0_0_22px_rgba(224,53,150,0.45)]"
        >
          Let’s go
        </button>
      </div>
    </div>
  );
}
