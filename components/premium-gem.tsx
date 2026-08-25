export function PremiumGem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 80" className={className} aria-hidden>
      <defs>
        <linearGradient id="ynGemA" x1="12" y1="4" x2="60" y2="76">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="40%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="ynGemB" x1="36" y1="8" x2="36" y2="76">
          <stop offset="0%" stopColor="#f5d0fe" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.3" />
        </linearGradient>
        <filter id="ynGemGlow" x="-40%" y="-20%" width="180%" height="160%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="36" cy="74" rx="18" ry="4" fill="#a855f7" opacity="0.45" />
      <g filter="url(#ynGemGlow)">
        <path d="M36 6 L62 28 L36 76 L10 28 Z" fill="url(#ynGemA)" />
        <path d="M36 6 L50 28 L36 76 L22 28 Z" fill="url(#ynGemB)" />
        <path d="M10 28 L36 6 L62 28 L50 28 L36 18 L22 28 Z" fill="#f5d0fe" opacity="0.35" />
        <path d="M36 18 L50 28 L36 76 Z" fill="#ddd6fe" opacity="0.18" />
        <path d="M22 28 L36 18 L36 76 Z" fill="#4c1d95" opacity="0.22" />
      </g>
    </svg>
  );
}
