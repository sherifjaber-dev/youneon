"use client";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Announcement } from "@/lib/announcements";
import { readAnnouncementIds } from "@/lib/announcements";

export type SocialNotificationType = "follow" | "message" | "gift" | "warning";
export type InboxFilter = "all" | "notifications" | "events" | "updates";
export type InboxKind = SocialNotificationType | "system" | "event" | "promo" | "online";

export type UserNotification = {
  id: string;
  recipientId: string;
  type: SocialNotificationType;
  title: string;
  body: string;
  actorId?: string;
  actorName?: string;
  actorPhoto?: string;
  conversationId?: string;
  giftEmoji?: string;
  createdAtMs: number;
};

export type InboxItem = {
  id: string;
  filter: Exclude<InboxFilter, "all">;
  kind: InboxKind;
  title: string;
  body: string;
  createdAtMs: number;
  actorId?: string;
  actorName?: string;
  actorPhoto?: string;
  imageUrl?: string;
  conversationId?: string;
  giftEmoji?: string;
  unread: boolean;
  dedupeKey: string;
};

export type NotificationAction =
  | { type: "chat"; user: { id: string; name: string; avatar: string; photo?: string } }
  | { type: "followers" }
  | { type: "messages" }
  | { type: "shop" };

const COLLECTION = "notifications";
const READ_IDS_KEY = "youneon_read_notification_ids";
const LOCAL_GIFTS_PREFIX = "younn-received-gifts-";

function createdAtMs(data: { createdAt?: { toMillis?: () => number } }): number {
  const ms = data.createdAt?.toMillis?.();
  return typeof ms === "number" && Number.isFinite(ms) ? ms : 0;
}

export function relativeShort(ms: number): string {
  if (!ms || !Number.isFinite(ms)) return "";
  const diff = Math.max(0, Date.now() - ms);
  if (diff < 45_000) return "now";
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))}m`;
  if (diff < 86_400_000) return `${Math.max(1, Math.floor(diff / 3_600_000))}h`;
  if (diff < 7 * 86_400_000) return `${Math.max(1, Math.floor(diff / 86_400_000))}d`;
  if (diff < 30 * 86_400_000) return `${Math.max(1, Math.floor(diff / (7 * 86_400_000)))}w`;
  return `${Math.max(1, Math.floor(diff / (30 * 86_400_000)))}mo`;
}

export function readNotificationIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function markNotificationsRead(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return;
  try {
    const next = Array.from(new Set([...readNotificationIds(), ...ids]));
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function asSocialType(value: unknown): SocialNotificationType | null {
  if (value === "follow" || value === "message" || value === "gift" || value === "warning") return value;
  return null;
}

function recordFromSnap(id: string, data: Record<string, unknown>): UserNotification | null {
  const type = asSocialType(data.type);
  const recipientId = typeof data.recipientId === "string" ? data.recipientId : "";
  if (!type || !recipientId) return null;
  return {
    id,
    recipientId,
    type,
    title: typeof data.title === "string" ? data.title : "",
    body: typeof data.body === "string" ? data.body : "",
    actorId: typeof data.actorId === "string" ? data.actorId : undefined,
    actorName: typeof data.actorName === "string" ? data.actorName : undefined,
    actorPhoto: typeof data.actorPhoto === "string" ? data.actorPhoto : undefined,
    conversationId: typeof data.conversationId === "string" ? data.conversationId : undefined,
    giftEmoji: typeof data.giftEmoji === "string" ? data.giftEmoji : undefined,
    createdAtMs: createdAtMs(data as { createdAt?: { toMillis?: () => number } }),
  };
}

export async function upsertUserNotification(input: {
  id?: string;
  recipientId: string;
  type: SocialNotificationType;
  title: string;
  body: string;
  actorId?: string;
  actorName?: string;
  actorPhoto?: string;
  conversationId?: string;
  giftEmoji?: string;
}) {
  if (!input.recipientId || input.recipientId === "anon") return;
  const payload = {
    recipientId: input.recipientId,
    type: input.type,
    title: input.title.trim(),
    body: input.body.trim(),
    actorId: input.actorId || "",
    actorName: input.actorName || "",
    actorPhoto: input.actorPhoto || "",
    conversationId: input.conversationId || "",
    giftEmoji: input.giftEmoji || "",
    createdAt: serverTimestamp(),
  };
  try {
    if (input.id) {
      await setDoc(doc(db, COLLECTION, input.id), payload, { merge: true });
      return;
    }
    await addDoc(collection(db, COLLECTION), payload);
  } catch (error) {
    console.warn("Notification write failed", error);
  }
}

export async function notifyFollow(input: {
  recipientId: string;
  actorId: string;
  actorName: string;
  actorPhoto?: string;
}) {
  try {
    const { recipientAllowsFollowNotify } = await import("@/lib/user-settings");
    const allowed = await recipientAllowsFollowNotify(input.recipientId);
    if (!allowed) return;
  } catch {
    /* write anyway if prefs cannot be read */
  }
  const name = input.actorName.trim() || "Someone";
  await upsertUserNotification({
    id: `follow__${input.actorId}__${input.recipientId}`,
    recipientId: input.recipientId,
    type: "follow",
    actorId: input.actorId,
    actorName: name,
    actorPhoto: input.actorPhoto,
    title: "You have a new follower!",
    body: `${name} is following you now.`,
  });
}

export async function notifyNewMessage(input: {
  recipientId: string;
  actorId: string;
  actorName: string;
  actorPhoto?: string;
  conversationId: string;
  preview: string;
}) {
  const name = input.actorName.trim() || "Someone";
  const preview = input.preview.trim() || "sent you a message";
  await upsertUserNotification({
    id: `msg__${input.recipientId}__${input.actorId}`,
    recipientId: input.recipientId,
    type: "message",
    actorId: input.actorId,
    actorName: name,
    actorPhoto: input.actorPhoto,
    conversationId: input.conversationId,
    title: "New message",
    body: `${name}: ${preview}`,
  });
}

export async function notifyGiftReceived(input: {
  recipientId: string;
  actorId?: string;
  actorName?: string;
  actorPhoto?: string;
  giftId?: string;
  giftEmoji?: string;
}) {
  const name = (input.actorName || "Someone").trim() || "Someone";
  const emoji = input.giftEmoji || "🎁";
  const minute = Math.floor(Date.now() / 60_000);
  const id =
    input.actorId && input.giftId
      ? `gift__${input.recipientId}__${input.actorId}__${input.giftId}__${minute}`
      : undefined;
  await upsertUserNotification({
    id,
    recipientId: input.recipientId,
    type: "gift",
    actorId: input.actorId,
    actorName: name,
    actorPhoto: input.actorPhoto,
    giftEmoji: emoji,
    title: "Gift received",
    body: `${name} sent you ${emoji}`,
  });
}

export function subscribeToUserNotifications(
  userId: string,
  cb: (items: UserNotification[]) => void
) {
  if (!userId || userId === "anon") {
    cb([]);
    return () => {};
  }
  const q = query(collection(db, COLLECTION), where("recipientId", "==", userId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => recordFromSnap(d.id, d.data() as Record<string, unknown>))
        .filter((row): row is UserNotification => !!row);
      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      cb(items);
    },
    () => cb([])
  );
}

export function subscribeToFollowInbox(
  userId: string,
  cb: (items: InboxItem[]) => void
) {
  if (!userId || userId === "anon") {
    cb([]);
    return () => {};
  }
  const q = query(collection(db, "follows"), where("followedId", "==", userId));
  return onSnapshot(
    q,
    (snap) => {
      const read = new Set(readNotificationIds());
      const items: InboxItem[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const actorId = String(data.followerId || "");
        const actorName = String(data.followerName || actorId || "Someone");
        const actorPhoto = String(data.followerPhoto || "");
        const ms = createdAtMs(data as { createdAt?: { toMillis?: () => number } });
        const id = `follow-live-${d.id}`;
        return {
          id,
          filter: "notifications",
          kind: "follow",
          title: "You have a new follower!",
          body: `${actorName} is following you now.`,
          createdAtMs: ms,
          actorId,
          actorName,
          actorPhoto,
          unread: !read.has(id) && !read.has(`follow__${actorId}__${userId}`),
          dedupeKey: `follow:${actorId}`,
        };
      });
      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      cb(items);
    },
    () => cb([])
  );
}

export function socialToInbox(row: UserNotification, read: Set<string>): InboxItem {
  const warning = row.type === "warning";
  return {
    id: row.id,
    filter: warning ? "updates" : "notifications",
    kind: warning ? "system" : row.type,
    title: row.title,
    body: row.body,
    createdAtMs: row.createdAtMs,
    actorId: row.actorId,
    actorName: row.actorName,
    actorPhoto: row.actorPhoto,
    conversationId: row.conversationId,
    giftEmoji: row.giftEmoji,
    unread: !read.has(row.id),
    dedupeKey:
      row.type === "gift"
        ? row.id
        : row.actorId
          ? `${row.type}:${row.actorId}`
          : row.id,
  };
}

export function announcementsToInbox(items: Announcement[], read: Set<string>): InboxItem[] {
  return items
    .filter((item) => item.active)
    .map((item) => {
      const events = item.type === "promo" || item.type === "ad";
      return {
        id: `ann-${item.id}`,
        filter: events ? "events" : "updates",
        kind: events ? (item.type === "ad" ? "promo" : "event") : "system",
        title: item.title,
        body: item.body,
        createdAtMs: item.createdAtMs,
        imageUrl: item.imageUrl,
        unread: !read.has(item.id) && !read.has(`ann-${item.id}`),
        dedupeKey: `ann:${item.id}`,
      } satisfies InboxItem;
    });
}

export function conversationsToInbox(
  userId: string,
  convs: Array<Record<string, unknown>>,
  read: Set<string>
): InboxItem[] {
  const items: InboxItem[] = [];
  for (const conv of convs) {
    const unreadMap = (conv.unreadCount || {}) as Record<string, number>;
    const unreadCount = Number(unreadMap[userId] || 0);
    if (unreadCount <= 0) continue;
    const participants = Array.isArray(conv.participants) ? (conv.participants as string[]) : [];
    const actorId = participants.find((id) => id && id !== userId) || "";
    if (!actorId) continue;
    const names = (conv.participantNames || {}) as Record<string, string>;
    const photos = (conv.participantPhotos || {}) as Record<string, string>;
    const avatars = (conv.participantAvatars || {}) as Record<string, string>;
    const actorName = names[actorId] || actorId;
    const last = typeof conv.lastMessage === "string" ? conv.lastMessage : "sent you a message";
    const time = conv.lastMessageTime as { toMillis?: () => number } | undefined;
    const id = `conv-${String(conv.id || actorId)}`;
    items.push({
      id,
      filter: "notifications",
      kind: "message",
      title: "New message",
      body: `${actorName}: ${last || "sent you a message"}`,
      createdAtMs: time?.toMillis?.() || 0,
      actorId,
      actorName,
      actorPhoto: photos[actorId] || avatars[actorId] || "",
      conversationId: String(conv.id || ""),
      unread: !read.has(id) && !read.has(`msg__${userId}__${actorId}`),
      dedupeKey: `message:${actorId}`,
    });
  }
  return items;
}

export function localGiftsToInbox(userId: string, read: Set<string>): InboxItem[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_GIFTS_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(-20)
      .reverse()
      .map((row: Record<string, unknown>, index: number) => {
        const emoji = typeof row.emoji === "string" ? row.emoji : "🎁";
        const from = typeof row.from === "string" && row.from.trim() ? row.from : "Someone";
        const ts = typeof row.timestamp === "number" ? row.timestamp : 0;
        const giftId = typeof row.id === "string" ? row.id : String(index);
        const id = `local-gift-${giftId}-${ts}`;
        return {
          id,
          filter: "notifications" as const,
          kind: "gift" as const,
          title: "Gift received",
          body: `${from} sent you ${emoji}`,
          createdAtMs: ts,
          actorName: from,
          giftEmoji: emoji,
          unread: !read.has(id),
          dedupeKey: `gift:${from}:${giftId}:${Math.floor(ts / 60_000)}`,
        } satisfies InboxItem;
      });
  } catch {
    return [];
  }
}

export function mergeInbox(groups: InboxItem[][]): InboxItem[] {
  const seen = new Set<string>();
  const out: InboxItem[] = [];
  for (const group of groups) {
    for (const item of group) {
      if (seen.has(item.dedupeKey) || seen.has(item.id)) continue;
      seen.add(item.dedupeKey);
      seen.add(item.id);
      out.push(item);
    }
  }
  out.sort((a, b) => b.createdAtMs - a.createdAtMs);
  return out;
}

export function unreadInboxCount(items: InboxItem[]): number {
  const announcementRead = new Set(readAnnouncementIds());
  const notifRead = new Set(readNotificationIds());
  return items.filter((item) => {
    if (!item.unread) return false;
    if (announcementRead.has(item.id.replace(/^ann-/, ""))) return false;
    if (notifRead.has(item.id)) return false;
    return true;
  }).length;
}

export function filterInboxByPrefs(
  items: InboxItem[],
  prefs: { marketing: boolean; onlineStatus: boolean; newFollowers: boolean }
): InboxItem[] {
  return items.filter((item) => {
    if (!prefs.newFollowers && item.kind === "follow") return false;
    if (!prefs.marketing && (item.kind === "promo" || item.kind === "event")) return false;
    if (!prefs.onlineStatus && item.kind === "online") return false;
    return true;
  });
}

export function inboxActionFor(item: InboxItem): NotificationAction | null {
  if (item.kind === "follow") {
    if (item.actorId) {
      return {
        type: "chat",
        user: {
          id: item.actorId,
          name: item.actorName || item.actorId,
          avatar: item.actorName || item.actorId,
          photo: item.actorPhoto,
        },
      };
    }
    return { type: "followers" };
  }
  if (item.kind === "message" && item.actorId) {
    return {
      type: "chat",
      user: {
        id: item.actorId,
        name: item.actorName || item.actorId,
        avatar: item.actorName || item.actorId,
        photo: item.actorPhoto,
      },
    };
  }
  if (item.kind === "gift") {
    if (item.actorId) {
      return {
        type: "chat",
        user: {
          id: item.actorId,
          name: item.actorName || item.actorId,
          avatar: item.actorName || item.actorId,
          photo: item.actorPhoto,
        },
      };
    }
    return { type: "shop" };
  }
  if (item.kind === "promo" || item.kind === "event") return { type: "shop" };
  return null;
}
