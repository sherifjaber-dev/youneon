export const SUBSCRIPTION_PLAN = {
  id: "youneon_premium_subscribe",
  name: "YouNeon Premium / Subscribe",
  type: "subscription" as const,
  amount: 3.14,
  memo: "YouNeon Premium / Subscribe",
  days: 30,
};

export const SUBSCRIPTION_METADATA = {
  type: "subscription" as const,
  product: "YouNeon Premium / Subscribe",
  planId: SUBSCRIPTION_PLAN.id,
};

export function getSubscriptionPaymentData() {
  return {
    amount: SUBSCRIPTION_PLAN.amount,
    memo: SUBSCRIPTION_PLAN.memo,
    metadata: { ...SUBSCRIPTION_METADATA },
  };
}

export const PRODUCT_CONFIG = {
  PRODUCT_69daaa85b91f3a5af8ec7c8a: "69daaa85b91f3a5af8ec7c8a",
  PRODUCT_69dd44520ab51ee3bfd9d1a3: "69dd44520ab51ee3bfd9d1a3",
  PRODUCT_69dd4647b305049b353a135a: "69dd4647b305049b353a135a",
  PRODUCT_69dd46a45082cf43abbf2d4c: "69dd46a45082cf43abbf2d4c",
  PRODUCT_69dd486d14c858f28ed6665e: "69dd486d14c858f28ed6665e",
  PRODUCT_69e4617d66c511d037cd5de9: "69e4617d66c511d037cd5de9",
} as const;

export const NEON_PACKAGES = [
  {
    id: "neon_small",
    neon: 100,
    price: 1,
    badge: null,
  },
  {
    id: "neon_medium",
    neon: 500,
    price: 4,
    badge: "Popular",
  },
  {
    id: "neon_large",
    neon: 1000,
    price: 7,
    badge: "Best Value",
  },
  {
    id: "neon_xlarge",
    neon: 2500,
    price: 15,
    badge: null,
  },
  {
    id: "neon_mega",
    neon: 5000,
    price: 25,
    badge: "Top Deal",
  },
  {
    id: "neon_ultimate",
    neon: 10000,
    price: 40,
    badge: null,
  },
] as const;
