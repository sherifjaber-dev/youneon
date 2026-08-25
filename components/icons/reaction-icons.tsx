import { RenderGlyph, SPARK_GLYPH, YN, type GlyphProps, type NeonEl } from "@/components/icons/youneon-glyphs";
import type { ReactionId } from "@/lib/profile-catalog";

const P = YN.pink;
const U = YN.purple;
const L = YN.lilac;

const REACTION_GLYPHS: Record<ReactionId, NeonEl[]> = {
  Awesome: [
    { t: "p", d: "M8.2 11.2V18H16.4c1.2 0 2.1-.9 2.2-2.1l.4-4.2c.1-1.1-.8-2.1-1.9-2.1H12", c: P },
    { t: "r", x: 5.2, y: 11.2, w: 3.2, h: 6.8, rx: 1.4, c: U },
    { t: "p", d: "M12 11.2V7.4c0-1.3.8-2.4 1.8-2.4.9 0 1.4.7 1.4 1.6V11", c: L },
  ],
  Funny: [
    { t: "c", cx: 12, cy: 12, r: 7.2, c: U },
    { t: "p", d: "M8.2 13.4c1.1 1.8 2.6 2.7 3.8 2.7s2.7-.9 3.8-2.7", c: P },
    { t: "c", cx: 9.3, cy: 10.1, r: 0.85, c: L, fill: true },
    { t: "c", cx: 14.7, cy: 10.1, r: 0.85, c: L, fill: true },
    { t: "p", d: "M17.8 6.2l1.4-1.6", c: L },
    { t: "p", d: "M19.6 8.2h2", c: L },
  ],
  Friendly: [
    { t: "p", d: "M7.2 18.2V11.4c0-1.6 1.1-2.6 2.4-2.6h.6", c: P },
    { t: "p", d: "M13.8 8.8h.6c1.3 0 2.4 1 2.4 2.6v6.8", c: U },
    { t: "c", cx: 8.8, cy: 6.6, r: 2.15, c: L },
    { t: "c", cx: 15.2, cy: 6.6, r: 2.15, c: P },
    { t: "p", d: "M10.6 13.2h2.8", c: L },
  ],
  "Magic Rabbit": [
    { t: "p", d: "M9.2 11.5c0-4.2-1.4-7.6-2.6-7.6-.8 0-1.2 1.4-.8 4.2", c: U },
    { t: "p", d: "M14.8 11.5c0-4.2 1.4-7.6 2.6-7.6.8 0 1.2 1.4.8 4.2", c: P },
    { t: "c", cx: 12, cy: 14.4, r: 4.1, c: L },
    { t: "c", cx: 10.5, cy: 13.7, r: 0.7, c: P, fill: true },
    { t: "c", cx: 13.5, cy: 13.7, r: 0.7, c: P, fill: true },
    { t: "p", d: "M17.6 16.8l3.2 3.2", c: U },
    { t: "p", d: "M19.2 18.4l1.8-1.2M19.2 18.4l1.2 1.8", c: L },
  ],
  WOW: [
    { t: "c", cx: 12, cy: 12, r: 4.4, c: P },
    { t: "p", d: "M12 4.4v2.2", c: L },
    { t: "p", d: "M12 17.4v2.2", c: L },
    { t: "p", d: "M4.4 12h2.2", c: U },
    { t: "p", d: "M17.4 12h2.2", c: U },
    { t: "p", d: "M6.6 6.6l1.6 1.6", c: L },
    { t: "p", d: "M15.8 15.8l1.6 1.6", c: L },
    { t: "p", d: "M17.4 6.6l-1.6 1.6", c: U },
    { t: "p", d: "M8.2 15.8l-1.6 1.6", c: U },
    { t: "c", cx: 12, cy: 12, r: 1.15, c: L, fill: true },
  ],
  Charming: [
    { t: "p", d: "M12 19.2S5.4 14.6 5.4 10.2c0-2.4 1.8-4.2 4-4.2 1.3 0 2.4.6 2.6 1.6.2-1 1.3-1.6 2.6-1.6 2.2 0 4 1.8 4 4.2 0 4.4-6.6 9-6.6 9z", c: P },
    { t: "p", d: "M9.2 10.4c.4-1.2 1.4-1.8 2.2-1.6", c: L },
  ],
  Rose: [
    { t: "p", d: "M12 11.4c2.8 0 4.6-2 4.6-3.8 0-1.4-1-2.4-2.4-2.4-1 0-1.7.5-2.2 1.2-.5-.7-1.2-1.2-2.2-1.2-1.4 0-2.4 1-2.4 2.4 0 1.8 1.8 3.8 4.6 3.8z", c: P },
    { t: "p", d: "M9.4 8.8c.8.8 1.8 1.4 2.6 1.4s1.8-.6 2.6-1.4", c: L },
    { t: "p", d: "M12 11.6v6.6", c: U },
    { t: "p", d: "M12 15.2c-2.2.2-3.6 1.6-3.8 3.2", c: U },
    { t: "p", d: "M12 16.4c1.8.4 3.2 1.4 3.6 2.6", c: L },
  ],
};

const EARNED_GLYPH: NeonEl[] = [
  { t: "c", cx: 12, cy: 12, r: 7.1, c: U },
  { t: "p", d: "M8.4 13c1 1.6 2.3 2.4 3.6 2.4s2.6-.8 3.6-2.4", c: P },
  { t: "c", cx: 9.4, cy: 10.2, r: 0.8, c: L, fill: true },
  { t: "c", cx: 14.6, cy: 10.2, r: 0.8, c: L, fill: true },
];

export function ReactionIcon({
  id,
  size = 18,
  className,
}: GlyphProps & { id: string }) {
  const spec = (REACTION_GLYPHS as Record<string, NeonEl[]>)[id] || SPARK_GLYPH;
  return <RenderGlyph spec={spec} size={size} className={className} />;
}

export function ReactionsEarnedIcon({ size = 16, className }: GlyphProps) {
  return <RenderGlyph spec={EARNED_GLYPH} size={size} className={className} />;
}
