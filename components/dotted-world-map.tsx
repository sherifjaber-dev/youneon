"use client";

type Ellipse = { x: number; y: number; rx: number; ry: number };

/** Original dotted landmasses — not a traced photo. Equirectangular blobs. */
const LAND: Ellipse[] = [
  { x: 18, y: 16, rx: 13, ry: 9 },
  { x: 8.5, y: 12, rx: 6, ry: 4 },
  { x: 16, y: 24.5, rx: 5, ry: 4 },
  { x: 22, y: 38, rx: 6.5, ry: 12 },
  { x: 32, y: 8, rx: 4, ry: 3 },
  { x: 47, y: 14, rx: 7, ry: 5.5 },
  { x: 48, y: 28, rx: 8, ry: 12 },
  { x: 58, y: 20, rx: 5, ry: 4 },
  { x: 72, y: 12, rx: 18, ry: 7 },
  { x: 70, y: 22, rx: 13, ry: 8 },
  { x: 78, y: 30, rx: 7, ry: 4 },
  { x: 84.5, y: 18, rx: 2.4, ry: 3.2 },
  { x: 83, y: 38, rx: 6.5, ry: 4 },
];

function inLand(px: number, py: number) {
  return LAND.some((e) => {
    const dx = (px - e.x) / e.rx;
    const dy = (py - e.y) / e.ry;
    return dx * dx + dy * dy <= 1;
  });
}

const DOTS: { x: number; y: number; r: number }[] = [];
const STEP = 1.58;
for (let y = 4; y < 48; y += STEP) {
  const offset = ((y / STEP) % 2) * (STEP / 2);
  for (let x = 4; x < 96; x += STEP) {
    const px = x + offset;
    if (inLand(px, y)) {
      DOTS.push({
        x: px,
        y,
        r: 0.38 + ((Math.round(px * 11 + y * 7)) % 5) * 0.045,
      });
    }
  }
}

export function DottedWorldMap({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 50"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id="ynMapGlow" cx="50%" cy="48%" r="62%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.42" />
          <stop offset="45%" stopColor="#7c3aed" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#05050d" stopOpacity="0" />
        </radialGradient>
        <filter id="ynMapDotGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="0.42" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="100" height="50" fill="url(#ynMapGlow)" />
      {DOTS.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={i % 7 === 0 ? "#f0abfc" : i % 5 === 0 ? "#67e8f9" : "#d8b4fe"}
          opacity={0.72 + (i % 4) * 0.07}
          filter="url(#ynMapDotGlow)"
        />
      ))}
    </svg>
  );
}
