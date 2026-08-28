export const SUBSCRIPTION_PLAN = {
  id: "youneon_premium_subscribe",
  name: "YouNeon Premium / Subscribe",
  type: "subscription" as const,
  amount: 1,
  memo: "YouNeon Premium / Subscribe",
  days: 30,
};

export const PREMIUM_SUBSCRIBE_NEON = 2000;

export const GENDER_FILTER_NEON = 25;
export const COUNTRY_FILTER_NEON = 25;
export const CHAT_UNLOCK_NEON = 50;

export const PREMIUM_BENEFITS = [
  {
    title: "Two chat unlocks a day",
    detail: "Start two new conversations each day. They stay open.",
  },
  {
    title: "Gender and country filters",
    detail: "Match on your terms, included with membership.",
  },
  {
    title: "Priority matching",
    detail: "Skip ahead in the queue.",
  },
  {
    title: "Ad-free",
    detail: "No banners while your membership is active.",
  },
  {
    title: "Premium badge",
    detail: "A crown on your profile, header, and chats.",
  },
  {
    title: "2,000 Neon included",
    detail: "Added to your balance on every subscribe or renew.",
  },
  {
    title: "Front and rear camera",
    detail: "Switch cameras during a live call.",
  },
] as const;

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

export const NEON_PACK_METADATA_TYPE = "neon_pack" as const;

export const NEON_PACKAGES = [
  {
    id: "neon_starter",
    neon: 500,
    price: 0.19,
    badge: null,
  },
  {
    id: "neon_small",
    neon: 1000,
    price: 0.31,
    badge: null,
  },
  {
    id: "neon_2k",
    neon: 2000,
    price: 0.55,
    badge: null,
  },
  {
    id: "neon_medium",
    neon: 3000,
    price: 0.69,
    badge: "Popular",
  },
  {
    id: "neon_large",
    neon: 5000,
    price: 0.99,
    badge: "Best Value",
  },
  {
    id: "neon_xl",
    neon: 10000,
    price: 1.79,
    badge: null,
  },
] as const;

export type NeonPackageId = (typeof NEON_PACKAGES)[number]["id"];
export type NeonPackage = (typeof NEON_PACKAGES)[number];

export function getNeonPackageById(packageId: string): NeonPackage | null {
  return NEON_PACKAGES.find((pkg) => pkg.id === packageId) ?? null;
}

export function getNeonPackPaymentData(packageId: string) {
  const pkg = getNeonPackageById(packageId);
  if (!pkg) return null;
  return {
    amount: pkg.price,
    memo: `YouNeon Neon Pack · ${pkg.neon.toLocaleString("en-US")} Neon`,
    metadata: {
      type: NEON_PACK_METADATA_TYPE,
      packageId: pkg.id,
      neon: pkg.neon,
    },
  };
}
