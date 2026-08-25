export function PremiumGem({ className }: { className?: string }) {
  return (
    <img
      src="/youneon/premium-diamond.png"
      alt=""
      aria-hidden
      draggable={false}
      className={`yn-premium-diamond ${className ?? ""}`}
    />
  );
}
