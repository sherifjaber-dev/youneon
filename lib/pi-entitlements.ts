import { doc, getDoc, increment, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getNeonPackageById,
  NEON_PACK_METADATA_TYPE,
  PREMIUM_SUBSCRIBE_NEON,
  SUBSCRIPTION_PLAN,
} from "@/lib/product-config";
import type { PiPaymentDTO } from "@/lib/pi-types";

export type PremiumGrantResult = {
  granted: boolean;
  alreadyGranted: boolean;
  premiumUntil: string | null;
  neonGranted: number;
  skipped?: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function amountsMatch(a: number, b: number): boolean {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.0001;
}

function skipped(
  reason: string,
  premiumUntil: string | null = null
): PremiumGrantResult {
  return {
    granted: false,
    alreadyGranted: false,
    premiumUntil,
    neonGranted: 0,
    skipped: reason,
  };
}

export function isSubscriptionPayment(payment: PiPaymentDTO | null | undefined): boolean {
  if (!payment) return false;
  const metadata = payment.metadata || {};
  const planId = typeof metadata.planId === "string" ? metadata.planId : "";
  const type = typeof metadata.type === "string" ? metadata.type : "";
  const product = typeof metadata.product === "string" ? metadata.product : "";
  return (
    planId === SUBSCRIPTION_PLAN.id ||
    type === "subscription" ||
    product === SUBSCRIPTION_PLAN.name
  );
}

export function isNeonPackPayment(payment: PiPaymentDTO | null | undefined): boolean {
  if (!payment) return false;
  const metadata = payment.metadata || {};
  return metadata.type === NEON_PACK_METADATA_TYPE;
}

function nextPremiumUntil(existingUntil: unknown): string {
  const now = Date.now();
  const existingMs =
    typeof existingUntil === "string" ? Date.parse(existingUntil) : Number.NaN;
  const base = Number.isFinite(existingMs) && existingMs > now ? existingMs : now;
  return new Date(base + SUBSCRIPTION_PLAN.days * MS_PER_DAY).toISOString();
}

export async function grantPremiumIfNeeded(
  payment: PiPaymentDTO,
  username?: string | null
): Promise<PremiumGrantResult> {
  if (!payment?.identifier) {
    return skipped("missing_payment");
  }

  if (!isSubscriptionPayment(payment)) {
    return skipped("not_subscription");
  }

  if (!amountsMatch(Number(payment.amount), SUBSCRIPTION_PLAN.amount)) {
    console.warn("[Pi] skip premium grant: amount mismatch", payment.identifier);
    return skipped("amount_mismatch");
  }

  const paymentRef = doc(db, "pi_payments", payment.identifier);
  const existingPay = await getDoc(paymentRef);
  if (existingPay.exists() && existingPay.data()?.entitlementGranted) {
    const data = existingPay.data();
    const premiumUntil =
      typeof data?.premiumUntil === "string" ? data.premiumUntil : null;
    return {
      granted: false,
      alreadyGranted: true,
      premiumUntil,
      neonGranted: 0,
    };
  }

  const userUid = typeof payment.user_uid === "string" ? payment.user_uid : "";
  let currentUntil: unknown = null;
  if (userUid) {
    const userSnap = await getDoc(doc(db, "pi_users", userUid));
    currentUntil = userSnap.exists() ? userSnap.data()?.premiumUntil : null;
  }
  const premiumUntil = nextPremiumUntil(currentUntil);
  const now = Timestamp.now();
  const neonGranted = PREMIUM_SUBSCRIBE_NEON;

  await setDoc(
    paymentRef,
    {
      paymentId: payment.identifier,
      userUid,
      username: username || "",
      amount: payment.amount,
      memo: payment.memo,
      metadata: payment.metadata || {},
      txid: payment.transaction?.txid || null,
      entitlementGranted: true,
      premiumUntil,
      neonGranted,
      planId: SUBSCRIPTION_PLAN.id,
      grantedAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  if (userUid) {
    await setDoc(
      doc(db, "pi_users", userUid),
      {
        uid: userUid,
        username: username || "",
        premiumUntil,
        neonBalance: increment(neonGranted),
        lastPaymentId: payment.identifier,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  if (username) {
    await setDoc(
      doc(db, "users", username),
      {
        uid: userUid || undefined,
        piUsername: username,
        premiumUntil,
        neonBalance: increment(neonGranted),
        lastPaymentId: payment.identifier,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  return { granted: true, alreadyGranted: false, premiumUntil, neonGranted };
}

export async function grantNeonPackIfNeeded(
  payment: PiPaymentDTO,
  username?: string | null
): Promise<PremiumGrantResult> {
  if (!payment?.identifier) {
    return skipped("missing_payment");
  }

  if (!isNeonPackPayment(payment)) {
    return skipped("not_neon_pack");
  }

  const metadata = payment.metadata || {};
  const packageId = typeof metadata.packageId === "string" ? metadata.packageId : "";
  const pkg = getNeonPackageById(packageId);
  if (!pkg) {
    console.warn("[Pi] skip neon pack grant: unknown package", payment.identifier, packageId);
    return skipped("unknown_package");
  }

  const metaNeon =
    typeof metadata.neon === "number"
      ? metadata.neon
      : typeof metadata.neon === "string"
        ? Number(metadata.neon)
        : Number.NaN;
  if (!Number.isFinite(metaNeon) || metaNeon !== pkg.neon) {
    console.warn("[Pi] skip neon pack grant: neon mismatch", payment.identifier);
    return skipped("neon_mismatch");
  }

  if (!amountsMatch(Number(payment.amount), pkg.price)) {
    console.warn("[Pi] skip neon pack grant: amount mismatch", payment.identifier);
    return skipped("amount_mismatch");
  }

  const paymentRef = doc(db, "pi_payments", payment.identifier);
  const existingPay = await getDoc(paymentRef);
  if (existingPay.exists() && existingPay.data()?.entitlementGranted) {
    const data = existingPay.data();
    return {
      granted: false,
      alreadyGranted: true,
      premiumUntil: typeof data?.premiumUntil === "string" ? data.premiumUntil : null,
      neonGranted: 0,
    };
  }

  const userUid = typeof payment.user_uid === "string" ? payment.user_uid : "";
  const now = Timestamp.now();
  const neonGranted = pkg.neon;

  await setDoc(
    paymentRef,
    {
      paymentId: payment.identifier,
      userUid,
      username: username || "",
      amount: payment.amount,
      memo: payment.memo,
      metadata: payment.metadata || {},
      txid: payment.transaction?.txid || null,
      entitlementGranted: true,
      neonGranted,
      packageId: pkg.id,
      type: NEON_PACK_METADATA_TYPE,
      grantedAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  if (userUid) {
    await setDoc(
      doc(db, "pi_users", userUid),
      {
        uid: userUid,
        username: username || "",
        neonBalance: increment(neonGranted),
        lastPaymentId: payment.identifier,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  if (username) {
    await setDoc(
      doc(db, "users", username),
      {
        uid: userUid || undefined,
        piUsername: username,
        neonBalance: increment(neonGranted),
        lastPaymentId: payment.identifier,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  return { granted: true, alreadyGranted: false, premiumUntil: null, neonGranted };
}

export async function getPremiumUntil(userUid: string): Promise<string | null> {
  if (!userUid) return null;
  const snap = await getDoc(doc(db, "pi_users", userUid));
  if (!snap.exists()) return null;
  const until = snap.data()?.premiumUntil;
  return typeof until === "string" ? until : null;
}
