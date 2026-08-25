import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { profileCompleteness } from "@/lib/profile-catalog";
import { isPremiumActive } from "@/lib/premium";

export const AGE_GATE_MIN = 18;
export const REPORT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
export const BADGE_ACCOUNT_MIN_MS = 24 * 60 * 60 * 1000;
export const SUCCESSFUL_CHAT_SECONDS = 30;

export type ReportReasonId =
  | "underage"
  | "sexual"
  | "hate"
  | "violence"
  | "privacy"
  | "scam"
  | "recording"
  | "other";

export const REPORT_REASONS: { id: ReportReasonId; label: string; hint: string }[] = [
  {
    id: "underage",
    label: "Someone appears under 18",
    hint: "YouNeon is adults only. Report immediately if they look or say they are a minor.",
  },
  {
    id: "sexual",
    label: "Nudity, pornography or sexual content",
    hint: "Sexual acts, genitals, or pressure to undress.",
  },
  {
    id: "hate",
    label: "Hate, insults, bullying, racism or threats",
    hint: "Slurs, harassment, or intimidation.",
  },
  {
    id: "violence",
    label: "Violence, self-harm or disturbing content",
    hint: "Graphic harm, weapons used as a threat, or self-harm.",
  },
  {
    id: "privacy",
    label: "Sharing or demanding personal information",
    hint: "Phone numbers, addresses, socials, or Pi passphrases.",
  },
  {
    id: "scam",
    label: "Scam, spam, illegal activity, prostitution or drugs",
    hint: "Fake staff, wallet requests, or illegal offers.",
  },
  {
    id: "recording",
    label: "Recording or capturing without consent",
    hint: "They said they are recording, screenshotting, or streaming you.",
  },
  {
    id: "other",
    label: "Other guidelines violation",
    hint: "Anything else that breaks YouNeon Community Guidelines.",
  },
];

export type ReportEvidence = {
  roomId?: string;
  roomUrl?: string;
  reportedAtMs: number;
  chat?: Array<{ from: string; text: string; timestamp: number }>;
  gifts?: Array<{ giftId: string; emoji?: string; direction: "sent" | "received"; timestamp: number }>;
  notes?: string;
};

export function isAdultAge(age?: number | null): boolean {
  return typeof age === "number" && Number.isFinite(age) && age >= AGE_GATE_MIN && age <= 99;
}

function toMs(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "object" && value !== null && "toMillis" in value) {
    const ms = (value as { toMillis: () => number }).toMillis();
    return Number.isFinite(ms) ? ms : 0;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function evaluateYouNeonBadge(input: {
  completenessPercent: number;
  isPremium?: boolean;
  lastReportedAtMs?: number;
  createdAtMs?: number;
  successfulChats?: number;
}): { earned: boolean; complete: boolean; clean: boolean; established: boolean } {
  const complete = input.completenessPercent >= 100 || !!input.isPremium;
  const last = input.lastReportedAtMs || 0;
  const clean = !last || Date.now() - last >= REPORT_WINDOW_MS;
  const established =
    (!!input.createdAtMs && Date.now() - input.createdAtMs >= BADGE_ACCOUNT_MIN_MS) ||
    (input.successfulChats || 0) >= 1;
  return {
    earned: complete && clean && established,
    complete,
    clean,
    established,
  };
}

export function badgeFromUserDoc(data: Record<string, unknown> | null | undefined, isPremium?: boolean): boolean {
  if (!data) return false;
  if (typeof data.youneonBadge === "boolean" && data.lastReportedAt) {
    const last = toMs(data.lastReportedAt);
    if (last && Date.now() - last < REPORT_WINDOW_MS) return false;
  }
  if (data.youneonBadge === true) return true;
  const completeness = profileCompleteness({
    profilePicture: typeof data.profilePicture === "string" ? data.profilePicture : "",
    photos: Array.isArray(data.photos) ? (data.photos as string[]) : [],
    fullName: typeof data.fullName === "string" ? data.fullName : "",
    age: typeof data.age === "number" ? data.age : undefined,
    bio: typeof data.bio === "string" ? data.bio : "",
    country: typeof data.country === "string" ? data.country : "",
    languages: Array.isArray(data.languages) ? (data.languages as string[]) : [],
    interests: Array.isArray(data.interests) ? (data.interests as string[]) : [],
  });
  const premium =
    typeof isPremium === "boolean"
      ? isPremium
      : isPremiumActive(typeof data.premiumUntil === "string" ? data.premiumUntil : null);
  return evaluateYouNeonBadge({
    completenessPercent: completeness.percent,
    isPremium: premium,
    lastReportedAtMs: toMs(data.lastReportedAt),
    createdAtMs: toMs(data.createdAt),
    successfulChats: typeof data.successfulChats === "number" ? data.successfulChats : 0,
  }).earned;
}

export async function ensureCreatedAt(username: string) {
  if (!username || username === "anon") return;
  try {
    const ref = doc(db, "users", username);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data()?.createdAt) return;
    await setDoc(ref, { createdAt: Timestamp.now(), updatedAt: Timestamp.now() }, { merge: true });
  } catch {
    /* rules / offline */
  }
}

export async function refreshYouNeonBadge(username: string): Promise<boolean> {
  if (!username || username === "anon") return false;
  try {
    const snap = await getDoc(doc(db, "users", username));
    if (!snap.exists()) return false;
    const earned = badgeFromUserDoc(snap.data() as Record<string, unknown>);
    await setDoc(
      doc(db, "users", username),
      { youneonBadge: earned, updatedAt: Timestamp.now() },
      { merge: true }
    );
    return earned;
  } catch {
    return false;
  }
}

export async function submitUserReport(input: {
  reporterId: string;
  reportedUserId: string;
  reportedName?: string;
  reasonId: ReportReasonId;
  reasonLabel: string;
  notes?: string;
  evidence?: Omit<ReportEvidence, "reportedAtMs" | "notes">;
}) {
  if (!input.reporterId || !input.reportedUserId) {
    throw new Error("Missing report target");
  }
  const evidence: ReportEvidence = {
    roomId: input.evidence?.roomId || "",
    roomUrl: input.evidence?.roomUrl || "",
    reportedAtMs: Date.now(),
    chat: (input.evidence?.chat || []).slice(-12),
    gifts: (input.evidence?.gifts || []).slice(-12),
    notes: (input.notes || "").trim().slice(0, 500),
  };
  const payload = {
    reporterId: input.reporterId,
    reportedUserId: input.reportedUserId,
    reportedName: input.reportedName || "",
    reason: input.reasonLabel,
    reasonId: input.reasonId,
    notes: evidence.notes || "",
    createdAt: serverTimestamp(),
    evidence,
  };
  const ref = await addDoc(collection(db, "reports"), payload);
  try {
    await setDoc(
      doc(db, "users", input.reportedUserId),
      {
        reportsReceivedCount: increment(1),
        lastReportedAt: Timestamp.now(),
        youneonBadge: false,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch {
    /* reported user doc may not exist */
  }
  return ref.id;
}

export function dailyRoomIdFromUrl(url?: string | null): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || u.hostname;
  } catch {
    return url.slice(0, 80);
  }
}
