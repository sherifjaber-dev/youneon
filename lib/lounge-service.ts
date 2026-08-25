import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { badgeFromUserDoc } from "@/lib/safety";
import type { UserProfile } from "./firestore-service";
import { isFakeUserRecord, isRealPiUsername } from "./real-pi-user";

export const LOUNGE_RECENT_MS = 72 * 60 * 60 * 1000;
export const LOUNGE_AGE_WINDOW = 6;
export const LOUNGE_FOR_YOU_COUNT = 8;
const LOUNGE_MAX = 80;
const PRESENCE_HEARTBEAT_MS = 25_000;

export const LOUNGE_LANGUAGES = [
  "English",
  "Arabic",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Turkish",
  "Russian",
  "Hindi",
  "Chinese",
  "Japanese",
  "Korean",
  "Dutch",
  "Swedish",
  "Danish",
  "Norwegian",
  "Polish",
  "Indonesian",
  "Thai",
  "Vietnamese",
] as const;

export type LoungeGenderFilter = "all" | "female" | "male";

export type LoungeFilters = {
  gender: LoungeGenderFilter;
  country: string;
  language: string;
  aroundMyAge: boolean;
};

export const DEFAULT_LOUNGE_FILTERS: LoungeFilters = {
  gender: "all",
  country: "All",
  language: "All",
  aroundMyAge: false,
};

export type LoungePerson = {
  id: string;
  name: string;
  photo: string;
  age?: number;
  country: string;
  gender?: string;
  languages: string[];
  youneonBadge?: boolean;
  lastSeenMs: number;
  lat?: number;
  lng?: number;
};

export type LoungeMe = {
  id: string;
  name?: string;
  photo?: string;
  country?: string;
  age?: number;
  gender?: string;
  languages?: string[];
  lat?: number;
  lng?: number;
};

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "object" && value !== null && "toMillis" in value) {
    const ms = (value as { toMillis: () => number }).toMillis();
    return typeof ms === "number" && Number.isFinite(ms) ? ms : 0;
  }
  if (typeof value === "object" && value !== null && "seconds" in value) {
    const sec = (value as { seconds?: number }).seconds;
    return typeof sec === "number" ? sec * 1000 : 0;
  }
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function asNum(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function parseCoords(data: Record<string, unknown>): { lat: number; lng: number } | undefined {
  const geo =
    data.geo && typeof data.geo === "object" ? (data.geo as Record<string, unknown>) : null;
  const loc =
    data.geoLocation && typeof data.geoLocation === "object"
      ? (data.geoLocation as Record<string, unknown>)
      : null;
  const lat =
    asNum(data.lat) ??
    asNum(data.latitude) ??
    asNum(geo?.lat) ??
    asNum(geo?.latitude) ??
    asNum(loc?.lat) ??
    asNum(loc?.latitude);
  const lng =
    asNum(data.lng) ??
    asNum(data.longitude) ??
    asNum(geo?.lng) ??
    asNum(geo?.longitude) ??
    asNum(loc?.lng) ??
    asNum(loc?.longitude);
  if (lat == null || lng == null) return undefined;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  if (lat === 0 && lng === 0) return undefined;
  return { lat, lng };
}

export function loungeGenderBucket(value?: string | null): LoungeGenderFilter | "other" {
  const v = (value || "").trim().toLowerCase();
  if (["woman", "women", "female", "f", "girl", "girls"].includes(v)) return "female";
  if (["man", "men", "male", "m", "boy", "boys"].includes(v)) return "male";
  return "other";
}

export function haversineKm(
  a?: { lat?: number; lng?: number } | null,
  b?: { lat?: number; lng?: number } | null
): number | undefined {
  if (
    a?.lat == null ||
    a?.lng == null ||
    b?.lat == null ||
    b?.lng == null
  ) {
    return undefined;
  }
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const km = 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
  return Number.isFinite(km) ? Math.round(km) : undefined;
}

function personFromUserDoc(
  id: string,
  data: Record<string, unknown>,
  lastSeenMs: number
): LoungePerson | null {
  if (isFakeUserRecord(id, data)) return null;
  const name =
    (typeof data.fullName === "string" && data.fullName.trim()) ||
    (typeof data.piUsername === "string" && data.piUsername.trim()) ||
    "";
  if (!name) return null;
  const photo =
    (typeof data.profilePicture === "string" && data.profilePicture) ||
    (Array.isArray(data.photos)
      ? String(data.photos.find((p) => typeof p === "string" && p.trim()) || "")
      : "") ||
    "";
  const country =
    (typeof data.country === "string" && data.country.trim()) ||
    (typeof data.location === "string" && data.location.trim()) ||
    "";
  const ageRaw = asNum(data.age);
  const age = ageRaw && ageRaw > 0 ? Math.round(ageRaw) : undefined;
  if (!age || age < 18) return null;
  if (data.banned === true) return null;
  const languages = Array.isArray(data.languages)
    ? data.languages.filter((l): l is string => typeof l === "string" && !!l.trim())
    : [];
  const coords = parseCoords(data);
  return {
    id,
    name,
    photo,
    age,
    country,
    gender: data.hideGender ? undefined : typeof data.gender === "string" ? data.gender : undefined,
    languages,
    youneonBadge: badgeFromUserDoc(data),
    lastSeenMs,
    lat: coords?.lat,
    lng: coords?.lng,
  };
}

function isMe(id: string, data: Record<string, unknown>, meId: string) {
  if (!meId) return false;
  return (
    id === meId ||
    data.uid === meId ||
    data.piUsername === meId ||
    data.userId === meId
  );
}

async function hydratePeople(
  rows: Array<{ id: string; lastSeenMs: number }>,
  meId: string
): Promise<LoungePerson[]> {
  const unique = new Map<string, number>();
  rows.forEach((row) => {
    if (!row.id || row.id === meId) return;
    if (!isRealPiUsername(row.id)) return;
    const prev = unique.get(row.id) || 0;
    if (row.lastSeenMs > prev) unique.set(row.id, row.lastSeenMs);
  });
  const ids = [...unique.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, LOUNGE_MAX);

  const people = await Promise.all(
    ids.map(async ([id, lastSeenMs]) => {
      try {
        const snap = await getDoc(doc(db, "users", id));
        if (!snap.exists()) return null;
        const data = snap.data() as Record<string, unknown>;
        if (isMe(snap.id, data, meId)) return null;
        return personFromUserDoc(snap.id, data, lastSeenMs);
      } catch {
        return null;
      }
    })
  );
  return people.filter((p): p is LoungePerson => !!p);
}

export async function touchLoungePresence(userId: string) {
  if (!isRealPiUsername(userId) || !db) return;
  try {
    await setDoc(
      doc(db, "presence", userId),
      { userId, lastSeen: serverTimestamp() },
      { merge: true }
    );
  } catch {
    /* rules or offline */
  }
}

export function subscribeToLoungePeople(
  currentUserId: string,
  cb: (people: LoungePerson[]) => void
): Unsubscribe {
  if (!isRealPiUsername(currentUserId) || !db) {
    cb([]);
    return () => {};
  }

  const cutoff = Timestamp.fromMillis(Date.now() - LOUNGE_RECENT_MS);
  const presenceQuery = query(
    collection(db, "presence"),
    where("lastSeen", ">", cutoff),
    orderBy("lastSeen", "desc"),
    limit(LOUNGE_MAX)
  );

  let cancelled = false;
  let unsubPresence: Unsubscribe | null = null;

  const emitFromPresence = async (
    docs: Array<{ id: string; data: Record<string, unknown> }>
  ) => {
    const now = Date.now();
    const rows = docs
      .map((d) => {
        const lastSeenMs = toMillis(d.data.lastSeen);
        const uid = String(d.data.userId || d.id);
        return { id: uid, lastSeenMs };
      })
      .filter((row) => row.id && row.id !== currentUserId && isRealPiUsername(row.id) && now - row.lastSeenMs <= LOUNGE_RECENT_MS);
    const people = await hydratePeople(rows, currentUserId);
    if (!cancelled) cb(people);
  };

  unsubPresence = onSnapshot(
    presenceQuery,
    (snap) => {
      void emitFromPresence(snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })));
    },
    () => {
      const fallback = query(collection(db, "presence"), limit(LOUNGE_MAX));
      unsubPresence?.();
      unsubPresence = onSnapshot(
        fallback,
        (snap) => {
          const now = Date.now();
          void emitFromPresence(
            snap.docs
              .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }))
              .filter((d) => now - toMillis(d.data.lastSeen) <= LOUNGE_RECENT_MS)
          );
        },
        () => {
          if (!cancelled) cb([]);
        }
      );
    }
  );

  return () => {
    cancelled = true;
    unsubPresence?.();
  };
}

export function matchesLoungeFilters(
  person: LoungePerson,
  filters: LoungeFilters,
  me: LoungeMe
): boolean {
  if (filters.gender !== "all") {
    const bucket = loungeGenderBucket(person.gender);
    if (bucket !== filters.gender) return false;
  }
  if (filters.country && filters.country !== "All") {
    if (person.country.trim().toLowerCase() !== filters.country.trim().toLowerCase()) {
      return false;
    }
  }
  if (filters.language && filters.language !== "All") {
    const wanted = filters.language.trim().toLowerCase();
    const has = person.languages.some((l) => l.trim().toLowerCase() === wanted);
    if (!has) return false;
  }
  if (filters.aroundMyAge && me.age && me.age > 0) {
    if (!person.age || Math.abs(person.age - me.age) > LOUNGE_AGE_WINDOW) return false;
  }
  return true;
}

export function pickForYou(people: LoungePerson[], me: LoungeMe): LoungePerson[] {
  const scored = people.map((person) => {
    let score = 0;
    const recency = Math.max(0, LOUNGE_RECENT_MS - (Date.now() - person.lastSeenMs));
    score += recency / LOUNGE_RECENT_MS * 40;
    const myLangs = (me.languages || []).map((l) => l.trim().toLowerCase()).filter(Boolean);
    if (myLangs.length && person.languages.some((l) => myLangs.includes(l.trim().toLowerCase()))) {
      score += 28;
    }
    if (me.country && person.country && me.country.trim().toLowerCase() === person.country.trim().toLowerCase()) {
      score += 16;
    }
    if (me.age && person.age) {
      const gap = Math.abs(me.age - person.age);
      if (gap <= LOUNGE_AGE_WINDOW) score += 22 - gap;
    }
    if (Date.now() - person.lastSeenMs < 90_000) score += 8;
    return { person, score };
  });
  scored.sort((a, b) => b.score - a.score || b.person.lastSeenMs - a.person.lastSeenMs);
  return scored.slice(0, LOUNGE_FOR_YOU_COUNT).map((s) => s.person);
}

export function applyLoungeFilters(
  people: LoungePerson[],
  filters: LoungeFilters,
  me: LoungeMe
) {
  const filtered = people.filter((p) => matchesLoungeFilters(p, filters, me));
  return {
    all: filtered,
    forYou: pickForYou(filtered, me),
  };
}

export function readStoredLoungeFilters(): LoungeFilters {
  try {
    const raw = localStorage.getItem("youneon_lounge_filters");
    if (!raw) return { ...DEFAULT_LOUNGE_FILTERS };
    const parsed = JSON.parse(raw) as Partial<LoungeFilters>;
    const gender =
      parsed.gender === "female" || parsed.gender === "male" ? parsed.gender : "all";
    return {
      gender,
      country: typeof parsed.country === "string" && parsed.country ? parsed.country : "All",
      language: typeof parsed.language === "string" && parsed.language ? parsed.language : "All",
      aroundMyAge: !!parsed.aroundMyAge,
    };
  } catch {
    return { ...DEFAULT_LOUNGE_FILTERS };
  }
}

export function storeLoungeFilters(filters: LoungeFilters) {
  try {
    localStorage.setItem("youneon_lounge_filters", JSON.stringify(filters));
  } catch {
    /* quota */
  }
}

export function startLoungePresenceHeartbeat(userId: string): () => void {
  if (!isRealPiUsername(userId)) return () => {};
  void touchLoungePresence(userId);
  const timer = window.setInterval(() => {
    void touchLoungePresence(userId);
  }, PRESENCE_HEARTBEAT_MS);
  return () => window.clearInterval(timer);
}

export function profileCoords(profile: UserProfile | null | undefined) {
  if (!profile) return undefined;
  return parseCoords(profile as unknown as Record<string, unknown>);
}
