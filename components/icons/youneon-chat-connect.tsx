import { cn } from "@/lib/utils";

/** Premium shopping bag for TopBar — thin neon stroke, not clipart. */
export function YouNeonBagIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M7.2 8.4h9.6c.9 0 1.6.72 1.58 1.62l-.38 8.1A1.6 1.6 0 0 1 16.4 19.6H7.6a1.6 1.6 0 0 1-1.6-1.48l-.38-8.1A1.58 1.58 0 0 1 7.2 8.4Z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.3V7.1A3 3 0 0 1 12 4.2 3 3 0 0 1 15 7.1v1.2"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      <path
        d="M12 11.4v4.2"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M12 11.2l.7 1.1h1.25l-1 1 .38 1.22L12 14.2l-1.33.72.38-1.22-1-1H11.3Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

/** Unique YouNeon illustration: two people connecting over a neon chat spark. */
export function YouNeonChatConnectArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 168"
      fill="none"
      aria-hidden
      className={cn("h-auto w-full", className)}
    >
      <defs>
        <radialGradient id="ynChatGlow" cx="50%" cy="48%" r="58%">
          <stop offset="0%" stopColor="#e879f9" stopOpacity="0.28" />
          <stop offset="55%" stopColor="#7c3aed" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0f0117" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ynChatStroke" x1="40" y1="40" x2="240" y2="140">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="50%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="ynChatFillL" x1="48" y1="44" x2="110" y2="140">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#581c87" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="ynChatFillR" x1="170" y1="44" x2="232" y2="140">
          <stop offset="0%" stopColor="#f472b6" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#701a75" stopOpacity="0.08" />
        </linearGradient>
        <filter id="ynChatSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="280" height="168" rx="24" fill="#12041c" />
      <circle cx="140" cy="86" r="92" fill="url(#ynChatGlow)" />

      <path
        d="M96 86c18-22 70-22 88 0"
        stroke="url(#ynChatStroke)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M104 98c14 16 58 16 72 0"
        stroke="url(#ynChatStroke)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.28"
      />

      {/* Left figure */}
      <g filter="url(#ynChatSoft)">
        <path
          d="M46 138c2-28 14-44 38-44s36 16 38 44"
          fill="url(#ynChatFillL)"
        />
        <path
          d="M46 138c2-28 14-44 38-44s36 16 38 44"
          stroke="url(#ynChatStroke)"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="84" cy="58" r="22" fill="url(#ynChatFillL)" stroke="url(#ynChatStroke)" strokeWidth="1.7" />
        <path
          d="M73 56.5c2.2-3 6-5 11-5 5.2 0 9 2 11 5"
          stroke="#f0abfc"
          strokeWidth="1.35"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path d="M76.5 62.5h.01" stroke="#f0abfc" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M91.5 62.5h.01" stroke="#f0abfc" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      {/* Right figure */}
      <g filter="url(#ynChatSoft)">
        <path
          d="M158 138c2-28 14-44 38-44s36 16 38 44"
          fill="url(#ynChatFillR)"
        />
        <path
          d="M158 138c2-28 14-44 38-44s36 16 38 44"
          stroke="url(#ynChatStroke)"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="196" cy="58" r="22" fill="url(#ynChatFillR)" stroke="url(#ynChatStroke)" strokeWidth="1.7" />
        <path
          d="M185 56.5c2.2-3 6-5 11-5 5.2 0 9 2 11 5"
          stroke="#f9a8d4"
          strokeWidth="1.35"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path d="M188.5 62.5h.01" stroke="#f9a8d4" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M203.5 62.5h.01" stroke="#f9a8d4" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      {/* Message chips */}
      <g>
        <rect x="108" y="70" width="38" height="22" rx="11" fill="#1a0828" stroke="#c084fc" strokeWidth="1.4" />
        <circle cx="119" cy="81" r="2" fill="#e879f9" />
        <circle cx="127" cy="81" r="2" fill="#f0abfc" />
        <circle cx="135" cy="81" r="2" fill="#ec4899" />
        <rect x="134" y="96" width="42" height="22" rx="11" fill="#1a0828" stroke="#ec4899" strokeWidth="1.4" />
        <path d="M146 107h18" stroke="#f9a8d4" strokeWidth="1.6" strokeLinecap="round" />
      </g>

      {/* YouNeon diamond spark between them */}
      <g transform="translate(140 48)">
        <path d="M0-9L6 0 0 9-6 0Z" fill="#f0abfc" opacity="0.95" />
        <path d="M0-9L6 0 0 9-6 0Z" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.8" />
      </g>
    </svg>
  );
}
