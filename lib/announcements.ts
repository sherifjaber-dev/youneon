"use client";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AnnouncementType = "system" | "news" | "promo" | "ad";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  active: boolean;
  imageUrl?: string;
  createdAtMs: number;
};

const COLLECTION = "announcements";
const SEED_KEY = "youneon_announcements_seeded";
const READ_IDS_KEY = "youneon_read_announcement_ids";

const DEFAULT_ANNOUNCEMENTS: Array<Omit<Announcement, "id" | "createdAtMs" | "active">> = [
  {
    title: "Welcome to YouNeon",
    body: "Meet people worldwide. Stay kind, stay safe, and enjoy the glow.",
    type: "system",
  },
  {
    title: "YouNeon Premium is here",
    body: "Unlimited chats, free filters, ad-free browsing, and 1,000 Neon when you subscribe — 5 π for 30 days.",
    type: "promo",
  },
];

function asType(value: unknown): AnnouncementType {
  if (value === "news" || value === "promo" || value === "ad" || value === "system") return value;
  return "system";
}

function createdAtMs(data: { createdAt?: { toMillis?: () => number } }): number {
  const ms = data.createdAt?.toMillis?.();
  return typeof ms === "number" && Number.isFinite(ms) ? ms : 0;
}

export function readAnnouncementIds(): string[] {
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

export function markAnnouncementsRead(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    const next = Array.from(new Set([...readAnnouncementIds(), ...ids]));
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function unreadAnnouncementCount(items: Announcement[]): number {
  const read = new Set(readAnnouncementIds());
  return items.filter((item) => item.active && !read.has(item.id)).length;
}

export async function seedAnnouncementsIfEmpty(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(SEED_KEY) === "1") return;
  } catch {
    /* continue */
  }

  try {
    const snap = await getDocs(collection(db, COLLECTION));
    if (!snap.empty) {
      localStorage.setItem(SEED_KEY, "1");
      return;
    }
    await Promise.all(
      DEFAULT_ANNOUNCEMENTS.map((item, index) =>
        setDoc(
          doc(db, COLLECTION, `seed_${item.type}_${index}`),
          {
            title: item.title,
            body: item.body,
            type: item.type,
            active: true,
            createdAt: serverTimestamp(),
            seedIndex: index,
          },
          { merge: true }
        )
      )
    );
    localStorage.setItem(SEED_KEY, "1");
  } catch (error) {
    console.warn("Announcement seed failed", error);
  }
}

export function subscribeToAnnouncements(cb: (items: Announcement[]) => void) {
  return onSnapshot(collection(db, COLLECTION), (snap) => {
    const items = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        title: typeof data.title === "string" ? data.title : "",
        body: typeof data.body === "string" ? data.body : "",
        type: asType(data.type),
        active: data.active !== false,
        imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : undefined,
        createdAtMs: createdAtMs(data as { createdAt?: { toMillis?: () => number } }),
      } satisfies Announcement;
    });
    items.sort((a, b) => b.createdAtMs - a.createdAtMs);
    cb(items);
  });
}

export async function publishAnnouncement(input: {
  title: string;
  body: string;
  type: AnnouncementType;
  imageUrl?: string;
}) {
  await addDoc(collection(db, COLLECTION), {
    title: input.title.trim(),
    body: input.body.trim(),
    type: input.type,
    imageUrl: input.imageUrl?.trim() || "",
    active: true,
    createdAt: serverTimestamp(),
  });
}

export async function setAnnouncementActive(id: string, active: boolean) {
  await updateDoc(doc(db, COLLECTION, id), { active });
}
