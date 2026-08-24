"use client";

import { api, setApiAuthToken } from "@/lib/api";
import {
  authenticatePi,
  handleIncompletePayment,
  PI_AUTH_SCOPES,
  PI_SDK_UNAVAILABLE,
} from "@/lib/pi-sdk";

export interface PiUser {
  username: string;
  uid?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

export interface UserProfile {
  piUsername: string;
  fullName: string;
  age: number;
  country: string;
  location?: string;
  gender?: string;
  languages: string[];
  interests: string[];
  profilePicture?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_PREFIX = "youneon_pi_";

function persistCurrentUser(piUser: PiUser): void {
  try {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem(`${STORAGE_PREFIX}current_user`, JSON.stringify(piUser));
    }
  } catch (e) {
    console.error("Error saving Pi user (non-critical):", e);
  }
}

export const piAuthService = {
  getCurrentUser: (): PiUser | null => {
    try {
      if (typeof window === "undefined" || typeof localStorage === "undefined") {
        return null;
      }

      const piUser = localStorage.getItem(`${STORAGE_PREFIX}current_user`);
      if (piUser) {
        return JSON.parse(piUser);
      }
      return null;
    } catch (e) {
      console.error("Error getting current user:", e);
      return null;
    }
  },

  setVerifiedUser: (user: PiUser): void => {
    persistCurrentUser(user);
  },

  loginWithPi: async (): Promise<PiUser> => {
    const auth = await authenticatePi(PI_AUTH_SCOPES, handleIncompletePayment);
    const accessToken = typeof auth?.accessToken === "string" ? auth.accessToken : "";
    if (!accessToken) {
      throw new Error("Pi did not return an access token");
    }

    const { data } = await api.post<{ uid: string; username: string }>("/api/pi/auth", {
      accessToken,
    });

    if (!data?.uid) {
      throw new Error("Pi verification failed");
    }

    setApiAuthToken(accessToken);
    const piUser: PiUser = {
      username: data.username || "",
      uid: data.uid,
    };
    persistCurrentUser(piUser);
    return piUser;
  },

  logout: (): void => {
    try {
      if (typeof window !== "undefined") {
        window.__PI_AUTH_OK = false;
        try {
          document.documentElement.classList.remove("youneon-signed-in");
        } catch {
          /* ignore */
        }
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem(`${STORAGE_PREFIX}current_user`);
          localStorage.removeItem(`${STORAGE_PREFIX}current_profile`);
          localStorage.removeItem("youneon_pi_session_lite");
          localStorage.removeItem("youneon_authenticated");
        }
        if (typeof window.__youneonClearPiAuth === "function") {
          window.__youneonClearPiAuth();
        }
      }
    } catch (e) {
      console.error("Error logging out (non-critical):", e);
    }

    setApiAuthToken(null);
    if (typeof window !== "undefined") {
      fetch("/api/pi/auth", { method: "DELETE", credentials: "include" }).catch(() => {});
    }
  },

  saveProfile: (profile: UserProfile): void => {
    try {
      if (typeof window === "undefined" || typeof localStorage === "undefined") {
        return;
      }

      const storageKey = `${STORAGE_PREFIX}profile_${profile.piUsername}`;
      const profileData = {
        ...profile,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(profileData));
      localStorage.setItem(`${STORAGE_PREFIX}current_profile`, JSON.stringify(profileData));
    } catch (e) {
      console.error("Error saving profile (non-critical):", e);
    }
  },

  loadProfile: (): UserProfile | null => {
    try {
      if (typeof window === "undefined" || typeof localStorage === "undefined") {
        return null;
      }

      const currentProfile = localStorage.getItem(`${STORAGE_PREFIX}current_profile`);
      if (currentProfile) {
        return JSON.parse(currentProfile);
      }
      return null;
    } catch (e) {
      console.error("Error loading profile:", e);
      return null;
    }
  },

  loadProfileForUser: (piUsername: string): UserProfile | null => {
    try {
      if (typeof window === "undefined" || typeof localStorage === "undefined") {
        return null;
      }

      const storageKey = `${STORAGE_PREFIX}profile_${piUsername}`;
      const profile = localStorage.getItem(storageKey);
      if (profile) {
        return JSON.parse(profile);
      }
      return null;
    } catch (e) {
      console.error("Error loading profile for user:", e);
      return null;
    }
  },

  hasCompletedOnboarding: (): boolean => {
    try {
      if (typeof window === "undefined" || typeof localStorage === "undefined") {
        return false;
      }

      return !!localStorage.getItem(`${STORAGE_PREFIX}current_profile`);
    } catch (e) {
      console.error("Error checking onboarding:", e);
      return false;
    }
  },
};

export { PI_SDK_UNAVAILABLE };
