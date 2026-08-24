export const PREMIUM_GRANTED_EVENT = "youneon:premium-granted";
export const PREMIUM_UNTIL_KEY = "youneon_premium_until";
export const NEON_BALANCE_KEY = "youneon_neon_balance";

export type PremiumGrantedDetail = {
  premiumUntil: string | null;
  neonGranted: number;
  alreadyGranted: boolean;
};

export function isPremiumActive(premiumUntil?: string | null): boolean {
  if (!premiumUntil) return false;
  const ms = Date.parse(premiumUntil);
  return Number.isFinite(ms) && ms > Date.now();
}

export function readStoredPremiumUntil(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(PREMIUM_UNTIL_KEY);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function persistPremiumUntil(premiumUntil: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (premiumUntil) localStorage.setItem(PREMIUM_UNTIL_KEY, premiumUntil);
    else localStorage.removeItem(PREMIUM_UNTIL_KEY);
  } catch {
    /* ignore */
  }
}

export function readStoredNeonBalance(fallback = 100): number {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(NEON_BALANCE_KEY);
    if (!raw) return fallback;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

export function persistNeonBalance(balance: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NEON_BALANCE_KEY, String(Math.max(0, Math.floor(balance))));
  } catch {
    /* ignore */
  }
}

export function emitPremiumGranted(detail: PremiumGrantedDetail) {
  if (typeof window === "undefined") return;
  if (detail.premiumUntil) persistPremiumUntil(detail.premiumUntil);
  if (detail.neonGranted > 0 && !detail.alreadyGranted) {
    persistNeonBalance(readStoredNeonBalance() + detail.neonGranted);
  }
  window.dispatchEvent(new CustomEvent(PREMIUM_GRANTED_EVENT, { detail }));
}
