"use client";
import { useState, useEffect } from "react";

export interface UserProfile {
  fullName: string;
  age: number;
  country: string;
  languages: string[];
  interests: string[];
  profilePicture?: string; // Base64 encoded image
}

const PROFILE_STORAGE_KEY = "youneon_user_profile";

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse stored profile:", error);
        localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const saveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
  };

  const clearProfile = () => {
    setProfile(null);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  };

  return {
    profile,
    isLoading,
    saveProfile,
    clearProfile,
    hasProfile: profile !== null
  };
}
