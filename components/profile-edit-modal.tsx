"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Eye,
  Info,
  MapPin,
  Pencil,
  Plus,
  Settings,
  User,
  Languages as LanguagesIcon,
  X,
} from "lucide-react";
import { InterestIcon } from "@/components/icons/interest-icons";
import { ReactionIcon } from "@/components/icons/reaction-icons";
import { PremiumBadge } from "@/components/premium-badge";
import { ProfileInterestsPage } from "@/components/profile-interests-page";
import { ProfileSettingsSheet } from "@/components/profile-settings-sheet";
import { acquireProfileChromeLock, ProfilePreviewSheet } from "@/components/call-remote-profile";
import { compressImageFile } from "@/lib/compress-image";
import { CountryLabel } from "@/components/country-flag";
import { COUNTRY_OPTIONS, isCountryOption } from "@/lib/countries";
import type { Announcement } from "@/lib/announcements";
import type { UserProfile } from "@/lib/firestore-service";
import {
  AGE_MAX,
  AGE_MIN,
  BIO_MAX,
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
  fullName?: string;
  age?: number;
  country?: string;
  location?: string;
  gender?: string;
  bio?: string;
  interests?: string[];
  languages?: string[];
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
  "flex h-12 w-full items-center justify-center rounded-[14px] bg-[var(--pink)] text-[15px] font-semibold text-white shadow-[0_4px_16px_var(--pink-soft)] transition-transform active:scale-[0.985] active:bg-[var(--pink-pressed)] disabled:bg-yn-bg disabled:text-yn-muted disabled:shadow-none";

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
    languages: ["English"],
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

function formFromSources(user?: ProfileModalUser | null): ProfileSavePayload {
  const stored = typeof window !== "undefined" ? readStoredProfile() : {};
  const src = { ...stored, ...user };
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
    languages: Array.isArray(src.languages) && src.languages.length > 0
      ? src.languages.map(canonicalLanguage).filter(Boolean)
      : ["English"],
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
      <div className="relative w-full max-w-md rounded-t-3xl border border-black/8 bg-yn-card px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15" />
        <h3 className="text-[18px] font-semibold text-yn-text">{title}</h3>
        {subtitle && <p className="mt-1.5 text-[13px] leading-relaxed text-yn-muted">{subtitle}</p>}
        <div className="mt-4">{children}</div>
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
}

function Row({
  icon,
  value,
  placeholder,
  onClick,
}: {
  icon: React.ReactNode;
  value?: string;
  placeholder: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-yn-bg px-3.5 text-left"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-yn-muted">{icon}</span>
      <span className={`min-w-0 flex-1 truncate text-[14px] ${value ? "text-yn-text" : "text-yn-muted"}`}>
        {value || placeholder}
      </span>
      <ChevronRight size={18} className="shrink-0 text-yn-muted" />
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
    if (openedRef.current) return;
    openedRef.current = true;
    setFormData(formFromSources(currentUser));
    setError("");
    setSaving(false);
    setUploading(false);
    setSheet(null);
    setShowInterests(false);
    setShowSettings(false);
    setShowPreview(false);
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
      localStorage.setItem("youneon_user_profile", JSON.stringify(payload));
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
    <div className="fixed inset-0 z-[100] flex justify-center bg-yn-bg" data-testid="profile-editor">
      <div className="relative flex h-full w-full max-w-md flex-col">
        <header className="flex min-h-12 shrink-0 items-center gap-1 border-b border-black/6 px-2 pt-[env(safe-area-inset-top)]">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-yn-text hover:bg-yn-bg"
            aria-label="Close"
          >
            <X size={22} />
          </button>
          <h1 className="flex-1 text-center text-[17px] font-semibold text-yn-text">Profile</h1>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-yn-bg px-3 text-[13px] font-medium text-yn-text"
          >
            <Eye size={15} />
            Preview
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-yn-text hover:bg-yn-bg"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
          {isPremium && (
            <div className="mb-3 flex justify-center">
              <PremiumBadge size="sm" />
            </div>
          )}

          <section className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[16px] font-semibold text-yn-text">Complete your profile</h2>
                <Info size={14} className="text-yn-muted" />
              </div>
              <span className="text-[14px] font-semibold text-yn-accent">{completeness.percent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-yn-bg">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${completeness.percent}%` }}
              />
            </div>
            {photoMissing && (
              <div className="mt-3 rounded-2xl bg-yn-bg p-3.5">
                <p className="text-[13px] leading-relaxed text-yn-muted">
                  Show yourself with photos. Profiles with photos get more video chats.
                </p>
                <button
                  type="button"
                  onClick={() => pickPhoto(null)}
                  disabled={uploading}
                  className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-white text-[14px] font-semibold text-[#1a0a24]"
                >
                  {uploading ? "Processing…" : "Add Photo"}
                </button>
              </div>
            )}
          </section>

          <section className="mb-6">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-yn-text">Photos & Videos</h2>
              {photoBoost > 0 && (
                <span className="text-[13px] font-semibold text-yn-accent">+{photoBoost}%</span>
              )}
            </div>
            <p className="mb-3 text-[12px] text-yn-muted">
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
            <div className="grid grid-cols-3 gap-2">
              {photoSlots.map((slot) =>
                slot.src ? (
                  <div key={`p-${slot.index}`} className="relative aspect-square overflow-hidden rounded-xl bg-yn-bg">
                    <button
                      type="button"
                      className="h-full w-full"
                      onClick={() => setAsMain(slot.index)}
                      aria-label={slot.index === 0 ? "Main photo" : "Set as main photo"}
                    >
                      <img src={slot.src} alt="" className="h-full w-full object-cover" />
                    </button>
                    {slot.index === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Main
                      </span>
                    )}
                    {slot.index === 0 ? (
                      <button
                        type="button"
                        onClick={() => pickPhoto(0)}
                        className="absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white"
                        aria-label="Replace main photo"
                      >
                        <Pencil size={13} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => deletePhoto(slot.index)}
                        className="absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white"
                        aria-label="Delete photo"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    key={`e-${slot.index}`}
                    type="button"
                    onClick={() => pickPhoto(null)}
                    disabled={uploading}
                    className="flex aspect-square items-center justify-center rounded-xl bg-yn-bg text-yn-muted"
                    aria-label="Add photo"
                  >
                    <Plus size={28} />
                  </button>
                )
              )}
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-yn-muted">
              <span className="mt-0.5">!</span>
              Don’t share inappropriate content or personal information. Uploads may be reviewed.
            </p>
          </section>

          <section className="mb-6">
            <div className="mb-2 flex items-center gap-1.5">
              <h2 className="text-[16px] font-semibold text-yn-text">Interests</h2>
              <Info size={14} className="text-yn-muted" />
            </div>
            <button
              type="button"
              onClick={() => setShowInterests(true)}
              className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-yn-bg px-3.5 text-left"
            >
              <span className="text-[14px] text-yn-muted">Tell us, what&apos;s your current obsession?</span>
              <ChevronRight size={18} className="text-yn-muted" />
            </button>
            {formData.interests.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {formData.interests.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setShowInterests(true)}
                    className="yn-interest-chip inline-flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-yn-card px-3 text-[12px] font-medium text-yn-text"
                  >
                    <InterestIcon tag={tag} size={14} />
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="mb-5">
            <h2 className="mb-2 text-[16px] font-semibold text-yn-text">Name</h2>
            <Row
              icon={<User size={18} />}
              value={formData.fullName}
              placeholder="Add your name"
              onClick={() => openSheet("name")}
            />
          </section>

          <section className="mb-5">
            <h2 className="mb-2 text-[16px] font-semibold text-yn-text">Age</h2>
            <Row
              icon={<span className="text-[15px]">🎂</span>}
              value={formData.age ? String(formData.age) : ""}
              placeholder="Add your age"
              onClick={() => openSheet("age")}
            />
          </section>

          <section className="mb-5">
            <h2 className="mb-2 text-[16px] font-semibold text-yn-text">Gender</h2>
            <Row
              icon={<span className="text-[15px]">◎</span>}
              value={formData.gender}
              placeholder="Select gender"
              onClick={() => openSheet("gender")}
            />
          </section>

          <section className="mb-5">
            <h2 className="mb-2 text-[16px] font-semibold text-yn-text">Languages</h2>
            <Row
              icon={<LanguagesIcon size={18} />}
              value={formData.languages.map(languageLabel).join(", ")}
              placeholder="Add languages"
              onClick={() => openSheet("languages")}
            />
          </section>

          <section className="mb-5">
            <h2 className="mb-2 text-[16px] font-semibold text-yn-text">About me</h2>
            <button
              type="button"
              onClick={() => openSheet("about")}
              className="flex min-h-12 w-full items-start gap-3 rounded-2xl bg-yn-bg px-3.5 py-3 text-left"
            >
              <span className="mt-0.5 text-yn-muted">
                <Pencil size={16} />
              </span>
              <span className={`min-w-0 flex-1 text-[14px] leading-relaxed ${formData.bio ? "text-yn-text" : "text-yn-muted"}`}>
                {formData.bio || "How would you describe your vibe?"}
              </span>
              <ChevronRight size={18} className="mt-0.5 shrink-0 text-yn-muted" />
            </button>
          </section>

          <section className="mb-5">
            <h2 className="mb-2 text-[16px] font-semibold text-yn-text">Location</h2>
            <button
              type="button"
              onClick={() => openSheet("location")}
              className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-yn-bg px-3.5 text-left"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-yn-muted">
                <MapPin size={18} />
              </span>
              <span className={`min-w-0 flex-1 truncate text-[14px] ${formData.country ? "text-yn-text" : "text-yn-muted"}`}>
                {formData.country ? <CountryLabel country={formData.country} size={18} /> : "Select country"}
              </span>
              <ChevronRight size={18} className="shrink-0 text-yn-muted" />
            </button>
          </section>

          <section className="mb-5">
            <div className="mb-1 flex items-center gap-1.5">
              <h2 className="text-[16px] font-semibold text-yn-text">YouNeon Badge</h2>
              <button type="button" onClick={() => openSheet("badge")} aria-label="Badge info">
                <Info size={14} className="text-yn-muted" />
              </button>
            </div>
            <p className="mb-3 text-[12px] text-yn-muted">Track your progress towards YouNeon Badge</p>
            <div className="rounded-2xl bg-yn-bg px-4 py-5">
              <div className="relative mb-2 h-8">
                {badgeEarned && (
                  <span className="absolute right-0 top-0 rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                    ✓ You got it!
                  </span>
                )}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-yn-bg">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{ width: `${badgeProgress}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-end text-[11px] text-yn-muted">Goal</div>
            </div>
          </section>

          <section className="mb-4">
            <h2 className="mb-3 text-[16px] font-semibold text-yn-text">Reactions Received</h2>
            <div className="rounded-2xl bg-yn-bg p-4">
              <p className="mb-3 text-[14px] font-semibold text-yn-text">
                {reactionTotal > 0
                  ? `${reactionTotal} video chat reactions earned!`
                  : "No reactions yet"}
              </p>
              {reactionTotal === 0 && (
                <p className="mb-3 text-[12px] leading-relaxed text-yn-muted">
                  Gifts you receive in video chat (rose, heart, and others) count here. Counts stay at 0 until someone actually sends one.
                </p>
              )}
              <ul className="space-y-2.5">
                {REACTION_TYPES.map((r) => (
                  <li key={r.id} className="flex h-10 items-center gap-3 text-[14px] text-yn-text">
                    <span className="flex w-8 items-center justify-center">
                      <ReactionIcon id={r.id} size={22} />
                    </span>
                    <span className="flex-1">{r.id}</span>
                    <span className="tabular-nums text-yn-muted">{reactionCount(reactionsMap, r.id)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {error && <p className="mb-2 text-center text-[13px] text-yn-accent">{error}</p>}
          {saving && <p className="text-center text-[12px] text-yn-muted">Saving…</p>}
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
              className="h-12 w-full border-0 border-b border-white/20 bg-transparent text-[16px] text-yn-text outline-none placeholder:text-yn-muted focus:border-pink-400"
            />
            <div className="mt-1.5 flex justify-between text-[12px] text-yn-muted">
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
                className="w-full resize-none rounded-2xl bg-yn-bg p-3.5 pr-16 text-[15px] leading-relaxed text-yn-text outline-none placeholder:text-yn-muted"
                placeholder="A short intro about you"
              />
              <span className="absolute bottom-3 right-3 text-[12px] text-yn-muted">
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
                  <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-yn-muted">Selected</p>
                  <div className="flex flex-wrap gap-1.5">
                    {draftLangs.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setDraftLangs((prev) => prev.filter((x) => x !== id))}
                        className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--pink)] px-3 text-[12px] font-medium text-white active:bg-[var(--pink-pressed)]"
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
                className="mb-2 h-11 w-full rounded-xl bg-yn-bg px-3.5 text-[14px] text-yn-text outline-none placeholder:text-yn-muted"
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
                    className="flex h-11 w-full items-center justify-between rounded-xl px-2 text-left text-[14px] text-yn-text hover:bg-black/5 disabled:opacity-40"
                  >
                    <span>
                      {l.native}
                      {l.native !== l.id ? <span className="ml-2 text-yn-muted">{l.id}</span> : null}
                    </span>
                    <Plus size={16} className="text-yn-muted" />
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
              className="mb-2 h-11 w-full rounded-xl bg-yn-bg px-3.5 text-[14px] text-yn-text outline-none placeholder:text-yn-muted"
            />
            <div className="max-h-[40vh] overflow-y-auto">
              {filteredCountries.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDraftCountry(c)}
                  className={`flex h-11 w-full items-center rounded-xl px-3 text-left text-[14px] ${
                    draftCountry === c ? "bg-purple-600/30 font-semibold text-yn-text" : "text-yn-muted"
                  }`}
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
              className="h-12 w-full rounded-xl bg-yn-bg px-3.5 text-[16px] text-yn-text outline-none"
            />
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
                  className={`flex h-12 w-full items-center justify-center rounded-xl text-[14px] font-semibold ${
                    formData.gender === option
                      ? "bg-[var(--pink)] text-white"
                      : "bg-yn-bg text-yn-muted"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </BottomSheet>
        )}

        {sheet === "badge" && (
          <BottomSheet title="YouNeon Badge" onClose={() => setSheet(null)}>
            <p className="pb-4 text-[13px] leading-relaxed text-yn-muted">
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
