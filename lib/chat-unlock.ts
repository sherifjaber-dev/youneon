import { arrayUnion, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  consumeFreeMessageItem,
  countActiveFreeMessages,
  type TimedItem,
} from "@/lib/user-settings";

export const FREE_UNLOCKS_NORMAL = 1;
export const FREE_UNLOCKS_PREMIUM = 2;

export type ChatUnlocks = {
  date: string;
  used: number;
};

export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function normalizeChatUnlocks(raw: unknown): ChatUnlocks | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as { date?: unknown; used?: unknown };
  if (typeof row.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) return null;
  const used = typeof row.used === "number" ? row.used : Number(row.used);
  if (!Number.isFinite(used) || used < 0) return { date: row.date, used: 0 };
  return { date: row.date, used: Math.floor(used) };
}

export function normalizeUnlockedChats(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return Array.from(new Set(raw.filter((id): id is string => typeof id === "string" && id.length > 0)));
}

export function dailyUnlockAllowance(isPremium: boolean): number {
  return isPremium ? FREE_UNLOCKS_PREMIUM : FREE_UNLOCKS_NORMAL;
}

export function usedUnlocksToday(unlocks?: ChatUnlocks | null, today = localDateKey()): number {
  if (!unlocks || unlocks.date !== today) return 0;
  return Math.max(0, unlocks.used);
}

export function remainingFreeUnlocks(opts: {
  isPremium: boolean;
  unlocks?: ChatUnlocks | null;
  items?: TimedItem[];
  today?: string;
}): number {
  const dailyLeft = Math.max(
    0,
    dailyUnlockAllowance(opts.isPremium) - usedUnlocksToday(opts.unlocks, opts.today)
  );
  return dailyLeft + countActiveFreeMessages(opts.items);
}

export function isPeerUnlocked(unlockedChats: string[] | undefined, peerId: string): boolean {
  if (!peerId) return false;
  return (unlockedChats || []).includes(peerId);
}

export async function rememberUnlockedPeer(username: string, peerId: string) {
  if (!username || username === "anon" || !peerId || peerId === username) return;
  await setDoc(
    doc(db, "users", username),
    {
      unlockedChats: arrayUnion(peerId),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

export async function consumeChatUnlock(opts: {
  username: string;
  peerId: string;
  isPremium: boolean;
  unlocks?: ChatUnlocks | null;
  items?: TimedItem[];
}): Promise<
  | { ok: true; unlocks: ChatUnlocks; items: TimedItem[]; source: "daily" | "promo" }
  | { ok: false; reason: "none_left" | "invalid" }
> {
  const { username, peerId, isPremium } = opts;
  if (!username || username === "anon" || !peerId || peerId === username) {
    return { ok: false, reason: "invalid" };
  }

  const today = localDateKey();
  const userRef = doc(db, "users", username);
  let used = usedUnlocksToday(opts.unlocks, today);
  let items = opts.items;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as {
        chatUnlocks?: unknown;
        items?: TimedItem[];
      };
      used = usedUnlocksToday(normalizeChatUnlocks(data.chatUnlocks), today);
      if (Array.isArray(data.items)) items = data.items as TimedItem[];
    }
  } catch {
    /* use local snapshot */
  }

  const allowance = dailyUnlockAllowance(isPremium);
  const nextUnlocks: ChatUnlocks = { date: today, used };
  let source: "daily" | "promo" = "daily";

  if (used < allowance) {
    nextUnlocks.used = used + 1;
    await setDoc(
      userRef,
      {
        chatUnlocks: nextUnlocks,
        unlockedChats: arrayUnion(peerId),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
    return { ok: true, unlocks: nextUnlocks, items: items || [], source };
  }

  const remainingItems = await consumeFreeMessageItem(username, items);
  if (!remainingItems) return { ok: false, reason: "none_left" };
  source = "promo";
  await setDoc(
    userRef,
    {
      unlockedChats: arrayUnion(peerId),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
  return { ok: true, unlocks: nextUnlocks, items: remainingItems, source };
}
