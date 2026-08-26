import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const YN = {
  pink: "var(--pink-text)",
  purple: "#a855f7",
  lilac: "#f0abfc",
} as const;

export const SW = 1.55;

export type NeonEl =
  | { t: "p"; d: string; c?: string }
  | { t: "c"; cx: number; cy: number; r: number; c?: string; fill?: boolean }
  | { t: "r"; x: number; y: number; w: number; h: number; rx?: number; c?: string };

export type GlyphProps = {
  size?: number;
  className?: string;
};

export function NeonGlyph({
  children,
  size = 16,
  className,
}: GlyphProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className={cn("yn-neon-glyph", className)}
    >
      {children}
    </svg>
  );
}

export function RenderGlyph({
  spec,
  size = 16,
  className,
}: GlyphProps & { spec: NeonEl[] }) {
  return (
    <NeonGlyph size={size} className={className}>
      {spec.map((el, i) => {
        const color = el.c || YN.pink;
        if (el.t === "c") {
          return (
            <circle
              key={i}
              cx={el.cx}
              cy={el.cy}
              r={el.r}
              stroke={el.fill ? "none" : color}
              strokeWidth={el.fill ? 0 : SW}
              fill={el.fill ? color : "none"}
            />
          );
        }
        if (el.t === "r") {
          return (
            <rect
              key={i}
              x={el.x}
              y={el.y}
              width={el.w}
              height={el.h}
              rx={el.rx ?? 2.2}
              stroke={color}
              strokeWidth={SW}
            />
          );
        }
        return (
          <path
            key={i}
            d={el.d}
            stroke={color}
            strokeWidth={SW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </NeonGlyph>
  );
}

/** Default spark when a tag is unknown. */
export const SPARK_GLYPH: NeonEl[] = [
  { t: "p", d: "M12 4.2v3.2", c: YN.lilac },
  { t: "p", d: "M12 16.6v3.2", c: YN.lilac },
  { t: "p", d: "M4.2 12h3.2", c: YN.purple },
  { t: "p", d: "M16.6 12h3.2", c: YN.purple },
  { t: "p", d: "M6.6 6.6l2.1 2.1", c: YN.pink },
  { t: "p", d: "M15.3 15.3l2.1 2.1", c: YN.pink },
  { t: "p", d: "M17.4 6.6l-2.1 2.1", c: YN.pink },
  { t: "p", d: "M8.7 15.3l-2.1 2.1", c: YN.pink },
];
