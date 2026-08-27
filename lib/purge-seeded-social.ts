"use client";

import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { unfollowUser } from "@/lib/follow-service";
import { isHiddenSocialPeer, isRealPiUsername } from "@/lib/real-pi-user";

const PURGE_VERSION = "3";
const PURGE_FLAG_PREFIX = "youneon_seeded_social_purge_v";
const LOCAL_KEYS_TO_DROP = [
  "youneon_friends",
  "youneon_conversations",
  "youneon_history",
  "youneon_messages",
  "youneon_follows",
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item || "")) : [];
}

export function clearSeededLocalCaches() {
  if (typeof window === "undefined") return;
  LOCAL_KEYS_TO_DROP.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  });
  try {
    localStorage.setItem(`${PURGE_FLAG_PREFIX}local`, PURGE_VERSION);
  } catch {
    /* ignore */
  }
}

function alreadyPurged(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(`${PURGE_FLAG_PREFIX}${userId}`) === PURGE_VERSION;
  } catch {
    return false;
  }
}

function markPurged(userId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PURGE_FLAG_PREFIX}${userId}`, PURGE_VERSION);
  } catch {
    /* ignore */
  }
}

async function deleteCollectionDocs(
  refs: Array<ReturnType<typeof doc>>
): Promise<void> {
  await Promise.all(refs.map((ref) => deleteDoc(ref).catch(() => {})));
}

/**
 * One-shot per logged-in Pi user: drop seeded History / Messages / follows
 * (Lucas, Marcus, Sofia, launch-test threads). Never touches Sherifjaber as a
 * user doc — only social rows on this account.
 */
export async function purgeSeededSocialForUser(userId: string): Promise<void> {
  clearSeededLocalCaches();
  const me = (userId || "").trim();
  if (!isRealPiUsername(me)) return;
  if (alreadyPurged(me)) return;

  const hiddenPeer = (id?: string | null, name?: string | null) => {
    if (!id && !name) return false;
    if (id && id === me) return false;
    return isHiddenSocialPeer(id, name);
  };

  try {
    const historySnap = await getDocs(collection(db, "users", me, "history"));
    await deleteCollectionDocs(
      historySnap.docs
        .filter((row) => {
          const data = asRecord(row.data());
          const matchId = String(data.matchId || row.id || "");
          const name = String(data.name || data.fullName || "");
          return hiddenPeer(matchId, name);
        })
        .map((row) => row.ref)
    );

    const viewsSnap = await getDocs(collection(db, "users", me, "profileViews"));
    await deleteCollectionDocs(
      viewsSnap.docs
        .filter((row) => {
          const data = asRecord(row.data());
          const viewerId = String(data.viewerId || row.id || "");
          const name = String(data.name || "");
          return hiddenPeer(viewerId, name);
        })
        .map((row) => row.ref)
    );

    const followingSnap = await getDocs(collection(db, "users", me, "following"));
    const fakeFollowing = followingSnap.docs.filter((row) => {
      const data = asRecord(row.data());
      const otherId = String(data.followedId || data.id || row.id || "");
      const name = String(data.followedName || data.name || "");
      return hiddenPeer(otherId, name);
    });
    for (const row of fakeFollowing) {
      const data = asRecord(row.data());
      const otherId = String(data.followedId || data.id || row.id || "");
      if (otherId) await unfollowUser(me, otherId).catch(() => {});
    }

    const followersSnap = await getDocs(collection(db, "users", me, "followers"));
    const fakeFollowers = followersSnap.docs.filter((row) => {
      const data = asRecord(row.data());
      const otherId = String(data.followerId || data.id || row.id || "");
      const name = String(data.followerName || data.name || "");
      return hiddenPeer(otherId, name);
    });
    for (const row of fakeFollowers) {
      const data = asRecord(row.data());
      const otherId = String(data.followerId || data.id || row.id || "");
      if (otherId) await unfollowUser(otherId, me).catch(() => {});
    }

    const convSnap = await getDocs(
      query(collection(db, "conversations"), where("participants", "array-contains", me))
    );
    for (const row of convSnap.docs) {
      const data = asRecord(row.data());
      const participants = stringList(data.participants);
      const names = asRecord(data.participantNames);
      const otherId = participants.find((id) => id && id !== me) || "";
      const otherName = String(names[otherId] || "");
      if (!hiddenPeer(otherId, otherName) && !participants.some((id) => hiddenPeer(id))) continue;
      const msgs = await getDocs(collection(db, "conversations", row.id, "messages"));
      await deleteCollectionDocs(msgs.docs.map((msg) => msg.ref));
      await deleteDoc(row.ref).catch(() => {});
    }

    const notifSnap = await getDocs(
      query(collection(db, "notifications"), where("recipientId", "==", me))
    );
    await deleteCollectionDocs(
      notifSnap.docs
        .filter((row) => {
          const data = asRecord(row.data());
          const actorId = String(data.actorId || "");
          const actorName = String(data.actorName || "");
          return hiddenPeer(actorId, actorName);
        })
        .map((row) => row.ref)
    );

    const mapUpdates: Record<string, ReturnType<typeof deleteField>> = {};
    followingSnap.docs.forEach((row) => {
      const data = asRecord(row.data());
      const otherId = String(data.followedId || data.id || row.id || "");
      if (hiddenPeer(otherId, String(data.followedName || data.name || ""))) {
        mapUpdates[`followingMap.${otherId}`] = deleteField();
      }
    });
    followersSnap.docs.forEach((row) => {
      const data = asRecord(row.data());
      const otherId = String(data.followerId || data.id || row.id || "");
      if (hiddenPeer(otherId, String(data.followerName || data.name || ""))) {
        mapUpdates[`followerMap.${otherId}`] = deleteField();
      }
    });
    if (Object.keys(mapUpdates).length > 0) {
      await updateDoc(doc(db, "users", me), mapUpdates).catch(() => {});
    }

    markPurged(me);
  } catch (error) {
    console.warn("purgeSeededSocialForUser failed", error);
  }
}
