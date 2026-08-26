import { GiftArt } from "@/components/icons/gift-art";
import { RenderGlyph, SPARK_GLYPH, YN, type GlyphProps, type NeonEl } from "@/components/icons/youneon-glyphs";
import { REACTION_TO_GIFT, type ReactionId } from "@/lib/profile-catalog";

const P = YN.pink;
const U = YN.purple;
const L = YN.lilac;

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
  return <RenderGlyph spec={SPARK_GLYPH} size={size} className={className} />;
}

export function ReactionsEarnedIcon({ size = 16, className }: GlyphProps) {
  return <RenderGlyph spec={EARNED_GLYPH} size={size} className={className} />;
}
