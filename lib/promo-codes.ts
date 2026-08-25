import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAdminFirestore } from "@/lib/firebase-admin";

export type PromoUsedBy = {
  piUsername: string;
  at: string;
};

export type PromoCodeRecord = {
  id: string;
  neonAmount: number;
  maxUses: number;
  usedCount: number;
  usedBy: PromoUsedBy[];
  usedByUsernames: string[];
  active: boolean;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string | null;
};

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "toDate" in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeRecord(id: string, data: Record<string, unknown>): PromoCodeRecord {
  const usedByRaw = Array.isArray(data.usedBy) ? data.usedBy : [];
  const usedBy: PromoUsedBy[] = usedByRaw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const rec = row as { piUsername?: unknown; at?: unknown };
      const piUsername = typeof rec.piUsername === "string" ? rec.piUsername : "";
      if (!piUsername) return null;
      return { piUsername, at: typeof rec.at === "string" ? rec.at : toIso(rec.at) || "" };
    })
    .filter((row): row is PromoUsedBy => !!row);
  const usedByUsernames = Array.isArray(data.usedByUsernames)
    ? data.usedByUsernames.filter((n): n is string => typeof n === "string")
    : usedBy.map((row) => row.piUsername);
  return {
    id,
    neonAmount: Math.max(0, Math.floor(Number(data.neonAmount || data.neon || 0))),
    maxUses: Math.max(1, Math.floor(Number(data.maxUses || 1))),
    usedCount: Math.max(0, Math.floor(Number(data.usedCount || 0))),
    usedBy,
    usedByUsernames,
    active: data.active !== false,
    expiresAt: toIso(data.expiresAt),
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
    createdAt: toIso(data.createdAt),
  };
}

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
}

export async function listPromoCodes(): Promise<PromoCodeRecord[]> {
  const admin = getAdminFirestore();
  if (admin) {
    const snap = await admin.collection("promoCodes").get();
    return snap.docs
      .map((d) => normalizeRecord(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }
  const snap = await getDocs(collection(db, "promoCodes"));
  return snap.docs
    .map((d) => normalizeRecord(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function createPromoCode(input: {
  code: string;
  neonAmount: number;
  maxUses: number;
  expiresAt?: string | null;
  createdBy: string;
}): Promise<PromoCodeRecord> {
  const id = normalizePromoCode(input.code);
  if (id.length < 3) throw new Error("Code must be at least 3 characters.");
  const neonAmount = Math.max(1, Math.floor(input.neonAmount));
  const maxUses = Math.max(1, Math.floor(input.maxUses));
  const payload = {
    neonAmount,
    maxUses,
    usedCount: 0,
    usedBy: [] as PromoUsedBy[],
    usedByUsernames: [] as string[],
    active: true,
    expiresAt: input.expiresAt || null,
    createdBy: input.createdBy,
    createdAt: new Date(),
  };
  const admin = getAdminFirestore();
  if (admin) {
    const ref = admin.collection("promoCodes").doc(id);
    const existing = await ref.get();
    if (existing.exists) throw new Error("That code already exists.");
    await ref.set(payload);
  } else {
    const ref = doc(db, "promoCodes", id);
    const existing = await getDoc(ref);
    if (existing.exists()) throw new Error("That code already exists.");
    await setDoc(ref, payload);
  }
  return normalizeRecord(id, { ...payload, createdAt: new Date().toISOString() });
}

export async function deactivatePromoCode(code: string): Promise<void> {
  const id = normalizePromoCode(code);
  const admin = getAdminFirestore();
  if (admin) {
    await admin.collection("promoCodes").doc(id).update({ active: false });
    return;
  }
  await updateDoc(doc(db, "promoCodes", id), { active: false });
}

export async function claimPromoCodeForUser(
  username: string,
  rawCode: string
): Promise<{ neonAmount: number; newBalance: number; message: string }> {
  const code = normalizePromoCode(rawCode);
  if (!code) throw Object.assign(new Error("Enter a promo code."), { status: 400 });
  const now = new Date();

  const admin = getAdminFirestore();
  if (admin) {
    return admin.runTransaction(async (tx) => {
      const codeRef = admin.collection("promoCodes").doc(code);
      const userRef = admin.collection("users").doc(username);
      const [codeSnap, userSnap] = await Promise.all([tx.get(codeRef), tx.get(userRef)]);
      if (!codeSnap.exists) throw Object.assign(new Error("Invalid promo code."), { status: 400 });
      const rec = normalizeRecord(code, codeSnap.data() as Record<string, unknown>);
      if (!rec.active) throw Object.assign(new Error("This code is no longer active."), { status: 400 });
      if (rec.expiresAt && Date.parse(rec.expiresAt) < now.getTime()) {
        throw Object.assign(new Error("This code has expired."), { status: 400 });
      }
      if (rec.usedByUsernames.some((n) => n.toLowerCase() === username.toLowerCase())) {
        throw Object.assign(new Error("You already claimed this code."), { status: 400 });
      }
      if (rec.usedCount >= rec.maxUses) {
        throw Object.assign(new Error("This code has reached its maximum uses."), { status: 400 });
      }
      const currentNeon = userSnap.exists
        ? Math.max(0, Math.floor(Number((userSnap.data() as { neonBalance?: number }).neonBalance || 0)))
        : 0;
      const newBalance = currentNeon + rec.neonAmount;
      const usedBy: PromoUsedBy = { piUsername: username, at: now.toISOString() };
      tx.set(
        codeRef,
        {
          usedCount: rec.usedCount + 1,
          usedByUsernames: [...rec.usedByUsernames, username],
          usedBy: [...rec.usedBy, usedBy],
        },
        { merge: true }
      );
      tx.set(
        userRef,
        {
          piUsername: username,
          neonBalance: newBalance,
          claimedPromoCodes: [...new Set([...(Array.isArray((userSnap.data() as { claimedPromoCodes?: string[] })?.claimedPromoCodes)
            ? (userSnap.data() as { claimedPromoCodes?: string[] }).claimedPromoCodes || []
            : []), code])],
          updatedAt: new Date(),
        },
        { merge: true }
      );
      return {
        neonAmount: rec.neonAmount,
        newBalance,
        message: `+${rec.neonAmount} Neon added to your balance.`,
      };
    });
  }

  const codeRef = doc(db, "promoCodes", code);
  const userRef = doc(db, "users", username);
  const [codeSnap, userSnap] = await Promise.all([getDoc(codeRef), getDoc(userRef)]);
  if (!codeSnap.exists()) throw Object.assign(new Error("Invalid promo code."), { status: 400 });
  const rec = normalizeRecord(code, codeSnap.data() as Record<string, unknown>);
  if (!rec.active) throw Object.assign(new Error("This code is no longer active."), { status: 400 });
  if (rec.expiresAt && Date.parse(rec.expiresAt) < now.getTime()) {
    throw Object.assign(new Error("This code has expired."), { status: 400 });
  }
  if (rec.usedByUsernames.some((n) => n.toLowerCase() === username.toLowerCase())) {
    throw Object.assign(new Error("You already claimed this code."), { status: 400 });
  }
  if (rec.usedCount >= rec.maxUses) {
    throw Object.assign(new Error("This code has reached its maximum uses."), { status: 400 });
  }
  const currentNeon = userSnap.exists()
    ? Math.max(0, Math.floor(Number((userSnap.data() as { neonBalance?: number }).neonBalance || 0)))
    : 0;
  const newBalance = currentNeon + rec.neonAmount;
  const usedBy: PromoUsedBy = { piUsername: username, at: now.toISOString() };
  const claimed = Array.isArray((userSnap.data() as { claimedPromoCodes?: string[] } | undefined)?.claimedPromoCodes)
    ? ([...(userSnap.data() as { claimedPromoCodes: string[] }).claimedPromoCodes] as string[])
    : [];
  if (!claimed.includes(code)) claimed.push(code);
  await updateDoc(codeRef, {
    usedCount: increment(1),
    usedByUsernames: [...rec.usedByUsernames, username],
    usedBy: [...rec.usedBy, usedBy],
  });
  await setDoc(
    userRef,
    {
      piUsername: username,
      neonBalance: newBalance,
      claimedPromoCodes: claimed,
      updatedAt: new Date(),
    },
    { merge: true }
  );
  return {
    neonAmount: rec.neonAmount,
    newBalance,
    message: `+${rec.neonAmount} Neon added to your balance.`,
  };
}
