import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
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
    photo: photoFromProfile(profile, hint.photo || hint.avatar || ""),
    country,
    age,
  };
}

function createdAtMs(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    const ms = (value as { toMillis: () => number }).toMillis();
    if (typeof ms === "number" && Number.isFinite(ms)) return ms;
  }
  if (typeof value === "number" && Number.isFinite(value)) return value;
  // Pending server timestamps should sort as newest, not oldest.
  return Number.MAX_SAFE_INTEGER;
}

function sortNewest(rows: FollowRecord[]) {
  return [...rows].sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt));
}

function recordFromSnap(id: string, data: Record<string, unknown>): FollowRecord {
  const followerId = String(data.followerId || "");
  const followedId = String(data.followedId || "");
  return {
    id,
    followerId,
    followedId,
    followerName: String(data.followerName || data.name || ""),
    followerPhoto: String(data.followerPhoto || data.photo || ""),
    followerCountry: String(data.followerCountry || data.country || ""),
    followerAge:
      typeof data.followerAge === "number"
        ? data.followerAge
        : typeof data.age === "number"
          ? data.age
          : 0,
    followedName: String(data.followedName || data.name || ""),
    followedPhoto: String(data.followedPhoto || data.photo || ""),
    followedCountry: String(data.followedCountry || data.country || ""),
    followedAge:
      typeof data.followedAge === "number"
        ? data.followedAge
        : typeof data.age === "number"
          ? data.age
          : 0,
    createdAt: data.createdAt ?? data.createdAtMs,
  };
}

function recordFromEdgeDoc(
  id: string,
  data: Record<string, unknown>,
  side: "following" | "followers"
): FollowRecord {
  const followerId = String(data.followerId || (side === "followers" ? id : ""));
  const followedId = String(data.followedId || (side === "following" ? id : ""));
  const name = String(data.name || "");
  const photo = String(data.photo || "");
  const country = String(data.country || "");
  const age = typeof data.age === "number" ? data.age : 0;
  const base = recordFromSnap(`${followerId}__${followedId}` || id, data);
  if (side === "following") {
    return {
      ...base,
      followerId,
      followedId: followedId || id,
      followedName: String(data.followedName || name || followedId || id),
      followedPhoto: String(data.followedPhoto || photo),
      followedCountry: String(data.followedCountry || country),
      followedAge: typeof data.followedAge === "number" ? data.followedAge : age,
    };
  }
  return {
    ...base,
    followerId: followerId || id,
    followedId,
    followerName: String(data.followerName || name || followerId || id),
    followerPhoto: String(data.followerPhoto || photo),
    followerCountry: String(data.followerCountry || country),
    followerAge: typeof data.followerAge === "number" ? data.followerAge : age,
  };
}

export function personFromFollow(record: FollowRecord, meId: string): FollowPerson {
  const theyFollowMe = record.followedId === meId && record.followerId !== meId;
  return theyFollowMe
    ? {
        id: record.followerId,
        name: record.followerName || record.followerId,
        photo: record.followerPhoto || "",
        country: record.followerCountry || "",
        age: record.followerAge > 0 ? record.followerAge : undefined,
      }
    : {
        id: record.followedId || record.id,
        name: record.followedName || record.followedId,
        photo: record.followedPhoto || "",
        country: record.followedCountry || "",
        age: record.followedAge > 0 ? record.followedAge : undefined,
      };
}

function mergeFollowRecords(groups: Array<FollowRecord[] | null>): FollowRecord[] {
  const map = new Map<string, FollowRecord>();
  groups.forEach((group) => {
    (group || []).forEach((row) => {
      const key = row.followedId && row.followerId
        ? `${row.followerId}__${row.followedId}`
        : row.id;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, row);
        return;
      }
      map.set(key, {
        ...prev,
        ...row,
        followerName: row.followerName || prev.followerName,
        followerPhoto: row.followerPhoto || prev.followerPhoto,
        followerCountry: row.followerCountry || prev.followerCountry,
        followerAge: row.followerAge || prev.followerAge,
        followedName: row.followedName || prev.followedName,
        followedPhoto: row.followedPhoto || prev.followedPhoto,
        followedCountry: row.followedCountry || prev.followedCountry,
        followedAge: row.followedAge || prev.followedAge,
        createdAt: row.createdAt || prev.createdAt,
      });
    });
  });
  return sortNewest([...map.values()]);
}

async function upsertUserMap(
  userId: string,
  mapField: "followingMap" | "followerMap",
  personId: string,
  entry: Record<string, unknown> | null
) {
  const ref = doc(db, "users", userId);
  const path = `${mapField}.${personId}`;
  try {
    await updateDoc(ref, { [path]: entry === null ? deleteField() : entry });
  } catch {
    if (entry === null) return;
    await setDoc(ref, { [mapField]: { [personId]: entry } }, { merge: true });
  }
}

async function writeBestEffort(writes: Array<Promise<unknown>>) {
  const results = await Promise.allSettled(writes);
  const ok = results.some((r) => r.status === "fulfilled");
  if (!ok) {
    const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    throw failed?.reason || new Error("follow write failed");
  }
  results.forEach((r) => {
    if (r.status === "rejected") console.warn("follow write partial fail", r.reason);
  });
}

export async function followUser(me: FollowSnapshot, other: FollowSnapshot) {
  if (!me.id || !other.id || me.id === other.id) return;
  const [meProfile, otherProfile] = await Promise.all([
    getUserProfile(me.id).catch(() => null),
    getUserProfile(other.id).catch(() => null),
  ]);
  const mine = snapshotFromProfile(meProfile, me);
  const theirs = snapshotFromProfile(otherProfile, other);
  const createdAt = serverTimestamp();
  const edge = {
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
    createdAt,
  };

  // Write under the user doc (same path family as History) AND the top-level
  // follows collection. Either path is enough for the Messages strip to read.
  const followingEntry = {
    id: other.id,
    name: theirs.name,
    photo: theirs.photo,
    country: theirs.country,
    age: theirs.age || 0,
    followerId: me.id,
    followedId: other.id,
    createdAtMs: Date.now(),
  };
  const followerEntry = {
    id: me.id,
    name: mine.name,
    photo: mine.photo,
    country: mine.country,
    age: mine.age || 0,
    followerId: me.id,
    followedId: other.id,
    createdAtMs: Date.now(),
  };

  await writeBestEffort([
    setDoc(doc(db, "users", me.id, "following", other.id), {
      ...edge,
      ...followingEntry,
    }),
    setDoc(doc(db, "users", other.id, "followers", me.id), {
      ...edge,
      ...followerEntry,
    }),
    setDoc(doc(db, "follows", followDocId(me.id, other.id)), edge),
    upsertUserMap(me.id, "followingMap", other.id, followingEntry as Record<string, unknown>),
    upsertUserMap(other.id, "followerMap", me.id, followerEntry as Record<string, unknown>),
  ]);

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
  await writeBestEffort([
    deleteDoc(doc(db, "users", meId, "following", otherId)),
    deleteDoc(doc(db, "users", otherId, "followers", meId)),
    deleteDoc(doc(db, "follows", followDocId(meId, otherId))),
    upsertUserMap(meId, "followingMap", otherId, null),
    upsertUserMap(otherId, "followerMap", meId, null),
  ]);
}

function subscribeMerged(
  userId: string,
  side: "following" | "followers",
  cb: (rows: FollowRecord[]) => void
): Unsubscribe {
  if (!userId) {
    cb([]);
    return () => {};
  }

  let fromUser: FollowRecord[] | null = null;
  let fromTop: FollowRecord[] | null = null;
  let fromMap: FollowRecord[] | null = null;

  const emit = () => {
    const sources = [fromTop, fromUser, fromMap];
    const reported = sources.filter((s) => s !== null);
    if (reported.length === 0) return;
    const hasPeople = reported.some((s) => (s as FollowRecord[]).length > 0);
    if (!hasPeople && reported.length < sources.length) return;
    cb(mergeFollowRecords(sources));
  };

  const timer = setTimeout(() => {
    if (fromUser === null) fromUser = [];
    if (fromTop === null) fromTop = [];
    if (fromMap === null) fromMap = [];
    emit();
  }, 4000);

  const unsubUser = onSnapshot(
    collection(db, "users", userId, side),
    (snap) => {
      fromUser = snap.docs.map((d) =>
        recordFromEdgeDoc(d.id, d.data() as Record<string, unknown>, side)
      );
      emit();
    },
    (err) => {
      console.warn(`${side} user-subcollection subscribe failed`, err);
      fromUser = [];
      emit();
    }
  );

  const field = side === "following" ? "followerId" : "followedId";
  const unsubTop = onSnapshot(
    query(collection(db, "follows"), where(field, "==", userId)),
    (snap) => {
      fromTop = snap.docs.map((d) => recordFromSnap(d.id, d.data() as Record<string, unknown>));
      emit();
    },
    (err) => {
      console.warn(`${side} follows-collection subscribe failed`, err);
      fromTop = [];
      emit();
    }
  );

  const mapField = side === "following" ? "followingMap" : "followerMap";
  const unsubMap = onSnapshot(
    doc(db, "users", userId),
    (snap) => {
      const data = (snap.data() || {}) as Record<string, unknown>;
      const raw = data[mapField];
      const map =
        raw && typeof raw === "object" && !Array.isArray(raw)
          ? (raw as Record<string, Record<string, unknown>>)
          : {};
      fromMap = Object.entries(map)
        .filter(([, value]) => !!value && typeof value === "object")
        .map(([id, value]) => recordFromEdgeDoc(id, value, side));
      emit();
    },
    (err) => {
      console.warn(`${side} user-map subscribe failed`, err);
      fromMap = [];
      emit();
    }
  );

  return () => {
    clearTimeout(timer);
    unsubUser();
    unsubTop();
    unsubMap();
  };
}

export function subscribeToFollowing(
  userId: string,
  cb: (rows: FollowRecord[]) => void
) {
  return subscribeMerged(userId, "following", cb);
}

export function subscribeToFollowers(
  userId: string,
  cb: (rows: FollowRecord[]) => void
) {
  return subscribeMerged(userId, "followers", cb);
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
