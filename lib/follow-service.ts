import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { getUserProfile, type UserProfile } from "./firestore-service";

export interface FollowSnapshot {
  id: string;
  name?: string;
  photo?: string;
  avatar?: string;
  country?: string;
  age?: number;
}

export interface FollowRecord {
  id: string;
  followerId: string;
  followedId: string;
  followerName: string;
  followerPhoto: string;
  followerCountry: string;
  followerAge: number;
  followedName: string;
  followedPhoto: string;
  followedCountry: string;
  followedAge: number;
  createdAt?: unknown;
}

export interface FollowPerson {
  id: string;
  name: string;
  photo: string;
  country: string;
  age?: number;
}

export function followDocId(followerId: string, followedId: string) {
  return `${followerId}__${followedId}`;
}

function photoFromProfile(profile: UserProfile | null, fallback = ""): string {
  if (!profile) return fallback;
  const pic = profile.profilePicture?.trim();
  if (pic) return pic;
  const first = profile.photos?.find((p) => typeof p === "string" && p.trim());
  return first || fallback;
}

function snapshotFromProfile(profile: UserProfile | null, hint: FollowSnapshot): FollowPerson {
  const name =
    (profile?.fullName && profile.fullName.trim()) ||
    (hint.name && hint.name.trim()) ||
    hint.id;
  const country =
    (profile?.country && profile.country.trim()) ||
    (profile?.location && profile.location.trim()) ||
    (hint.country && hint.country.trim()) ||
    "";
  const ageRaw = profile?.age || hint.age;
  const age = typeof ageRaw === "number" && ageRaw > 0 ? ageRaw : undefined;
  return {
    id: hint.id,
    name,
    photo: photoFromProfile(profile, hint.photo || ""),
    country,
    age,
  };
}

function recordFromSnap(id: string, data: Record<string, unknown>): FollowRecord {
  return {
    id,
    followerId: String(data.followerId || ""),
    followedId: String(data.followedId || ""),
    followerName: String(data.followerName || ""),
    followerPhoto: String(data.followerPhoto || ""),
    followerCountry: String(data.followerCountry || ""),
    followerAge: typeof data.followerAge === "number" ? data.followerAge : 0,
    followedName: String(data.followedName || ""),
    followedPhoto: String(data.followedPhoto || ""),
    followedCountry: String(data.followedCountry || ""),
    followedAge: typeof data.followedAge === "number" ? data.followedAge : 0,
    createdAt: data.createdAt,
  };
}

export function personFromFollow(record: FollowRecord, meId: string): FollowPerson {
  const theyFollowMe = record.followedId === meId;
  return theyFollowMe
    ? {
        id: record.followerId,
        name: record.followerName || record.followerId,
        photo: record.followerPhoto || "",
        country: record.followerCountry || "",
        age: record.followerAge > 0 ? record.followerAge : undefined,
      }
    : {
        id: record.followedId,
        name: record.followedName || record.followedId,
        photo: record.followedPhoto || "",
        country: record.followedCountry || "",
        age: record.followedAge > 0 ? record.followedAge : undefined,
      };
}

export async function followUser(me: FollowSnapshot, other: FollowSnapshot) {
  if (!me.id || !other.id || me.id === other.id) return;
  const [meProfile, otherProfile] = await Promise.all([
    getUserProfile(me.id).catch(() => null),
    getUserProfile(other.id).catch(() => null),
  ]);
  const mine = snapshotFromProfile(meProfile, me);
  const theirs = snapshotFromProfile(otherProfile, other);
  const ref = doc(db, "follows", followDocId(me.id, other.id));
  await setDoc(ref, {
    followerId: me.id,
    followedId: other.id,
    followerName: mine.name,
    followerPhoto: mine.photo,
    followerCountry: mine.country,
    followerAge: mine.age || 0,
    followedName: theirs.name,
    followedPhoto: theirs.photo,
    followedCountry: theirs.country,
    followedAge: theirs.age || 0,
    createdAt: serverTimestamp(),
  });
  void import("@/lib/notifications")
    .then(({ notifyFollow }) =>
      notifyFollow({
        recipientId: other.id,
        actorId: me.id,
        actorName: mine.name,
        actorPhoto: mine.photo,
      })
    )
    .catch(() => {});
}

export async function unfollowUser(meId: string, otherId: string) {
  if (!meId || !otherId) return;
  await deleteDoc(doc(db, "follows", followDocId(meId, otherId)));
}

export function subscribeToFollowing(
  userId: string,
  cb: (rows: FollowRecord[]) => void
) {
  if (!userId) {
    cb([]);
    return () => {};
  }
  const q = query(collection(db, "follows"), where("followerId", "==", userId));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => recordFromSnap(d.id, d.data() as Record<string, unknown>));
      rows.sort((a, b) => {
        const am = (a.createdAt as { toMillis?: () => number })?.toMillis?.() || 0;
        const bm = (b.createdAt as { toMillis?: () => number })?.toMillis?.() || 0;
        return bm - am;
      });
      cb(rows);
    },
    () => cb([])
  );
}

export function subscribeToFollowers(
  userId: string,
  cb: (rows: FollowRecord[]) => void
) {
  if (!userId) {
    cb([]);
    return () => {};
  }
  const q = query(collection(db, "follows"), where("followedId", "==", userId));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => recordFromSnap(d.id, d.data() as Record<string, unknown>));
      rows.sort((a, b) => {
        const am = (a.createdAt as { toMillis?: () => number })?.toMillis?.() || 0;
        const bm = (b.createdAt as { toMillis?: () => number })?.toMillis?.() || 0;
        return bm - am;
      });
      cb(rows);
    },
    () => cb([])
  );
}

export function subscribeToOnlineMap(
  userIds: string[],
  cb: (online: Record<string, boolean>) => void
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) {
    cb({});
    return () => {};
  }
  const state: Record<string, boolean> = {};
  const unsubs = unique.map((id) =>
    onSnapshot(
      doc(db, "presence", id),
      (snap) => {
        const ts = (snap.data() as { lastSeen?: { toMillis?: () => number } } | undefined)?.lastSeen?.toMillis?.();
        state[id] = !!(ts && Date.now() - ts < 90_000);
        cb({ ...state });
      },
      () => {
        state[id] = false;
        cb({ ...state });
      }
    )
  );
  return () => unsubs.forEach((u) => u());
}
