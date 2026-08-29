"use client";

import {
  addDoc,
  collection,
  doc,
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
const SEED_KEY = "youneon_announcements_seeded_v3";
const READ_IDS_KEY = "youneon_read_announcement_ids";

const DEFAULT_ANNOUNCEMENTS: Array<Omit<Announcement, "createdAtMs" | "active"> & { id: string }> = [
  {
    id: "seed_welcome_v3",
    title: "Welcome to YouNeon",
    body: "YouNeon is live video chat for meeting people on Pi Network. Tap Video Chat for a random call, Lounge to see who was just online, and Messages to keep talking. Video from a chat rings that person. Fill in your profile (18+). Be kind. Skip, Block, or tap the shield if a call feels wrong. A safety filter can blur nudity, weapons, or drugs on your screen. Neon and Premium are optional — never send Pi to a stranger outside the app.",
    type: "system",
  },
  {
    id: "seed_beta_v3",
    title: "We’re new — build this with us",
    body: "YouNeon just launched. Things will change, and that’s the point. If something is confusing, broken, or missing — tell us. Leave a comment, send an idea, or email Sherif.Jaber@icloud.com. Lounge, chat, safety, the look: we read it. Thank you for being here early and helping us make a place that feels good to meet people.",
    type: "news",
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
    await Promise.all([
      setDoc(doc(db, COLLECTION, "seed_system_0"), { active: false }, { merge: true }),
      setDoc(doc(db, COLLECTION, "seed_welcome_v2"), { active: false }, { merge: true }),
      setDoc(doc(db, COLLECTION, "seed_beta_v2"), { active: false }, { merge: true }),
      ...DEFAULT_ANNOUNCEMENTS.map((item, index) =>
        setDoc(
          doc(db, COLLECTION, item.id),
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
      ),
    ]);
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
