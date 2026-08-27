import { getAdminFirestore } from "@/lib/firebase-admin";
import { isFakeUserRecord, isReservedFakeId, recordHasDemoFlag } from "@/lib/real-pi-user";
import type { DocumentReference, Firestore } from "firebase-admin/firestore";

export type TestDataCleanupResult = {
  ok: true;
  deleted: {
    users: number;
    presence: number;
    matchQueue: number;
    conversations: number;
    follows: number;
    notifications: number;
    history: number;
  };
  deletedUserIds: string[];
};

const BATCH_LIMIT = 400;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function shouldDeleteUser(id: string, data: Record<string, unknown>): boolean {
  return isFakeUserRecord(id, data);
}

function shouldDeletePresenceOrQueue(id: string, data: Record<string, unknown>): boolean {
  if (recordHasDemoFlag(data)) return true;
  const userId = String(data.userId || data.piUsername || id || "").trim();
  return isReservedFakeId(id) || isReservedFakeId(userId) || isFakeUserRecord(id, data);
}

function shouldDeleteConversation(id: string, data: Record<string, unknown>): boolean {
  if (recordHasDemoFlag(data)) return true;
  const participants = Array.isArray(data.participants)
    ? data.participants.map((p) => String(p || ""))
    : [];
  if (participants.length > 0 && participants.every((p) => isReservedFakeId(p))) return true;
  if (participants.some((p) => isReservedFakeId(p))) return true;
  return isFakeUserRecord(id, data);
}

async function deleteQueryDocs(firestore: Firestore, refs: DocumentReference[]): Promise<number> {
  let deleted = 0;
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const chunk = refs.slice(i, i + BATCH_LIMIT);
    const batch = firestore.batch();
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
    deleted += chunk.length;
  }
  return deleted;
}

/**
 * One-shot admin cleanup. Deletes only docs clearly marked test/demo/seed
 * or using reserved fake ids (guest_demo, pi_user, anon, test_*, demo_*).
 * Never mass-deletes the users collection.
 */
export async function cleanupMarkedTestData(): Promise<TestDataCleanupResult> {
  const firestore = getAdminFirestore();
  if (!firestore) {
    throw new Error(
      "Firebase Admin is not configured on this host. Set FIREBASE_SERVICE_ACCOUNT (or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)."
    );
  }

  const deleted = {
    users: 0,
    presence: 0,
    matchQueue: 0,
    conversations: 0,
    follows: 0,
    notifications: 0,
    history: 0,
  };

  const usersSnap = await firestore.collection("users").get();
  const fakeUserIds: string[] = [];
  const userRefs: DocumentReference[] = [];
  usersSnap.forEach((doc) => {
    if (shouldDeleteUser(doc.id, asRecord(doc.data()))) {
      fakeUserIds.push(doc.id);
      userRefs.push(doc.ref);
    }
  });

  for (const userId of fakeUserIds) {
    const historySnap = await firestore.collection("users").doc(userId).collection("history").get();
    deleted.history += await deleteQueryDocs(
      firestore,
      historySnap.docs.map((d) => d.ref)
    );
  }
  deleted.users = await deleteQueryDocs(firestore, userRefs);

  const presenceSnap = await firestore.collection("presence").get();
  const presenceRefs: DocumentReference[] = [];
  presenceSnap.forEach((doc) => {
    if (shouldDeletePresenceOrQueue(doc.id, asRecord(doc.data()))) presenceRefs.push(doc.ref);
  });
  deleted.presence = await deleteQueryDocs(firestore, presenceRefs);

  const queueSnap = await firestore.collection("matchQueue").get();
  const queueRefs: DocumentReference[] = [];
  queueSnap.forEach((doc) => {
    if (shouldDeletePresenceOrQueue(doc.id, asRecord(doc.data()))) queueRefs.push(doc.ref);
  });
  deleted.matchQueue = await deleteQueryDocs(firestore, queueRefs);

  const convSnap = await firestore.collection("conversations").get();
  const convRefs: DocumentReference[] = [];
  convSnap.forEach((doc) => {
    if (shouldDeleteConversation(doc.id, asRecord(doc.data()))) convRefs.push(doc.ref);
  });
  deleted.conversations = await deleteQueryDocs(firestore, convRefs);

  const followSnap = await firestore.collection("follows").get();
  const followRefs: DocumentReference[] = [];
  followSnap.forEach((doc) => {
    const data = asRecord(doc.data());
    const followerId = String(data.followerId || "");
    const followedId = String(data.followedId || "");
    if (
      recordHasDemoFlag(data) ||
      isReservedFakeId(followerId) ||
      isReservedFakeId(followedId) ||
      fakeUserIds.includes(followerId) ||
      fakeUserIds.includes(followedId)
    ) {
      followRefs.push(doc.ref);
    }
  });
  deleted.follows = await deleteQueryDocs(firestore, followRefs);

  const notifSnap = await firestore.collection("notifications").get();
  const notifRefs: DocumentReference[] = [];
  notifSnap.forEach((doc) => {
    const data = asRecord(doc.data());
    const recipientId = String(data.recipientId || "");
    const actorId = String(data.actorId || "");
    if (
      recordHasDemoFlag(data) ||
      isReservedFakeId(recipientId) ||
      isReservedFakeId(actorId) ||
      fakeUserIds.includes(recipientId) ||
      fakeUserIds.includes(actorId)
    ) {
      notifRefs.push(doc.ref);
    }
  });
  deleted.notifications = await deleteQueryDocs(firestore, notifRefs);

  return { ok: true, deleted, deletedUserIds: fakeUserIds };
}
