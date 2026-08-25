"use client";

import { useEffect, useMemo, useState } from "react";
import type { UserProfile } from "@/lib/firestore-service";
import { recordProfileView } from "@/lib/profile-views";

export type CallPartnerHint = {
  userId?: string;
  name?: string;
  avatar?: string;
  age?: number;
  country?: string;
  countryFlag?: string;
  bio?: string;
  interests?: string[];
  gender?: string;
};

function isPhotoSrc(value?: string | null): boolean {
  if (!value || typeof value !== "string") return false;
  const v = value.trim();
  return (
    v.startsWith("data:image") ||
    v.startsWith("https://") ||
    v.startsWith("http://") ||
    v.startsWith("blob:")
  );
}

function initialsFrom(name: string): string {
  const cleaned = name.replace(/[—–-]/g, " ").trim();
  if (!cleaned || cleaned === "Partner" || cleaned === "Someone") return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  const letters = `${a}${b}`.toUpperCase();
  return letters || "?";
}

function displayOrDash(value?: string | number | null): string {
  if (value === 0) return "—";
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return "—";
}

function collectPhotos(firestoreUser: UserProfile | null, hint: CallPartnerHint | null): string[] {
  const out: string[] = [];
  const add = (src?: string) => {
    if (!isPhotoSrc(src)) return;
    const v = src!.trim();
    if (!out.includes(v)) out.push(v);
  };
  add(firestoreUser?.profilePicture);
  if (Array.isArray(firestoreUser?.photos)) {
    firestoreUser!.photos!.forEach(add);
  }
  add(hint?.avatar);
  return out;
}

export function mergeRemoteProfile(
  firestoreUser: UserProfile | null,
  hint: CallPartnerHint | null,
  dailyName?: string
) {
  const photos = collectPhotos(firestoreUser, hint);
  const name =
    (firestoreUser?.fullName && firestoreUser.fullName.trim()) ||
    (hint?.name && hint.name.trim()) ||
    (dailyName && dailyName.trim()) ||
    "";
  const ageRaw = firestoreUser?.age || hint?.age;
  const age = typeof ageRaw === "number" && ageRaw > 0 ? ageRaw : undefined;
  const location =
    (firestoreUser?.country && firestoreUser.country.trim()) ||
    (firestoreUser?.location && firestoreUser.location.trim()) ||
    (hint?.country && hint.country.trim()) ||
    "";
  const bio =
    (firestoreUser?.bio && firestoreUser.bio.trim()) ||
    (hint?.bio && hint.bio.trim()) ||
    "";
  const gifts =
    typeof firestoreUser?.giftsReceivedCount === "number" && firestoreUser.giftsReceivedCount >= 0
      ? firestoreUser.giftsReceivedCount
      : 0;

  return {
    name: name || "—",
    age,
    location,
    bio,
    photos,
    heroPhoto: photos[0] || "",
    giftsReceived: gifts,
    initials: initialsFrom(name || ""),
    interests: firestoreUser?.interests?.length ? firestoreUser.interests : hint?.interests || [],
  };
}

export function RemoteProfileAvatar({
  photo,
  name,
  initials,
  onOpen,
}: {
  photo?: string;
  name: string;
  initials: string;
  onOpen: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = isPhotoSrc(photo) && !imgFailed;

  useEffect(() => {
    setImgFailed(false);
  }, [photo]);

  return (
    <button
      type="button"
      className="yn-remote-avatar"
      onClick={onOpen}
      data-testid="remote-profile-avatar"
      aria-label={`View ${name === "—" ? "their" : `${name}'s`} profile`}
    >
      {showPhoto ? (
        <img src={photo} alt="" onError={() => setImgFailed(true)} />
      ) : (
        <span className="yn-remote-avatar-fallback">{initials}</span>
      )}
    </button>
  );
}

export function RemoteProfileModal({
  open,
  onClose,
  firestoreUser,
  hint,
  dailyName,
  viewerId,
}: {
  open: boolean;
  onClose: () => void;
  firestoreUser: UserProfile | null;
  hint: CallPartnerHint | null;
  dailyName?: string;
  viewerId?: string;
}) {
  const profile = useMemo(
    () => mergeRemoteProfile(firestoreUser, hint, dailyName),
    [firestoreUser, hint, dailyName]
  );

  useEffect(() => {
    if (!open) return;
    const viewedId = firestoreUser?.id || firestoreUser?.uid || hint?.userId;
    if (!viewerId || !viewedId) return;
    void recordProfileView({ viewerId, viewedUserId: viewedId });
  }, [open, viewerId, firestoreUser?.id, firestoreUser?.uid, hint?.userId]);

  const [activePhoto, setActivePhoto] = useState(0);
  const gallery = profile.photos;
  const current = gallery[Math.min(activePhoto, Math.max(0, gallery.length - 1))] || "";

  useEffect(() => {
    setActivePhoto(0);
  }, [profile.heroPhoto, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="yn-remote-profile-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="yn-remote-profile-name"
      onClick={onClose}
    >
      <div
        className="yn-remote-profile-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="yn-remote-profile-close"
          onClick={onClose}
          aria-label="Close profile"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <div className="yn-remote-profile-hero">
          {isPhotoSrc(current) ? (
            <img src={current} alt="" />
          ) : (
            <div className="yn-remote-profile-hero-fallback">
              <span>{profile.initials}</span>
            </div>
          )}
          <div className="yn-remote-profile-hero-fade" />
        </div>

        {gallery.length > 1 && (
          <div className="yn-remote-profile-thumbs" aria-label="Photos">
            {gallery.map((src, i) => (
              <button
                key={`${i}-${src.slice(0, 24)}`}
                type="button"
                className={`yn-remote-profile-thumb ${i === activePhoto ? "is-active" : ""}`}
                onClick={() => setActivePhoto(i)}
                aria-label={`Photo ${i + 1}`}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}

        <div className="yn-remote-profile-body">
          <h2 id="yn-remote-profile-name" className="yn-remote-profile-name">
            {profile.name}
          </h2>
          <dl className="yn-remote-profile-meta">
            <div>
              <dt>Age</dt>
              <dd>{displayOrDash(profile.age)}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{displayOrDash(profile.location)}</dd>
            </div>
            <div>
              <dt>Gifts</dt>
              <dd>{profile.giftsReceived}</dd>
            </div>
          </dl>

          <div className="yn-remote-profile-section">
            <p className="yn-remote-profile-label">About</p>
            <p className="yn-remote-profile-bio">{displayOrDash(profile.bio)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
