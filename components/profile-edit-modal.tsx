"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ChevronDown, MapPin, X } from "lucide-react";
import { PremiumBadge } from "@/components/premium-badge";
import { AnnouncementsAdmin } from "@/components/announcements-admin";
import { isCurrentUserAdmin } from "@/lib/admin";
import { compressImageFile } from "@/lib/compress-image";
import { COUNTRY_OPTIONS, isCountryOption } from "@/lib/countries";
import type { Announcement } from "@/lib/announcements";

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
};

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (profile: ProfileSavePayload) => void | Promise<void>;
  isPremium?: boolean;
  announcements?: Announcement[];
  currentUsername?: string;
  currentUser?: ProfileModalUser | null;
}

const INTEREST_OPTIONS = [
  "Travel", "Gaming", "Music", "Language Exchange", "Dating", "Friends", "Sports",
  "Books", "Movies", "Art", "Technology", "Cooking", "Photography", "Hiking",
  "Yoga", "Fitness", "Fashion", "Design", "Business", "Education",
];

const FIELD =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3.5 text-[14px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-purple-400/55 focus:ring-1 focus:ring-purple-400/35";

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
  };
}

function formFromSources(user?: ProfileModalUser | null): ProfileSavePayload {
  const stored = typeof window !== "undefined" ? readStoredProfile() : {};
  const src = { ...stored, ...user };
  const rawPlace = src.country || src.location || "";
  const country = isCountryOption(rawPlace) ? rawPlace : "";
  const gender = src.gender && isProfileGender(src.gender) ? src.gender : "";
  return {
    fullName: src.fullName || "",
    age: typeof src.age === "number" && src.age > 0 ? src.age : 18,
    country,
    location: country,
    gender,
    bio: src.bio || "",
    interests: Array.isArray(src.interests) ? src.interests : [],
    languages: Array.isArray(src.languages) && src.languages.length > 0 ? src.languages : ["English"],
    profilePicture: src.profilePicture || "",
  };
}

export function ProfileEditModal({
  isOpen,
  onClose,
  onSave,
  isPremium = false,
  announcements = [],
  currentUsername,
  currentUser,
}: ProfileEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ProfileSavePayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setFormData(formFromSources(currentUser));
    setError("");
    setSaving(false);
    setUploading(false);
  }, [isOpen, currentUser]);

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
      const profilePicture = await compressImageFile(file);
      setFormData((prev) => ({ ...prev, profilePicture }));
    } catch {
      setError("Could not process that photo. Try another image.");
    } finally {
      setUploading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => {
      const current = prev.interests || [];
      const interests = current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest];
      return { ...prev, interests };
    });
  };

  const setCountry = (country: string) => {
    setFormData((prev) => ({ ...prev, country, location: country }));
  };

  const handleSave = async () => {
    const fullName = formData.fullName.trim();
    if (!fullName) {
      setError("Please enter your name.");
      return;
    }
    const age = Number(formData.age);
    if (!Number.isFinite(age) || age < 18 || age > 99) {
      setError("Age must be between 18 and 99.");
      return;
    }
    if (!isCountryOption(formData.country)) {
      setError("Please select your country.");
      return;
    }
    if (!isProfileGender(formData.gender)) {
      setError("Please select gender.");
      return;
    }

    const payload: ProfileSavePayload = {
      ...formData,
      fullName,
      age,
      country: formData.country,
      location: formData.country,
      gender: formData.gender,
      bio: formData.bio.trim(),
      profilePicture: formData.profilePicture || "",
    };

    setSaving(true);
    setError("");
    try {
      localStorage.setItem("youneon_user_profile", JSON.stringify(payload));
      await onSave?.(payload);
      onClose();
    } catch {
      setError("Saved on this device. Cloud sync failed — try again later.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        aria-label="Close profile"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0f0117] shadow-2xl sm:rounded-2xl">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/8 bg-gradient-to-r from-purple-600/90 to-pink-600/90 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="text-[16px] font-semibold tracking-tight text-white">Edit Profile</h1>
            {isPremium && <PremiumBadge size="sm" />}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="mb-6 flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="group relative h-[112px] w-[112px] overflow-hidden rounded-full border-2 border-purple-400/50 bg-white/[0.06] shadow-[0_0_24px_rgba(168,85,247,0.22)] transition-transform active:scale-[0.98] disabled:opacity-70"
              aria-label="Upload profile photo"
            >
              {formData.profilePicture ? (
                <img
                  src={formData.profilePicture}
                  alt="Your profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[36px]">👤</span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={22} className="text-white" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-3 h-11 rounded-xl px-4 text-[13px] font-medium text-purple-300 transition-colors hover:text-pink-300 disabled:opacity-60"
            >
              {uploading ? "Processing photo…" : formData.profilePicture ? "Change photo" : "Add photo"}
            </button>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-white/50">Name</span>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={FIELD}
                placeholder="Your name"
                maxLength={40}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-white/50">Age</span>
              <input
                type="number"
                min={18}
                max={99}
                value={formData.age || ""}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 0 })}
                className={FIELD}
                placeholder="18"
              />
            </label>

            <div>
              <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-white/50">
                Gender
              </span>
              <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-0.5">
                {GENDER_OPTIONS.map((option) => {
                  const selected = formData.gender === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: option })}
                      className={`flex h-11 flex-1 items-center justify-center rounded-[10px] px-1 text-center text-[12px] font-semibold leading-tight transition-all sm:text-[13px] ${
                        selected
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_2px_10px_rgba(168,85,247,0.28)]"
                          : "bg-transparent text-white/70 hover:text-white"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1 text-[12px] font-medium uppercase tracking-wide text-white/50">
                <MapPin size={12} /> Location
              </span>
              <span className="relative block">
                <select
                  value={isCountryOption(formData.country) ? formData.country : ""}
                  onChange={(e) => setCountry(e.target.value)}
                  className={`${FIELD} appearance-none pr-10`}
                >
                  <option value="" disabled>
                    Select country
                  </option>
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country} value={country} className="bg-[#16101f] text-white">
                      {country}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/45"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-white/50">Bio</span>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className={`${FIELD} h-24 resize-none py-2.5 leading-relaxed`}
                placeholder="A short intro about you"
                maxLength={180}
              />
            </label>

            <div>
              <span className="mb-2 block text-[12px] font-medium uppercase tracking-wide text-white/50">Interests</span>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_OPTIONS.map((interest) => {
                  const active = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`h-9 rounded-full px-3 text-[12px] font-medium transition-colors ${
                        active
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border border-white/10 bg-white/[0.04] text-white/70 hover:border-purple-400/40 hover:text-white"
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {isCurrentUserAdmin(currentUsername) && (
            <div className="mt-5 rounded-xl border border-purple-400/25 bg-purple-500/10 p-3">
              <AnnouncementsAdmin announcements={announcements} />
            </div>
          )}

          {error && (
            <p className="mt-4 text-center text-[13px] text-pink-300">{error}</p>
          )}
        </div>

        <div className="shrink-0 border-t border-white/8 px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex h-11 w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-purple-600 to-pink-600 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(168,85,247,0.32)] transition-transform active:scale-[0.985] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
