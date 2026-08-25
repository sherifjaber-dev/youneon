import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";

const QUEUE = "matchQueue";
const WAIT_WINDOW_MS = 60_000;

export type MatchFilters = {
  gender: "women" | "men" | "both";
  country: string;
};

export type QueueProfile = {
  userId: string;
  name: string;
  avatar?: string;
  age?: number;
  country?: string;
  gender?: string;
  bio?: string;
  interests?: string[];
};

export type MatchSession = {
  roomUrl: string;
  queueId: string;
  partner: QueueProfile | null;
  role: "waiting" | "matched";
};

function normalizeGender(g?: string): "women" | "men" | "other" | "unknown" {
  if (!g) return "unknown";
  const x = g.trim().toLowerCase();
  if (["women", "woman", "female", "f", "girl", "girls"].includes(x)) return "women";
  if (["men", "man", "male", "m", "boy", "boys"].includes(x)) return "men";
  return "other";
}

function genderOk(filter: MatchFilters["gender"], peerGender?: string): boolean {
  if (!filter || filter === "both") return true;
  const n = normalizeGender(peerGender);
  if (n === "unknown") return true;
  return n === filter;
}

function countryOk(filterCountry: string, peerCountry?: string): boolean {
  if (!filterCountry || filterCountry === "Worldwide" || filterCountry === "All") return true;
  if (!peerCountry) return true;
  return peerCountry.trim().toLowerCase() === filterCountry.trim().toLowerCase();
}

function isRecent(createdAt: unknown): boolean {
  const ts = createdAt as { toMillis?: () => number; seconds?: number } | null;
  const ms = ts?.toMillis?.() ?? (ts?.seconds ? ts.seconds * 1000 : 0);
  if (!ms) return true;
  return Date.now() - ms < WAIT_WINDOW_MS;
}

function profileFromQueue(data: Record<string, unknown>, fallbackId: string): QueueProfile {
  const partner = data.partnerProfile as Record<string, unknown> | undefined;
  if (partner && (partner.userId || partner.name || partner.displayName)) {
    return {
      userId: String(partner.userId || data.partnerId || fallbackId),
      name: String(partner.displayName || partner.name || "Partner"),
      avatar: partner.avatar ? String(partner.avatar) : undefined,
      age: typeof partner.age === "number" ? partner.age : undefined,
      country: partner.country ? String(partner.country) : undefined,
      gender: partner.gender ? String(partner.gender) : undefined,
      bio: partner.bio ? String(partner.bio) : undefined,
      interests: Array.isArray(partner.interests) ? (partner.interests as string[]) : [],
    };
  }
  return {
    userId: String(data.userId || fallbackId),
    name: String(data.displayName || data.name || "Partner"),
    avatar: data.avatar ? String(data.avatar) : undefined,
    age: typeof data.age === "number" ? data.age : undefined,
    country: data.country ? String(data.country) : undefined,
    gender: data.gender ? String(data.gender) : undefined,
    bio: data.bio ? String(data.bio) : undefined,
    interests: Array.isArray(data.interests) ? (data.interests as string[]) : [],
  };
}

async function createDailyRoom(name?: string): Promise<{ url: string; name: string }> {
  const res = await fetch("/api/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(name ? { name } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) {
    const raw = data?.error;
    const msg = typeof raw === "string" ? raw : `Daily room failed (${res.status})`;
    if (String(msg).includes("DAILY_API_KEY")) {
      throw new Error("Video rooms are not configured. Set DAILY_API_KEY on the host (Vercel env).");
    }
    throw new Error(msg.slice(0, 280));
  }
  return { url: data.url as string, name: String(data.name || "") };
}

export async function createOrGetNamedRoom(rawName: string): Promise<{ url: string; name: string }> {
  const name = `yn-${rawName.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 70)}` || `yn-${Date.now()}`;
  return createDailyRoom(name);
}

export async function enqueueOrMatch(opts: {
  userId: string;
  profile: QueueProfile;
  filters: MatchFilters;
  blockedIds?: string[];
  isPremium?: boolean;
}): Promise<MatchSession> {
  const { userId, profile, filters, blockedIds = [], isPremium = false } = opts;
  const blocked = new Set(blockedIds.filter(Boolean));
  const myRef = doc(db, QUEUE, userId);

  const snap = await getDocs(query(collection(db, QUEUE), where("status", "==", "waiting")));
  const candidates: { id: string; data: Record<string, unknown>; premium: boolean; created: number }[] = [];

  snap.forEach((d) => {
    if (d.id === userId) return;
    const data = d.data() as Record<string, unknown>;
    if (!isRecent(data.createdAt)) return;
    const peerId = String(data.userId || d.id);
    if (blocked.has(peerId) || blocked.has(d.id)) return;
    if (!genderOk(filters.gender, data.gender as string | undefined)) return;
    if (!countryOk(filters.country, data.country as string | undefined)) return;
    const theirFilters = (data.filters as MatchFilters) || { gender: "both", country: "Worldwide" };
    if (!genderOk(theirFilters.gender || "both", profile.gender)) return;
    if (!countryOk(theirFilters.country || "Worldwide", profile.country)) return;
    if (!data.roomUrl) return;
    candidates.push({
      id: d.id,
      data,
      premium: !!data.isPremium,
      created: (data.createdAt as { toMillis?: () => number })?.toMillis?.() || 0,
    });
  });

  candidates.sort((a, b) => {
    if (a.premium !== b.premium) return a.premium ? -1 : 1;
    return a.created - b.created;
  });

  for (const cand of candidates) {
    try {
      const claimed = await runTransaction(db, async (tx) => {
        const peerRef = doc(db, QUEUE, cand.id);
        const peerSnap = await tx.get(peerRef);
        if (!peerSnap.exists()) return null;
        const peer = peerSnap.data() as Record<string, unknown>;
        if (peer.status !== "waiting" || !peer.roomUrl) return null;
        if (!isRecent(peer.createdAt)) return null;

        const myPayload = {
          userId,
          displayName: profile.name,
          name: profile.name,
          avatar: profile.avatar || "",
          age: profile.age || 0,
          country: profile.country || "",
          gender: profile.gender || "",
          bio: profile.bio || "",
          interests: profile.interests || [],
        };

        tx.update(peerRef, {
          status: "matched",
          partnerId: userId,
          partnerProfile: myPayload,
          matchedAt: serverTimestamp(),
        });

        tx.set(myRef, {
          ...myPayload,
          filters,
          isPremium,
          status: "matched",
          roomUrl: peer.roomUrl,
          roomName: peer.roomName || "",
          partnerId: cand.id,
          partnerProfile: {
            userId: peer.userId || cand.id,
            displayName: peer.displayName || peer.name,
            name: peer.displayName || peer.name,
            avatar: peer.avatar || "",
            age: peer.age || 0,
            country: peer.country || "",
            gender: peer.gender || "",
            bio: peer.bio || "",
            interests: peer.interests || [],
          },
          createdAt: serverTimestamp(),
          matchedAt: serverTimestamp(),
        });

        return {
          roomUrl: String(peer.roomUrl),
          partner: profileFromQueue(peer, cand.id),
        };
      });

      if (claimed) {
        return {
          roomUrl: claimed.roomUrl,
          queueId: userId,
          partner: claimed.partner,
          role: "matched",
        };
      }
    } catch (e) {
      console.warn("Claim match failed, trying next", e);
    }
  }

  const room = await createDailyRoom();
  await setDoc(myRef, {
    userId,
    displayName: profile.name,
    name: profile.name,
    avatar: profile.avatar || "",
    age: profile.age || 0,
    country: profile.country || "",
    gender: profile.gender || "",
    bio: profile.bio || "",
    interests: profile.interests || [],
    filters,
    isPremium,
    status: "waiting",
    roomUrl: room.url,
    roomName: room.name || "",
    partnerId: "",
    partnerProfile: null,
    createdAt: serverTimestamp(),
  });

  return {
    roomUrl: room.url,
    queueId: userId,
    partner: null,
    role: "waiting",
  };
}

export function subscribeToMatch(
  userId: string,
  cb: (update: { status: string; partner: QueueProfile | null; roomUrl?: string }) => void
) {
  const ref = doc(db, QUEUE, userId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data() as Record<string, unknown>;
    const hasPartner = !!(data.partnerProfile || data.partnerId);
    cb({
      status: String(data.status || ""),
      partner: hasPartner ? profileFromQueue(data, String(data.partnerId || "")) : null,
      roomUrl: data.roomUrl ? String(data.roomUrl) : undefined,
    });
  });
}

export async function leaveMatchQueue(userId: string) {
  if (!userId) return;
  try {
    const ref = doc(db, QUEUE, userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    await updateDoc(ref, { status: "left", leftAt: serverTimestamp() });
  } catch (e) {
    console.warn("leaveMatchQueue failed", e);
  }
}

/** If the remote user left, keep the same Daily room and become waiting again. */
export async function requeueSameRoom(userId: string) {
  if (!userId) return;
  try {
    const ref = doc(db, QUEUE, userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    if (!data?.roomUrl || data.status === "left") return;
    await updateDoc(ref, {
      status: "waiting",
      partnerId: "",
      partnerProfile: null,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("requeueSameRoom failed", e);
  }
}

export function readBlockedUserIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`younn-blocked-ids-${userId}`);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function addBlockedUserId(userId: string, blockedId: string) {
  if (!userId || !blockedId) return;
  try {
    const next = Array.from(new Set([...readBlockedUserIds(userId), blockedId]));
    localStorage.setItem(`younn-blocked-ids-${userId}`, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
