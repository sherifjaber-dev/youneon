"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Cake,
  ChevronRight,
  Crown,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Settings,
  User,
  X,
} from "lucide-react";
import { InterestIcon } from "@/components/icons/interest-icons";
import { ReactionIcon } from "@/components/icons/reaction-icons";
import { ProfileInterestsPage } from "@/components/profile-interests-page";
import { ProfileSettingsSheet } from "@/components/profile-settings-sheet";
import { acquireProfileChromeLock, ProfilePreviewSheet } from "@/components/call-remote-profile";
import { compressImageFile } from "@/lib/compress-image";
import { CountryLabel } from "@/components/country-flag";
import { COUNTRY_OPTIONS, isCountryOption } from "@/lib/countries";
import type { Announcement } from "@/lib/announcements";
import type { UserProfile } from "@/lib/firestore-service";
import { readSpokenLanguages } from "@/lib/firestore-service";
import {
  AGE_MAX,
  AGE_MIN,
  BIO_MAX,
  INTEREST_CATEGORIES,
  MAX_LANGUAGES,
  MAX_PHOTOS,
  NAME_MAX,
  SPOKEN_LANGUAGES,
  canonicalLanguage,
  currentYearMonth,
  hasProfilePhoto,
  languageLabel,
  nameChangesLeft,
  profileCompleteness,
  reactionCount,
  totalReactions,
  REACTION_TYPES,
} from "@/lib/profile-catalog";

const NEON_TONES = ["pink", "cyan", "purple"] as const;
type NeonTone = (typeof NEON_TONES)[number];

const BADGE_NEXT_LABEL: Record<string, string> = {
  photo: "Photo",
  name: "Name",
  age: "Age",
  bio: "About me",
  country: "Location",
  languages: "Languages",
  interests: "Interests",
};

function interestTone(tag: string, index: number): NeonTone {
  const cat = INTEREST_CATEGORIES.find((c) => c.tags.includes(tag))?.id;
  if (cat === "relationships") return "pink";
  if (cat === "sports") return "cyan";
  if (cat === "fashion") return "purple";
  return NEON_TONES[index % NEON_TONES.length];
}

function GenderMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <circle cx="10" cy="14" r="5.1" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M14.2 9.8 20 4M16.2 4H20v3.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BadgeShield() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden className="yn-pe-badge-mark">
      <path
        d="M20 4.2 7.6 9.2v10.2c0 7.6 5.1 14.4 12.4 16 7.3-1.6 12.4-8.4 12.4-16V9.2L20 4.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M14.4 16.2h11.2l-1.3 2.1v3.4c0 3.2-2.2 5.6-4.3 6.4-2.1-.8-4.3-3.2-4.3-6.4v-3.4z"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M16.6 16.2 20 13.4l3.4 2.8"
        fill="none"
        stroke="#070010"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const GENDER_OPTIONS = ["Man", "Woman", "Prefer not to say"] as const;
export type ProfileGender = (typeof GENDER_OPTIONS)[number];

export type ProfileSavePayload = {
  fullName: string;
  age: number;
  country: string;
  location: string;
  gender: ProfileGender | "";
  bio: string;
  interests: string[];
  languages: string[];
  profilePicture: string;
  photos: string[];
  nameChangeMonth?: string;
  nameChangeCount?: number;
};

export type ProfileModalUser = {
  piUsername?: string;
  fullName?: string;
  age?: number;
  country?: string;
  location?: string;
  gender?: string;
  bio?: string;
  interests?: string[];
  languages?: string[];
  spokenLanguages?: string[];
  langs?: string[];
  profilePicture?: string;
  photos?: string[];
  nameChangeMonth?: string;
  nameChangeCount?: number;
  reactionsReceived?: Record<string, number>;
  giftsReceivedCount?: number;
  premiumUntil?: string;
  neonId?: string;
  hideGender?: boolean;
  youneonBadge?: boolean;
  createdAt?: unknown;
  lastReportedAt?: unknown;
  successfulChats?: number;
};

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (profile: ProfileSavePayload) => void | Promise<void>;
  isPremium?: boolean;
  premiumUntil?: string | null;
  neonBalance?: number;
  announcements?: Announcement[];
  currentUsername?: string;
  currentUser?: ProfileModalUser | null;
  onOpenShop?: () => void;
}

type SheetId = "name" | "about" | "languages" | "location" | "age" | "gender" | "badge" | null;

const APPLY =
  "flex h-12 w-full items-center justify-center rounded-[14px] bg-[var(--pink)] text-[15px] font-semibold text-white shadow-[0_4px_16px_var(--pink-soft)] transition-transform active:scale-[0.985] active:bg-[var(--pink-pressed)] disabled:bg-white/10 disabled:text-[#6b6274] disabled:shadow-none";

function isProfileGender(value: string): value is ProfileGender {
  return (GENDER_OPTIONS as readonly string[]).includes(value);
}

function readStoredProfile(): ProfileModalUser {
  try {
    const stored = localStorage.getItem("youneon_user_profile");
    if (!stored) return {};
    return JSON.parse(stored) as ProfileModalUser;
  } catch {
    return {};
  }
}

function emptyForm(): ProfileSavePayload {
  return {
    fullName: "",
    age: 18,
    country: "",
    location: "",
    gender: "",
    bio: "",
    interests: [],
    languages: [],
    profilePicture: "",
    photos: [],
  };
}

function uniquePhotos(values: Array<string | undefined>): string[] {
  const out: string[] = [];
  for (const v of values) {
    const t = (v || "").trim();
    if (!t || out.includes(t)) continue;
    out.push(t);
    if (out.length >= MAX_PHOTOS) break;
  }
  return out;
}

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function firstSpokenLanguages(...sources: Array<unknown>): string[] {
  for (const src of sources) {
    const langs = readSpokenLanguages(src).map(canonicalLanguage).filter(Boolean);
    if (langs.length) return langs;
  }
  return [];
}

function formFromSources(user?: ProfileModalUser | null): ProfileSavePayload {
  const storedRaw = typeof window !== "undefined" ? readStoredProfile() : {};
  const stored =
    user?.piUsername && storedRaw.piUsername && storedRaw.piUsername !== user.piUsername
      ? {}
      : storedRaw;
  const src: ProfileModalUser = { ...stored };
  for (const [key, value] of Object.entries(user || {})) {
    if (hasValue(value)) (src as Record<string, unknown>)[key] = value;
  }
  const rawPlace = src.country || src.location || "";
  const country = isCountryOption(rawPlace) ? rawPlace : rawPlace.trim();
  const gender = src.gender && isProfileGender(src.gender) ? src.gender : "";
  const photos = uniquePhotos([
    ...(Array.isArray(src.photos) ? src.photos : []),
    src.profilePicture,
  ]);
  return {
    fullName: src.fullName || "",
    age: typeof src.age === "number" && src.age > 0 ? src.age : 18,
    country,
    location: country,
    gender,
    bio: src.bio || "",
    interests: Array.isArray(src.interests) ? src.interests : [],
    languages: firstSpokenLanguages(user, stored),
    profilePicture: photos[0] || src.profilePicture || "",
    photos,
    nameChangeMonth: src.nameChangeMonth,
    nameChangeCount: src.nameChangeCount,
  };
}

function BottomSheet({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="yn-pe-sheet relative w-full max-w-md rounded-t-3xl border px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
        <h3 className="text-[18px] font-semibold">{title}</h3>
        {subtitle && <p className="mt-1.5 text-[13px] leading-relaxed">{subtitle}</p>}
        <div className="mt-4">{children}</div>
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  placeholder,
  onClick,
  tone = "pink",
  valueNode,
  accentValue,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  placeholder: string;
  onClick?: () => void;
  tone?: NeonTone;
  valueNode?: React.ReactNode;
  accentValue?: boolean;
}) {
  const filled = Boolean(value || valueNode);
  const inner = (
    <>
      <span className={`yn-pe-row-icon yn-pe-row-icon--${tone}`}>{icon}</span>
      <span className="yn-pe-row-label">{label}</span>
      <span
        className={`yn-pe-row-value${filled ? "" : " is-empty"}${accentValue ? ` yn-pe-rx-value--${tone}` : ""}`}
      >
        {valueNode || value || placeholder}
      </span>
      <ChevronRight size={16} className="yn-pe-chevron" />
    </>
  );
  if (!onClick) {
    return <div className="yn-pe-row">{inner}</div>;
  }
  return (
    <button type="button" onClick={onClick} className="yn-pe-row">
      {inner}
    </button>
  );
}

export function ProfileEditModal({
  isOpen,
  onClose,
  onSave,
  isPremium = false,
  premiumUntil = null,
  neonBalance = 0,
  announcements = [],
  currentUsername,
  currentUser,
  onOpenShop,
}: ProfileEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<ProfileSavePayload>(emptyForm());
  const [formData, setFormData] = useState<ProfileSavePayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<SheetId>(null);
  const [showInterests, setShowInterests] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const [draftName, setDraftName] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [draftLangs, setDraftLangs] = useState<string[]>([]);
  const [draftCountry, setDraftCountry] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [draftAge, setDraftAge] = useState("18");
  const [langQuery, setLangQuery] = useState("");

  const openedRef = useRef(false);
  formRef.current = formData;

  useEffect(() => {
    if (!isOpen) {
      openedRef.current = false;
      return;
    }
    const incoming = formFromSources(currentUser);
    if (!openedRef.current) {
      openedRef.current = true;
      setFormData(incoming);
      setError("");
      setSaving(false);
      setUploading(false);
      setSheet(null);
      setShowInterests(false);
      setShowSettings(false);
      setShowPreview(false);
      return;
    }
    setFormData((prev) => ({
      ...incoming,
      ...prev,
      fullName: prev.fullName.trim() ? prev.fullName : incoming.fullName,
      bio: prev.bio ? prev.bio : incoming.bio,
      country: prev.country ? prev.country : incoming.country,
      location: prev.location ? prev.location : incoming.location,
      gender: prev.gender ? prev.gender : incoming.gender,
      interests: prev.interests.length ? prev.interests : incoming.interests,
      languages: prev.languages.length ? prev.languages : incoming.languages,
      photos: prev.photos.length ? prev.photos : incoming.photos,
      profilePicture: prev.profilePicture || incoming.profilePicture,
      age: prev.age !== 18 ? prev.age : incoming.age || prev.age,
    }));
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (!isOpen) return;
    return acquireProfileChromeLock();
  }, [isOpen]);

  const persist = async (next: ProfileSavePayload) => {
    if (!Number.isFinite(next.age) || next.age < AGE_MIN) {
      setError(`YouNeon is ${AGE_MIN}+. You cannot save an age under ${AGE_MIN}.`);
      return;
    }
    const fullName = next.fullName.trim();
    const photos = uniquePhotos([...(next.photos || []), next.profilePicture]);
    const payload: ProfileSavePayload = {
      ...next,
      fullName,
      country: next.country,
      location: next.country,
      bio: next.bio.trim(),
      profilePicture: photos[0] || "",
      photos,
      languages: next.languages.map(canonicalLanguage).filter(Boolean),
    };
    setFormData(payload);
    setSaving(true);
    setError("");
    try {
      const previous = readStoredProfile();
      const cached = {
        ...previous,
        ...payload,
        piUsername: currentUsername || previous.piUsername || "",
      };
      try {
        localStorage.setItem("youneon_user_profile", JSON.stringify(cached));
      } catch {
        /* quota — still save to the Pi user document */
      }
      await onSave?.(payload);
      if (currentUsername) {
        const { refreshYouNeonBadge } = await import("@/lib/safety");
        void refreshYouNeonBadge(currentUsername);
      }
    } catch {
      setError("Saved on this device. Cloud sync failed — try again later.");
    } finally {
      setSaving(false);
    }
  };

  const completeness = profileCompleteness(formData);
  const photoCount = formData.photos.length;
  const photoMissing = !hasProfilePhoto(formData);
  const photoBoost = photoMissing
    ? Math.round(100 / 7)
    : photoCount < 2
      ? Math.round(100 / 14)
      : 0;
  const reactionsMap = currentUser?.reactionsReceived;
  const reactionTotal = totalReactions(reactionsMap);
  const changesLeft = nameChangesLeft(formData.nameChangeMonth, formData.nameChangeCount);
  const badgeEarned = completeness.percent >= 100 || isPremium;
  const badgeProgress = isPremium ? 100 : completeness.percent;
  const badgeDone = completeness.checks.filter((c) => c.ok).length;
  const badgeTotal = completeness.checks.length;
  const badgeNext = completeness.checks.find((c) => !c.ok);
  const badgeNextLabel = badgeEarned
    ? currentUser?.youneonBadge
      ? "Earned"
      : "Complete"
    : `Next: ${BADGE_NEXT_LABEL[badgeNext?.key || ""] || "Profile"}`;

  const openSheet = (id: SheetId) => {
    setError("");
    if (id === "name") setDraftName(formData.fullName);
    if (id === "about") setDraftBio(formData.bio);
    if (id === "languages") {
      setDraftLangs(formData.languages.map(canonicalLanguage));
      setLangQuery("");
    }
    if (id === "location") {
      setDraftCountry(formData.country);
      setCountryQuery("");
    }
    if (id === "age") setDraftAge(String(formData.age || 18));
    setSheet(id);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const dataUrl = await compressImageFile(file);
      const photos = [...formData.photos];
      if (replaceIndex !== null && replaceIndex >= 0 && replaceIndex < photos.length) {
        photos[replaceIndex] = dataUrl;
      } else if (photos.length < MAX_PHOTOS) {
        photos.push(dataUrl);
      } else {
        setError(`You can add up to ${MAX_PHOTOS} photos.`);
        return;
      }
      const next = uniquePhotos(photos);
      await persist({ ...formData, photos: next, profilePicture: next[0] || "" });
    } catch {
      setError("Could not process that photo. Try another image.");
    } finally {
      setReplaceIndex(null);
      setUploading(false);
    }
  };

  const pickPhoto = (index: number | null) => {
    setReplaceIndex(index);
    fileInputRef.current?.click();
  };

  const deletePhoto = async (index: number) => {
    const photos = formData.photos.filter((_, i) => i !== index);
    await persist({ ...formData, photos, profilePicture: photos[0] || "" });
  };

  const setAsMain = async (index: number) => {
    if (index <= 0) return;
    const photos = [...formData.photos];
    const [picked] = photos.splice(index, 1);
    photos.unshift(picked);
    await persist({ ...formData, photos, profilePicture: photos[0] || "" });
  };

  const applyName = async () => {
    const name = draftName.trim();
    if (!name || name.length > NAME_MAX) return;
    const renamed = name !== formData.fullName.trim();
    if (renamed && changesLeft <= 0) {
      setError("You can change your name up to 3 times a month.");
      return;
    }
    const ym = currentYearMonth();
    const count =
      renamed
        ? formData.nameChangeMonth === ym
          ? (formData.nameChangeCount || 0) + 1
          : 1
        : formData.nameChangeCount;
    await persist({
      ...formData,
      fullName: name,
      nameChangeMonth: renamed ? ym : formData.nameChangeMonth,
      nameChangeCount: count,
    });
    setSheet(null);
  };

  const applyBio = async () => {
    await persist({ ...formData, bio: draftBio.slice(0, BIO_MAX) });
    setSheet(null);
  };

  const applyLanguages = async () => {
    const languages = draftLangs.map(canonicalLanguage).filter(Boolean).slice(0, MAX_LANGUAGES);
    if (!languages.length) return;
    await persist({ ...formData, languages });
    setSheet(null);
  };

  const applyCountry = async () => {
    if (!draftCountry.trim()) return;
    await persist({ ...formData, country: draftCountry, location: draftCountry });
    setSheet(null);
  };

  const applyAge = async () => {
    const age = parseInt(draftAge, 10);
    if (!Number.isFinite(age) || age < AGE_MIN || age > AGE_MAX) return;
    await persist({ ...formData, age });
    setSheet(null);
  };

  const applyGender = async (gender: ProfileGender) => {
    await persist({ ...formData, gender });
    setSheet(null);
  };

  const applyInterests = async (interests: string[]) => {
    setFormData((prev) => ({ ...prev, interests }));
  };

  const closeInterests = async () => {
    setShowInterests(false);
    await persist(formRef.current);
  };

  const previewUser: UserProfile = useMemo(
    () => ({
      id: currentUsername || "",
      piUsername: currentUsername || "",
      fullName: formData.fullName,
      age: formData.age,
      country: formData.country,
      location: formData.country,
      gender: formData.gender,
      languages: formData.languages,
      interests: formData.interests,
      profilePicture: formData.profilePicture,
      photos: formData.photos,
      bio: formData.bio,
      giftsReceivedCount: currentUser?.giftsReceivedCount || 0,
      reactionsReceived: currentUser?.reactionsReceived,
      neonId: currentUser?.neonId,
      hideGender: currentUser?.hideGender,
      youneonBadge: currentUser?.youneonBadge,
      createdAt: currentUser?.createdAt,
      lastReportedAt: currentUser?.lastReportedAt,
      successfulChats: currentUser?.successfulChats,
      premiumUntil: currentUser?.premiumUntil || undefined,
    }),
    [formData, currentUsername, currentUser]
  );

  const nameValid =
    draftName.trim().length >= 1 &&
    draftName.trim().length <= NAME_MAX &&
    (draftName.trim() === formData.fullName.trim() || changesLeft > 0);
  const nameChanged = draftName.trim() !== formData.fullName.trim();
  const bioValid = draftBio !== formData.bio;
  const ageNum = parseInt(draftAge, 10);

  const filteredCountries = COUNTRY_OPTIONS.filter((c) =>
    c.toLowerCase().includes(countryQuery.trim().toLowerCase())
  );
  const filteredLangs = SPOKEN_LANGUAGES.filter((l) => {
    const q = langQuery.trim().toLowerCase();
    if (!q) return true;
    return l.id.toLowerCase().includes(q) || l.native.toLowerCase().includes(q);
  });
  const addableLangs = filteredLangs.filter((l) => !draftLangs.includes(l.id));

  const photoSlots: Array<{ src?: string; index: number }> = [];
  for (let i = 0; i < MAX_PHOTOS; i++) {
    photoSlots.push({ src: formData.photos[i], index: i });
  }

  if (!isOpen) return null;

  return (
    <div className="yn-profile-editor fixed inset-0 z-[100] flex justify-center" data-testid="profile-editor">
      <div className="relative flex h-full w-full max-w-md flex-col">
        <header className="yn-pe-header">
          <button type="button" onClick={onClose} className="yn-pe-icon-btn" aria-label="Close">
            <X size={22} />
          </button>
          <h1 className="yn-pe-title">Profile</h1>
          <button type="button" onClick={() => setShowPreview(true)} className="yn-pe-preview">
            Preview
          </button>
          <button type="button" onClick={() => setShowSettings(true)} className="yn-pe-icon-btn" aria-label="Settings">
            <Settings size={20} />
          </button>
        </header>
        {isPremium && (
          <div className="flex justify-center">
            <span className="yn-pe-premium">
              <Crown size={12} />
              PREMIUM
            </span>
          </div>
        )}

        <div className="yn-pe-scroll">

          <section className="yn-pe-section">
            <div className="yn-pe-complete-row">
              <h2>Complete your profile</h2>
              <span className="yn-pe-complete-pct">{completeness.percent}%</span>
            </div>
            <div className="yn-pe-bar">
              <span style={{ width: `${completeness.percent}%` }} />
            </div>
            {photoMissing && (
              <div className="yn-pe-hint">
                <p>Show yourself with photos. Profiles with photos get more video chats.</p>
                <button type="button" onClick={() => pickPhoto(null)} disabled={uploading} className="yn-pe-hint-btn">
                  {uploading ? "Processing…" : "Add Photo"}
                </button>
              </div>
            )}
          </section>

          <section className="yn-pe-section">
            <div className="flex items-center justify-between">
              <h2 className="yn-pe-kicker">Photos</h2>
              {photoBoost > 0 && <span className="yn-pe-boost">+{photoBoost}%</span>}
            </div>
            <p className="yn-pe-muted">
              {photoCount >= MAX_PHOTOS
                ? "Photos are stored on your profile. Videos are not available yet."
                : photoCount === 0
                  ? "Add a photo so people can see you in video chat."
                  : photoCount === 1
                    ? "Upload 1 more photo to complete this section."
                    : "Photos only for now — video upload is not available yet."}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <div className="yn-pe-photos">
              {photoSlots.map((slot) =>
                slot.src ? (
                  <div key={`p-${slot.index}`} className={`yn-pe-photo yn-pe-photo--${slot.index % 3}`}>
                    <button
                      type="button"
                      className="h-full w-full"
                      onClick={() => setAsMain(slot.index)}
                      aria-label={slot.index === 0 ? "Main photo" : "Set as main photo"}
                    >
                      <img src={slot.src} alt="" />
                    </button>
                    {slot.index === 0 && <span className="yn-pe-main">MAIN</span>}
                    {slot.index === 0 ? (
                      <button
                        type="button"
                        onClick={() => pickPhoto(0)}
                        className="yn-pe-photo-tool"
                        aria-label="Replace main photo"
                      >
                        <Pencil size={12} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => deletePhoto(slot.index)}
                        className="yn-pe-photo-tool"
                        aria-label="Delete photo"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    key={`e-${slot.index}`}
                    type="button"
                    onClick={() => pickPhoto(null)}
                    disabled={uploading}
                    className="yn-pe-photo yn-pe-photo--empty"
                    aria-label="Add photo"
                  >
                    <Plus size={26} />
                  </button>
                )
              )}
            </div>
            <p className="yn-pe-muted" style={{ marginTop: 8 }}>
              Don’t share inappropriate content or personal information. Uploads may be reviewed.
            </p>
          </section>

          <section className="yn-pe-section">
            <h2 className="yn-pe-kicker">Interests</h2>
            <div className="yn-pe-chips">
              {formData.interests.length > 0 ? (
                formData.interests.map((tag, i) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setShowInterests(true)}
                    className={`yn-interest-chip yn-pe-chip yn-pe-chip--${interestTone(tag, i)}`}
                  >
                    <InterestIcon tag={tag} size={14} />
                    {tag}
                  </button>
                ))
              ) : (
                <button type="button" onClick={() => setShowInterests(true)} className="yn-pe-chip yn-pe-chip--empty">
                  <Plus size={14} />
                  Add interests
                </button>
              )}
            </div>
          </section>

          <section className="yn-pe-section">
            <div className="yn-pe-rows">
              <Row
                icon={<User size={18} />}
                label="Name"
                value={formData.fullName}
                placeholder="Add your name"
                onClick={() => openSheet("name")}
                tone="pink"
              />
              <Row
                icon={<Cake size={18} />}
                label="Age"
                value={formData.age ? String(formData.age) : ""}
                placeholder="Add your age"
                onClick={() => openSheet("age")}
                tone="pink"
              />
              <Row
                icon={<GenderMark />}
                label="Gender"
                value={formData.gender}
                placeholder="Select gender"
                onClick={() => openSheet("gender")}
                tone="pink"
              />
              <Row
                icon={<MessageCircle size={18} />}
                label="Languages"
                value={formData.languages.map(languageLabel).join(", ")}
                placeholder="Add languages"
                onClick={() => openSheet("languages")}
                tone="cyan"
              />
              <Row
                icon={<Pencil size={16} />}
                label="About me"
                value={formData.bio}
                placeholder="How would you describe your vibe?"
                onClick={() => openSheet("about")}
                tone="purple"
              />
              <Row
                icon={<MapPin size={18} />}
                label="Location"
                value={formData.country}
                placeholder="Select country"
                onClick={() => openSheet("location")}
                tone="purple"
                valueNode={
                  formData.country ? <CountryLabel country={formData.country} size={16} /> : undefined
                }
              />
            </div>
          </section>

          <section className="yn-pe-section">
            <button type="button" className="yn-pe-badge" onClick={() => openSheet("badge")} aria-label="YouNeon Badge">
              <BadgeShield />
              <div className="yn-pe-badge-body">
                <p className="yn-pe-badge-title">YouNeon Badge</p>
                <p className="yn-pe-badge-sub">progress</p>
                <div className="yn-pe-badge-bar">
                  <span style={{ width: `${badgeProgress}%` }} />
                </div>
                <div className="yn-pe-badge-meta">
                  <span>
                    {isPremium ? badgeTotal : badgeDone} / {badgeTotal}
                  </span>
                  <span>{badgeNextLabel}</span>
                </div>
              </div>
            </button>
          </section>

          <section className="yn-pe-section">
            <h2 className="yn-pe-kicker">Reactions received</h2>
            <p className="yn-pe-muted">
              {reactionTotal > 0
                ? `${reactionTotal} video chat reactions earned!`
                : "Gifts you receive in video chat (rose, heart, and others) count here. Counts stay at 0 until someone actually sends one."}
            </p>
            <div className="yn-pe-rows">
              {REACTION_TYPES.map((r, i) => {
                const tone = NEON_TONES[i % NEON_TONES.length];
                return (
                  <Row
                    key={r.id}
                    icon={<ReactionIcon id={r.id} size={20} />}
                    label={r.id}
                    value={String(reactionCount(reactionsMap, r.id))}
                    placeholder="0"
                    tone={tone}
                    accentValue
                  />
                );
              })}
            </div>
          </section>

          {error && <p className="yn-pe-status is-error">{error}</p>}
          {saving && <p className="yn-pe-status is-saving">Saving…</p>}
        </div>

        {sheet === "name" && (
          <BottomSheet
            title="Change Name"
            subtitle="Be advised, inappropriate names will be rejected. You can change your name up to 3 times a month."
            onClose={() => setSheet(null)}
            footer={
              <button type="button" className={APPLY} disabled={!nameValid || (nameChanged && changesLeft <= 0)} onClick={applyName}>
                Apply
              </button>
            }
          >
            <input
              type="text"
              value={draftName}
              maxLength={NAME_MAX}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Please enter your name"
              className="yn-pe-input"
            />
            <div className="mt-1.5 flex justify-between text-[12px] yn-pe-sheet-muted">
              <span>{changesLeft} changes left this month</span>
              <span>
                {draftName.length}/{NAME_MAX}
              </span>
            </div>
          </BottomSheet>
        )}

        {sheet === "about" && (
          <BottomSheet
            title="About me"
            subtitle="How would you describe your vibe?"
            onClose={() => setSheet(null)}
            footer={
              <button type="button" className={APPLY} disabled={!bioValid} onClick={applyBio}>
                Apply
              </button>
            }
          >
            <div className="relative">
              <textarea
                value={draftBio}
                maxLength={BIO_MAX}
                onChange={(e) => setDraftBio(e.target.value)}
                rows={5}
                className="yn-pe-area"
                placeholder="A short intro about you"
              />
              <span className="absolute bottom-3 right-3 text-[12px] yn-pe-sheet-muted">
                {draftBio.length}/{BIO_MAX}
              </span>
            </div>
          </BottomSheet>
        )}

        {sheet === "languages" && (
          <BottomSheet
            title="Languages"
            subtitle="Meet friends who speak your selected languages (up to 5)"
            onClose={() => setSheet(null)}
            footer={
              <button type="button" className={APPLY} disabled={draftLangs.length === 0} onClick={applyLanguages}>
                Apply
              </button>
            }
          >
            <div className="max-h-[46vh] overflow-y-auto">
              {draftLangs.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-[12px] font-medium uppercase tracking-wide yn-pe-sheet-muted">Selected</p>
                  <div className="flex flex-wrap gap-1.5">
                    {draftLangs.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setDraftLangs((prev) => prev.filter((x) => x !== id))}
                        className="yn-pe-lang-chip"
                      >
                        {languageLabel(id)}
                        <X size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <input
                type="search"
                value={langQuery}
                onChange={(e) => setLangQuery(e.target.value)}
                placeholder="Add"
                className="yn-pe-search"
              />
              <div className="space-y-0.5">
                {addableLangs.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    disabled={draftLangs.length >= MAX_LANGUAGES}
                    onClick={() =>
                      setDraftLangs((prev) => (prev.includes(l.id) || prev.length >= MAX_LANGUAGES ? prev : [...prev, l.id]))
                    }
                    className="yn-pe-pick"
                  >
                    <span>
                      {l.native}
                      {l.native !== l.id ? <span className="ml-2 yn-pe-sheet-muted">{l.id}</span> : null}
                    </span>
                    <Plus size={16} className="yn-pe-sheet-muted" />
                  </button>
                ))}
              </div>
            </div>
          </BottomSheet>
        )}

        {sheet === "location" && (
          <BottomSheet
            title="Location"
            subtitle="Choose the country you want people to see."
            onClose={() => setSheet(null)}
            footer={
              <button type="button" className={APPLY} disabled={!draftCountry.trim()} onClick={applyCountry}>
                Apply
              </button>
            }
          >
            <input
              type="search"
              value={countryQuery}
              onChange={(e) => setCountryQuery(e.target.value)}
              placeholder="Search country"
              className="yn-pe-search"
            />
            <div className="max-h-[40vh] overflow-y-auto">
              {filteredCountries.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDraftCountry(c)}
                  className={`yn-pe-country${draftCountry === c ? " is-on" : ""}`}
                >
                  <CountryLabel country={c} size={18} />
                </button>
              ))}
            </div>
          </BottomSheet>
        )}

        {sheet === "age" && (
          <BottomSheet
            title="Age"
            subtitle={`Must be between ${AGE_MIN} and ${AGE_MAX}. Used in Lounge Around My Age.`}
            onClose={() => setSheet(null)}
            footer={
              <button
                type="button"
                className={APPLY}
                disabled={!Number.isFinite(ageNum) || ageNum < AGE_MIN || ageNum > AGE_MAX}
                onClick={applyAge}
              >
                Apply
              </button>
            }
          >
            <input
              type="number"
              min={AGE_MIN}
              max={AGE_MAX}
              value={draftAge}
              onChange={(e) => setDraftAge(e.target.value)}
              className="yn-pe-search"
            />
            {/* Kick a production build of the JSX closer fix. */}
          </BottomSheet>
        )}

        {sheet === "gender" && (
          <BottomSheet title="Gender" onClose={() => setSheet(null)}>
            <div className="space-y-1.5 pb-2">
              {GENDER_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => applyGender(option)}
                  className={`yn-pe-gender${formData.gender === option ? " is-on" : ""}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </BottomSheet>
        )}

        {sheet === "badge" && (
          <BottomSheet title="YouNeon Badge" onClose={() => setSheet(null)}>
            <p className="pb-4 text-[13px] leading-relaxed yn-pe-sheet-muted">
              The bar fills as you complete your profile: photo, name, age (18+), bio, country, languages, and
              interests. Premium counts as complete. You earn the YouNeon Badge only if that is done, you have no
              reports against you in the last 14 days, and your account is at least a day old or you have finished at
              least one real video chat. It is not a background check and not awarded for fake progress.
            </p>
          </BottomSheet>
        )}

        {showInterests && (
          <ProfileInterestsPage
            selected={formData.interests}
            onChange={(interests) => void applyInterests(interests)}
            onBack={() => void closeInterests()}
          />
        )}

        <ProfileSettingsSheet
          open={showSettings}
          onClose={() => setShowSettings(false)}
          neonBalance={neonBalance}
          isPremium={isPremium}
          premiumUntil={premiumUntil}
          announcements={announcements}
          currentUsername={currentUsername}
          onOpenShop={onOpenShop}
        />

        <ProfilePreviewSheet
          open={showPreview}
          onClose={() => setShowPreview(false)}
          userId={currentUsername}
          viewerId={currentUsername}
          seed={previewUser}
          mode="selfPreview"
          standalone
        />
      </div>
    </div>
  );
}
