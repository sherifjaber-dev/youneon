import { getAdminFirestore } from "@/lib/firebase-admin";
import {
  isFakeDisplayName,
  isFakeUserRecord,
  isHiddenSocialPeer,
  isProtectedPiUsername,
  isReservedFakeId,
  recordHasDemoFlag,
} from "@/lib/real-pi-user";
import { FieldValue, type DocumentReference, type Firestore } from "firebase-admin/firestore";

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

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item || "")) : [];
}

function shouldDeleteUser(id: string, data: Record<string, unknown>): boolean {
  if (isProtectedPiUsername(id)) return false;
  return isFakeUserRecord(id, data);
}

function shouldDeletePresenceOrQueue(id: string, data: Record<string, unknown>): boolean {
  if (isProtectedPiUsername(id)) return false;
  if (recordHasDemoFlag(data)) return true;
  const userId = String(data.userId || data.piUsername || id || "").trim();
  const name = String(data.fullName || data.displayName || data.name || "").trim();
  return isHiddenSocialPeer(id, name) || isHiddenSocialPeer(userId, name) || isFakeUserRecord(id, data);
}

function shouldDeleteConversation(id: string, data: Record<string, unknown>): boolean {
  if (recordHasDemoFlag(data)) return true;
  const participants = stringList(data.participants);
  const names = asRecord(data.participantNames);
  if (participants.some((p) => isHiddenSocialPeer(p, String(names[p] || "")))) return true;
  return isFakeUserRecord(id, data);
}

function shouldDeleteFollow(data: Record<string, unknown>, fakeUserIds: string[]): boolean {
  if (recordHasDemoFlag(data)) return true;
  const followerId = String(data.followerId || "");
  const followedId = String(data.followedId || "");
  const followerName = String(data.followerName || "");
  const followedName = String(data.followedName || data.name || "");
  if (isHiddenSocialPeer(followerId, followerName) || isHiddenSocialPeer(followedId, followedName)) {
    return true;
  }
  return fakeUserIds.includes(followerId) || fakeUserIds.includes(followedId);
}

function historyRowHidden(id: string, data: Record<string, unknown>): boolean {
  const matchId = String(data.matchId || id || "");
  const name = String(data.name || data.fullName || "");
  return isHiddenSocialPeer(matchId, name) || isFakeDisplayName(name);
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
 * One-shot admin cleanup. Deletes seeded Lucas/Marcus/Sofia docs, demo/guest/test
 * flags, and launch-test History/Messages/follows. Never deletes Sherifjaber.
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
  const allUserIds: string[] = [];
  usersSnap.forEach((docSnap) => {
    allUserIds.push(docSnap.id);
    if (shouldDeleteUser(docSnap.id, asRecord(docSnap.data()))) {
      fakeUserIds.push(docSnap.id);
      userRefs.push(docSnap.ref);
    }
  });

  for (const userId of allUserIds) {
    const userDoc = firestore.collection("users").doc(userId);
    const historySnap = await userDoc.collection("history").get();
    const historyRefs = historySnap.docs
      .filter((row) => historyRowHidden(row.id, asRecord(row.data())))
      .map((row) => row.ref);
    deleted.history += await deleteQueryDocs(firestore, historyRefs);

    const followingSnap = await userDoc.collection("following").get();
    const followingRefs = followingSnap.docs
      .filter((row) => {
        const data = asRecord(row.data());
        const otherId = String(data.followedId || data.id || row.id || "");
        return isHiddenSocialPeer(otherId, String(data.followedName || data.name || ""));
      })
      .map((row) => row.ref);
    deleted.follows += await deleteQueryDocs(firestore, followingRefs);

    const followersSnap = await userDoc.collection("followers").get();
    const followerRefs = followersSnap.docs
      .filter((row) => {
        const data = asRecord(row.data());
        const otherId = String(data.followerId || data.id || row.id || "");
        return isHiddenSocialPeer(otherId, String(data.followerName || data.name || ""));
      })
      .map((row) => row.ref);
    deleted.follows += await deleteQueryDocs(firestore, followerRefs);

    const viewsSnap = await userDoc.collection("profileViews").get();
    const viewRefs = viewsSnap.docs
      .filter((row) => {
        const data = asRecord(row.data());
        return isHiddenSocialPeer(String(data.viewerId || row.id || ""), String(data.name || ""));
      })
      .map((row) => row.ref);
    await deleteQueryDocs(firestore, viewRefs);

  }

  for (const userId of allUserIds) {
    const snap = usersSnap.docs.find((d) => d.id === userId);
    const data = asRecord(snap?.data());
    const updates: Record<string, FieldValue> = {};
    const followingMap = asRecord(data.followingMap);
    const followerMap = asRecord(data.followerMap);
    Object.entries(followingMap).forEach(([otherId, value]) => {
      const entry = asRecord(value);
      if (isHiddenSocialPeer(otherId, String(entry.name || entry.followedName || ""))) {
        updates[`followingMap.${otherId}`] = FieldValue.delete();
      }
    });
    Object.entries(followerMap).forEach(([otherId, value]) => {
      const entry = asRecord(value);
      if (isHiddenSocialPeer(otherId, String(entry.name || entry.followerName || ""))) {
        updates[`followerMap.${otherId}`] = FieldValue.delete();
      }
    });
    if (Object.keys(updates).length > 0) {
      await firestore.collection("users").doc(userId).update(updates);
    }
  }

  deleted.users = await deleteQueryDocs(firestore, userRefs);

  const presenceSnap = await firestore.collection("presence").get();
  const presenceRefs: DocumentReference[] = [];
  presenceSnap.forEach((docSnap) => {
    if (shouldDeletePresenceOrQueue(docSnap.id, asRecord(docSnap.data()))) presenceRefs.push(docSnap.ref);
  });
  deleted.presence = await deleteQueryDocs(firestore, presenceRefs);

  const queueSnap = await firestore.collection("matchQueue").get();
  const queueRefs: DocumentReference[] = [];
  queueSnap.forEach((docSnap) => {
    if (shouldDeletePresenceOrQueue(docSnap.id, asRecord(docSnap.data()))) queueRefs.push(docSnap.ref);
  });
  deleted.matchQueue = await deleteQueryDocs(firestore, queueRefs);

  const convSnap = await firestore.collection("conversations").get();
  const convRefs: DocumentReference[] = [];
  for (const docSnap of convSnap.docs) {
    if (!shouldDeleteConversation(docSnap.id, asRecord(docSnap.data()))) continue;
    const msgs = await docSnap.ref.collection("messages").get();
    await deleteQueryDocs(
      firestore,
      msgs.docs.map((row) => row.ref)
    );
    convRefs.push(docSnap.ref);
  }
  deleted.conversations = await deleteQueryDocs(firestore, convRefs);

  const followSnap = await firestore.collection("follows").get();
  const followRefs: DocumentReference[] = [];
  followSnap.forEach((docSnap) => {
    if (shouldDeleteFollow(asRecord(docSnap.data()), fakeUserIds)) followRefs.push(docSnap.ref);
  });
  deleted.follows += await deleteQueryDocs(firestore, followRefs);

  const notifSnap = await firestore.collection("notifications").get();
  const notifRefs: DocumentReference[] = [];
  notifSnap.forEach((docSnap) => {
    const data = asRecord(docSnap.data());
    const recipientId = String(data.recipientId || "");
    const actorId = String(data.actorId || "");
    const actorName = String(data.actorName || "");
    if (
      recordHasDemoFlag(data) ||
      isReservedFakeId(recipientId) ||
      isHiddenSocialPeer(actorId, actorName) ||
      fakeUserIds.includes(recipientId) ||
      fakeUserIds.includes(actorId)
    ) {
      notifRefs.push(docSnap.ref);
    }
  });
  deleted.notifications = await deleteQueryDocs(firestore, notifRefs);

  return { ok: true, deleted, deletedUserIds: fakeUserIds };
}
