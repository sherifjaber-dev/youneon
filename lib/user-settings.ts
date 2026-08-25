import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addBlockedUserId, readBlockedUserIds } from "@/lib/match-queue";
import { persistNeonBalance, persistPremiumUntil } from "@/lib/premium";

export const SETTINGS_CHANGED_EVENT = "youneon:settings-changed";

export type NotificationPrefs = {
  marketing: boolean;
  onlineStatus: boolean;
  newFollowers: boolean;
};

export type PrivacyConsent = {
  necessary: true;
  analytics: boolean;
  advertising: boolean;
  marketing: boolean;
};

export type TimedItem = {
  id: string;
  type: "free_message";
  label: string;
  expiresAt: string;
};

export type BlockedPerson = {
  id: string;
  name: string;
  photo: string;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  marketing: true,
  onlineStatus: true,
  newFollowers: true,
};

export const DEFAULT_PRIVACY_CONSENT: PrivacyConsent = {
  necessary: true,
  analytics: true,
  advertising: true,
  marketing: true,
};

const LS = {
  neonId: "youneon_neon_id",
  notif: "youneon_notification_prefs",
  hideGender: "youneon_hide_gender",
  backgroundPlay: "youneon_background_play",
  privacy: "youneon_privacy_consent",
  items: "youneon_timed_items",
  claimed: "youneon_claimed_promos",
} as const;


function emitSettingsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT));
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function generateNeonId(): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = new Uint8Array(10);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let body = "";
  for (let i = 0; i < bytes.length; i++) body += alphabet[bytes[i] % alphabet.length];
  return `YN-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

export function normalizeNotificationPrefs(raw?: Partial<NotificationPrefs> | null): NotificationPrefs {
  return {
    marketing: raw?.marketing !== false,
    onlineStatus: raw?.onlineStatus !== false,
    newFollowers: raw?.newFollowers !== false,
  };
}

export function normalizePrivacyConsent(raw?: Partial<PrivacyConsent> | null): PrivacyConsent {
  return {
    necessary: true,
    analytics: raw?.analytics !== false,
    advertising: raw?.advertising !== false,
    marketing: raw?.marketing !== false,
  };
}

export function readLocalNotificationPrefs(): NotificationPrefs {
  return normalizeNotificationPrefs(readJson(LS.notif, DEFAULT_NOTIFICATION_PREFS));
}

export function readLocalPrivacyConsent(): PrivacyConsent {
  return normalizePrivacyConsent(readJson(LS.privacy, DEFAULT_PRIVACY_CONSENT));
}

export function readLocalHideGender(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LS.hideGender) === "1";
  } catch {
    return false;
  }
}

export function readLocalBackgroundPlay(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LS.backgroundPlay) === "1";
  } catch {
    return false;
  }
}

export function readLocalNeonId(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(LS.neonId) || "";
  } catch {
    return "";
  }
}

export function readLocalItems(): TimedItem[] {
  const items = readJson<TimedItem[]>(LS.items, []);
  const now = Date.now();
  return items.filter((item) => Date.parse(item.expiresAt) > now);
}

export function cacheSettingsFromProfile(data: {
  neonId?: string;
  hideGender?: boolean;
  backgroundPlay?: boolean;
  notificationPrefs?: Partial<NotificationPrefs>;
  privacyConsent?: Partial<PrivacyConsent>;
  items?: TimedItem[];
  claimedPromoCodes?: string[];
}) {
  if (data.neonId) {
    try {
      localStorage.setItem(LS.neonId, data.neonId);
    } catch {
      /* ignore */
    }
  }
  try {
    if (typeof data.hideGender === "boolean") {
      localStorage.setItem(LS.hideGender, data.hideGender ? "1" : "0");
    }
    if (typeof data.backgroundPlay === "boolean") {
      localStorage.setItem(LS.backgroundPlay, data.backgroundPlay ? "1" : "0");
    }
  } catch {
    /* ignore */
  }
  if (data.notificationPrefs) writeJson(LS.notif, normalizeNotificationPrefs(data.notificationPrefs));
  if (data.privacyConsent) writeJson(LS.privacy, normalizePrivacyConsent(data.privacyConsent));
  if (Array.isArray(data.items)) writeJson(LS.items, data.items);
  if (Array.isArray(data.claimedPromoCodes)) writeJson(LS.claimed, data.claimedPromoCodes);
  emitSettingsChanged();
}

export async function patchUserSettings(
  username: string,
  patch: Record<string, unknown>
) {
  if (!username || username === "anon") return;
  await setDoc(
    doc(db, "users", username),
    { ...patch, updatedAt: Timestamp.now() },
    { merge: true }
  );
}

export async function ensureNeonId(username: string, existing?: string | null): Promise<string> {
  const local = (existing || readLocalNeonId()).trim();
  if (local) {
    try {
      localStorage.setItem(LS.neonId, local);
    } catch {
      /* ignore */
    }
    if (!existing && username && username !== "anon") {
      void patchUserSettings(username, { neonId: local }).catch(() => {});
    }
    return local;
  }
  const created = generateNeonId();
  try {
    localStorage.setItem(LS.neonId, created);
  } catch {
    /* ignore */
  }
  if (username && username !== "anon") {
    try {
      const snap = await getDoc(doc(db, "users", username));
      const remote = snap.exists() ? String(snap.data()?.neonId || "") : "";
      if (remote) {
        try {
          localStorage.setItem(LS.neonId, remote);
        } catch {
          /* ignore */
        }
        return remote;
      }
      await patchUserSettings(username, { neonId: created });
    } catch {
      /* offline — keep local */
    }
  }
  return created;
}

export async function saveNotificationPrefs(username: string, prefs: NotificationPrefs) {
  writeJson(LS.notif, prefs);
  emitSettingsChanged();
  await patchUserSettings(username, { notificationPrefs: prefs });
}

export async function savePrivacyConsent(username: string, consent: PrivacyConsent) {
  const next: PrivacyConsent = { ...consent, necessary: true };
  writeJson(LS.privacy, next);
  emitSettingsChanged();
  await patchUserSettings(username, { privacyConsent: next });
}

export async function saveHideGender(username: string, hide: boolean) {
  try {
    localStorage.setItem(LS.hideGender, hide ? "1" : "0");
  } catch {
    /* ignore */
  }
  emitSettingsChanged();
  await patchUserSettings(username, { hideGender: hide });
}

export async function saveBackgroundPlay(username: string, on: boolean) {
  try {
    localStorage.setItem(LS.backgroundPlay, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  emitSettingsChanged();
  await patchUserSettings(username, { backgroundPlay: on });
}

export async function saveLocale(username: string, locale: string) {
  await patchUserSettings(username, { locale });
}

export function mergedBlockedIds(username: string, remote?: string[] | null): string[] {
  const local = readBlockedUserIds(username);
  const cloud = Array.isArray(remote) ? remote.filter((id) => typeof id === "string" && id) : [];
  return Array.from(new Set([...local, ...cloud]));
}

export async function blockUserForMe(
  username: string,
  other: { id: string; name?: string; photo?: string }
) {
  if (!username || !other.id || other.id === username) return;
  addBlockedUserId(username, other.id);
  await setDoc(
    doc(db, "users", username),
    {
      blockedUsers: arrayUnion(other.id),
      [`blockedUserMeta.${other.id}`]: {
        name: other.name || other.id,
        photo: other.photo || "",
      },
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
  emitSettingsChanged();
}

export async function unblockUserForMe(username: string, otherId: string) {
  if (!username || !otherId) return;
  try {
    const next = readBlockedUserIds(username).filter((id) => id !== otherId);
    localStorage.setItem(`younn-blocked-ids-${username}`, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  await setDoc(
    doc(db, "users", username),
    {
      blockedUsers: arrayRemove(otherId),
      [`blockedUserMeta.${otherId}`]: Timestamp.fromMillis(0),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
  try {
    const { deleteField } = await import("firebase/firestore");
    await setDoc(
      doc(db, "users", username),
      { [`blockedUserMeta.${otherId}`]: deleteField(), updatedAt: Timestamp.now() },
      { merge: true }
    );
  } catch {
    /* ignore */
  }
  emitSettingsChanged();
}

export async function loadBlockedPeople(
  username: string,
  remoteIds?: string[],
  meta?: Record<string, { name?: string; photo?: string }>
): Promise<BlockedPerson[]> {
  const ids = mergedBlockedIds(username, remoteIds);
  const people = await Promise.all(
    ids.map(async (id) => {
      const hint = meta?.[id];
      try {
        const snap = await getDoc(doc(db, "users", id));
        if (snap.exists()) {
          const data = snap.data() as Record<string, unknown>;
          const name =
            (typeof data.fullName === "string" && data.fullName.trim()) ||
            (typeof data.piUsername === "string" && data.piUsername.trim()) ||
            hint?.name ||
            id;
          const photo =
            (typeof data.profilePicture === "string" && data.profilePicture) ||
            (Array.isArray(data.photos) ? String(data.photos[0] || "") : "") ||
            hint?.photo ||
            "";
          return { id, name, photo };
        }
      } catch {
        /* ignore */
      }
      return { id, name: hint?.name || id, photo: hint?.photo || "" };
    })
  );
  return people;
}

export async function recipientAllowsFollowNotify(recipientId: string): Promise<boolean> {
  if (!recipientId || recipientId === "anon") return false;
  try {
    const snap = await getDoc(doc(db, "users", recipientId));
    if (!snap.exists()) return true;
    const prefs = normalizeNotificationPrefs(snap.data()?.notificationPrefs as Partial<NotificationPrefs>);
    return prefs.newFollowers;
  } catch {
    return true;
  }
}

function persistItems(items: TimedItem[]) {
  writeJson(LS.items, items);
}

export function countActiveFreeMessages(items?: TimedItem[]): number {
  const list = items || readLocalItems();
  const now = Date.now();
  return list.filter((item) => item.type === "free_message" && Date.parse(item.expiresAt) > now).length;
}

/** Consume the soonest-expiring FREEMSG timed item. Returns remaining items. */
export async function consumeFreeMessageItem(
  username: string,
  currentItems?: TimedItem[]
): Promise<TimedItem[] | null> {
  const now = Date.now();
  const items = (currentItems || readLocalItems()).filter((item) => Date.parse(item.expiresAt) > now);
  const promo = items
    .map((item, index) => ({ item, index, exp: Date.parse(item.expiresAt) }))
    .filter((row) => row.item.type === "free_message")
    .sort((a, b) => a.exp - b.exp);
  if (promo.length === 0) return null;
  const next = items.filter((_, index) => index !== promo[0].index);
  persistItems(next);
  emitSettingsChanged();
  if (username && username !== "anon") {
    try {
      await patchUserSettings(username, { items: next });
    } catch {
      /* local consume still stands */
    }
  }
  return next;
}

export async function claimPromoCode(
  username: string,
  rawCode: string,
  _current?: { claimed?: string[]; items?: TimedItem[] }
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const code = rawCode.trim().toUpperCase().replace(/\s+/g, "");
  if (!code) return { ok: false, message: "Enter a promo code." };
  void username;
  try {
    const { data } = await (await import("@/lib/api")).api.post<{
      message?: string;
      neonAmount?: number;
      newBalance?: number;
      error?: string;
    }>("/api/promo/claim", { code });
    if (typeof data.newBalance === "number") {
      persistNeonBalance(data.newBalance);
    }
    if (typeof window !== "undefined" && data.neonAmount) {
      window.dispatchEvent(
        new CustomEvent("youneon:premium-granted", {
          detail: { premiumUntil: null, neonGranted: data.neonAmount, alreadyGranted: false },
        })
      );
    }
    const claimed = new Set((readJson<string[]>(LS.claimed, [])).map((c) => c.toUpperCase()));
    claimed.add(code);
    writeJson(LS.claimed, [...claimed]);
    emitSettingsChanged();
    return { ok: true, message: data.message || "Code claimed." };
  } catch (error) {
    const err = error as { data?: { error?: string }; message?: string };
    return {
      ok: false,
      message: err.data?.error || err.message || "Could not claim this code.",
    };
  }
}

export async function cancelPremiumLocally(username: string, uid?: string) {
  const expired = new Date().toISOString();
  persistPremiumUntil(expired);
  if (username && username !== "anon") {
    await patchUserSettings(username, { premiumUntil: expired });
  }
  if (uid) {
    try {
      await setDoc(
        doc(db, "pi_users", uid),
        { premiumUntil: expired, updatedAt: Timestamp.now() },
        { merge: true }
      );
    } catch {
      /* ignore */
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("youneon:premium-granted", {
        detail: { premiumUntil: expired, neonGranted: 0, alreadyGranted: false },
      })
    );
  }
  emitSettingsChanged();
  return expired;
}

export function remainingLabel(expiresAt: string): string {
  const ms = Date.parse(expiresAt) - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return "Expired";
  const mins = Math.ceil(ms / 60_000);
  if (mins < 60) return `${mins}m left`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}
