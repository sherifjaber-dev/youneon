import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SUBSCRIPTION_PLAN } from "@/lib/product-config";
import type { PiPaymentDTO } from "@/lib/pi-types";

export type PremiumGrantResult = {
  granted: boolean;
  alreadyGranted: boolean;
  premiumUntil: string | null;
  skipped?: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function amountsMatch(a: number, b: number): boolean {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.0001;
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
    return { granted: false, alreadyGranted: false, premiumUntil: null, skipped: "missing_payment" };
  }

  if (!isSubscriptionPayment(payment)) {
    return { granted: false, alreadyGranted: false, premiumUntil: null, skipped: "not_subscription" };
  }

  if (!amountsMatch(Number(payment.amount), SUBSCRIPTION_PLAN.amount)) {
    console.warn("[Pi] skip premium grant: amount mismatch", payment.identifier);
    return { granted: false, alreadyGranted: false, premiumUntil: null, skipped: "amount_mismatch" };
  }

  const paymentRef = doc(db, "pi_payments", payment.identifier);
  const existingPay = await getDoc(paymentRef);
  if (existingPay.exists() && existingPay.data()?.entitlementGranted) {
    const premiumUntil =
      typeof existingPay.data()?.premiumUntil === "string"
        ? existingPay.data()?.premiumUntil
        : null;
    return { granted: false, alreadyGranted: true, premiumUntil };
  }

  const userUid = typeof payment.user_uid === "string" ? payment.user_uid : "";
  let currentUntil: unknown = null;
  if (userUid) {
    const userSnap = await getDoc(doc(db, "pi_users", userUid));
    currentUntil = userSnap.exists() ? userSnap.data()?.premiumUntil : null;
  }
  const premiumUntil = nextPremiumUntil(currentUntil);
  const now = Timestamp.now();

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
        lastPaymentId: payment.identifier,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  return { granted: true, alreadyGranted: false, premiumUntil };
}

export async function getPremiumUntil(userUid: string): Promise<string | null> {
  if (!userUid) return null;
  const snap = await getDoc(doc(db, "pi_users", userUid));
  if (!snap.exists()) return null;
  const until = snap.data()?.premiumUntil;
  return typeof until === "string" ? until : null;
}
