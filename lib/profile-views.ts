import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { getUserProfile } from "./firestore-service";
import { toMillis } from "./history-utils";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface ProfileView {
  id: string;
  viewerId: string;
  viewedUserId: string;
  name: string;
  photo: string;
  country: string;
  languages: string[];
  at?: unknown;
}

export async function recordProfileView(opts: {
  viewerId: string;
  viewedUserId: string;
  viewerName?: string;
  viewerPhoto?: string;
  viewerCountry?: string;
  viewerLanguages?: string[];
}) {
  const viewerId = (opts.viewerId || "").trim();
  const viewedUserId = (opts.viewedUserId || "").trim();
  if (!viewerId || !viewedUserId) return;
  if (viewerId === viewedUserId) return;
  if (viewerId === "anon" || viewedUserId === "anon") return;

  let name = opts.viewerName || "";
  let photo = opts.viewerPhoto || "";
  let country = opts.viewerCountry || "";
  let languages = Array.isArray(opts.viewerLanguages) ? opts.viewerLanguages.filter(Boolean) : [];

  try {
    const profile = await getUserProfile(viewerId);
    if (profile) {
      name = (profile.fullName && profile.fullName.trim()) || name;
      photo = profile.profilePicture || profile.photos?.[0] || photo;
      country = profile.country || profile.location || country;
      if (!languages.length && Array.isArray(profile.languages)) {
        languages = profile.languages.filter(Boolean);
      }
    }
  } catch {
    /* snapshot fields are enough */
  }

  try {
    await setDoc(
      doc(db, "users", viewedUserId, "profileViews", viewerId),
      {
        viewerId,
        viewedUserId,
        name,
        photo,
        country,
        languages,
        at: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("recordProfileView failed", e);
  }
}

export function subscribeToProfileViews(
  userId: string,
  cb: (views: ProfileView[]) => void
) {
  if (!userId || userId === "anon") {
    cb([]);
    return () => {};
  }
  return onSnapshot(
    collection(db, "users", userId, "profileViews"),
    (snap) => {
      const cutoff = Date.now() - THIRTY_DAYS_MS;
      const rows: ProfileView[] = snap.docs
        .map((d) => {
          const data = d.data() as Record<string, unknown>;
          const langs = Array.isArray(data.languages)
            ? data.languages.filter((x): x is string => typeof x === "string" && !!x.trim())
            : [];
          return {
            id: d.id,
            viewerId: String(data.viewerId || d.id),
            viewedUserId: String(data.viewedUserId || userId),
            name: String(data.name || ""),
            photo: String(data.photo || ""),
            country: String(data.country || ""),
            languages: langs,
            at: data.at,
          };
        })
        .filter((row) => toMillis(row.at) >= cutoff || !row.at)
        .sort((a, b) => toMillis(b.at) - toMillis(a.at));
      cb(rows);
    },
    () => cb([])
  );
}
