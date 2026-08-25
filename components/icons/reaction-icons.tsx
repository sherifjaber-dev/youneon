import { GiftArt } from "@/components/icons/gift-art";
import { RenderGlyph, SPARK_GLYPH, YN, type GlyphProps, type NeonEl } from "@/components/icons/youneon-glyphs";
import { REACTION_TO_GIFT, type ReactionId } from "@/lib/profile-catalog";

const P = YN.pink;
const U = YN.purple;
const L = YN.lilac;

const MAGIC_RABBIT_GLYPH: NeonEl[] = [
  { t: "p", d: "M9.2 11.5c0-4.2-1.4-7.6-2.6-7.6-.8 0-1.2 1.4-.8 4.2", c: U },
  { t: "p", d: "M14.8 11.5c0-4.2 1.4-7.6 2.6-7.6.8 0 1.2 1.4.8 4.2", c: P },
  { t: "c", cx: 12, cy: 14.4, r: 4.1, c: L },
  { t: "c", cx: 10.5, cy: 13.7, r: 0.7, c: P, fill: true },
  { t: "c", cx: 13.5, cy: 13.7, r: 0.7, c: P, fill: true },
  { t: "p", d: "M17.6 16.8l3.2 3.2", c: U },
  { t: "p", d: "M19.2 18.4l1.8-1.2M19.2 18.4l1.2 1.8", c: L },
];

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
  const giftId = REACTION_TO_GIFT[id as ReactionId];
  if (giftId) {
    return <GiftArt id={giftId} size={size} variant="pick" instance={`rx-${id}`} className={className} />;
  }
  if (id === "Magic Rabbit") {
    return <RenderGlyph spec={MAGIC_RABBIT_GLYPH} size={size} className={className} />;
  }
  return <RenderGlyph spec={SPARK_GLYPH} size={size} className={className} />;
}

export function ReactionsEarnedIcon({ size = 16, className }: GlyphProps) {
  return <RenderGlyph spec={EARNED_GLYPH} size={size} className={className} />;
}
