import { doc, getDoc, increment, setDoc } from "firebase/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";
import { getAdminFirestore } from "@/lib/firebase-admin";
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

async function readDoc(collectionName: string, id: string): Promise<Record<string, unknown> | null> {
  if (!id) return null;
  const admin = getAdminFirestore();
  if (admin) {
    const snap = await admin.collection(collectionName).doc(id).get();
    return snap.exists ? ((snap.data() || {}) as Record<string, unknown>) : null;
  }
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? ((snap.data() || {}) as Record<string, unknown>) : null;
}

function compact(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

async function mergeDoc(collectionName: string, id: string, data: Record<string, unknown>): Promise<void> {
  const payload = compact(data);
  const admin = getAdminFirestore();
  if (admin) {
    await admin.collection(collectionName).doc(id).set(payload, { merge: true });
    return;
  }
  await setDoc(doc(db, collectionName, id), payload, { merge: true });
}

async function mergeNeonGrant(
  collectionName: "pi_users" | "users",
  id: string,
  fields: Record<string, unknown>,
  neonGranted: number
): Promise<void> {
  const payload = compact({ ...fields, neonBalance: undefined });
  const admin = getAdminFirestore();
  if (admin) {
    await admin.collection(collectionName).doc(id).set(
      { ...payload, neonBalance: FieldValue.increment(neonGranted) },
      { merge: true }
    );
    return;
  }
  await setDoc(
    doc(db, collectionName, id),
    { ...payload, neonBalance: increment(neonGranted) },
    { merge: true }
  );
}

async function lookupUsername(userUid: string, sessionName?: string | null): Promise<string> {
  if (sessionName) return sessionName;
  if (!userUid) return "";
  const piUser = await readDoc("pi_users", userUid);
  const fromPi = typeof piUser?.username === "string" ? piUser.username.trim() : "";
  if (fromPi) return fromPi;
  const fromUser = typeof piUser?.piUsername === "string" ? piUser.piUsername.trim() : "";
  return fromUser;
}

function alreadyGrantedResult(data: Record<string, unknown> | null): PremiumGrantResult {
  return {
    granted: false,
    alreadyGranted: true,
    premiumUntil: typeof data?.premiumUntil === "string" ? data.premiumUntil : null,
    neonGranted: 0,
  };
}

async function persistGrant(opts: {
  payment: PiPaymentDTO;
  username: string;
  paymentFields: Record<string, unknown>;
  userFields: Record<string, unknown>;
  neonGranted: number;
}): Promise<void> {
  const { payment, username, paymentFields, userFields, neonGranted } = opts;
  const userUid = typeof payment.user_uid === "string" ? payment.user_uid : "";

  try {
    await mergeDoc("pi_payments", payment.identifier, paymentFields);
  } catch (error) {
    console.warn("[Pi] pi_payments write failed", error);
  }

  if (userUid) {
    try {
      await mergeNeonGrant("pi_users", userUid, userFields, neonGranted);
    } catch (error) {
      console.warn("[Pi] pi_users write failed", error);
    }
  }

  if (username) {
    await mergeNeonGrant("users", username, userFields, neonGranted);
  }
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

  const existingPay = await readDoc("pi_payments", payment.identifier);
  if (existingPay?.entitlementGranted) {
    return alreadyGrantedResult(existingPay);
  }

  const userUid = typeof payment.user_uid === "string" ? payment.user_uid : "";
  const resolvedUsername = await lookupUsername(userUid, username);
  if (resolvedUsername) {
    const userDoc = await readDoc("users", resolvedUsername);
    if (userDoc?.lastPaymentId === payment.identifier && userDoc?.entitlementGranted) {
      return alreadyGrantedResult(userDoc);
    }
  }

  let currentUntil: unknown = null;
  if (userUid) {
    const piUser = await readDoc("pi_users", userUid);
    currentUntil = piUser?.premiumUntil ?? null;
  }
  if (!currentUntil && resolvedUsername) {
    const userDoc = await readDoc("users", resolvedUsername);
    currentUntil = userDoc?.premiumUntil ?? null;
  }
  const premiumUntil = nextPremiumUntil(currentUntil);
  const now = new Date();
  const neonGranted = PREMIUM_SUBSCRIBE_NEON;

  await persistGrant({
    payment,
    username: resolvedUsername,
    neonGranted,
    paymentFields: {
      paymentId: payment.identifier,
      userUid,
      username: resolvedUsername,
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
    userFields: {
      uid: userUid || undefined,
      piUsername: resolvedUsername || undefined,
      username: resolvedUsername || undefined,
      premiumUntil,
      lastPaymentId: payment.identifier,
      entitlementGranted: true,
      updatedAt: now,
    },
  });

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

  const existingPay = await readDoc("pi_payments", payment.identifier);
  if (existingPay?.entitlementGranted) {
    return alreadyGrantedResult(existingPay);
  }

  const userUid = typeof payment.user_uid === "string" ? payment.user_uid : "";
  const resolvedUsername = await lookupUsername(userUid, username);
  if (resolvedUsername) {
    const userDoc = await readDoc("users", resolvedUsername);
    if (userDoc?.lastPaymentId === payment.identifier && userDoc?.entitlementGranted) {
      return alreadyGrantedResult(userDoc);
    }
  }

  const now = new Date();
  const neonGranted = pkg.neon;

  await persistGrant({
    payment,
    username: resolvedUsername,
    neonGranted,
    paymentFields: {
      paymentId: payment.identifier,
      userUid,
      username: resolvedUsername,
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
    userFields: {
      uid: userUid || undefined,
      piUsername: resolvedUsername || undefined,
      username: resolvedUsername || undefined,
      lastPaymentId: payment.identifier,
      entitlementGranted: true,
      updatedAt: now,
    },
  });

  return { granted: true, alreadyGranted: false, premiumUntil: null, neonGranted };
}

export async function getPremiumUntil(userUid: string): Promise<string | null> {
  if (!userUid) return null;
  const data = await readDoc("pi_users", userUid);
  const until = data?.premiumUntil;
  return typeof until === "string" ? until : null;
}
