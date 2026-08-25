"use client";
import { useState, useEffect } from "react";
import { ChevronRight, Zap, Globe, LogOut, Trash2, ArrowLeft } from "lucide-react";
import { useLanguage, type Language } from "@/contexts/language-context";
import { piAuthService } from "@/lib/pi-auth-service";
import { SubscribeWithPi } from "@/components/subscribe-with-pi";
import { AnnouncementsAdmin } from "@/components/announcements-admin";
import { isCurrentUserAdmin } from "@/lib/admin";
import { isPremiumActive, readStoredPremiumUntil } from "@/lib/premium";
import {
  seedAnnouncementsIfEmpty,
  subscribeToAnnouncements,
  type Announcement,
} from "@/lib/announcements";
import { readLiteSession } from "@/lib/pi-client-session";

interface SettingsScreenProps {
  onBack: () => void;
  onLogOut: () => void;
}

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "da", name: "Dansk", flag: "🇩🇰" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "sv", name: "Svenska", flag: "🇸🇪" },
];

export function SettingsScreen({ onBack, onLogOut }: SettingsScreenProps) {
  const { language, setLanguage } = useLanguage();
  const [neonBalance, setNeonBalance] = useState(100);
  const [isMounted, setIsMounted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    setIsMounted(true);
    try {
      if (typeof window !== "undefined" && typeof Storage !== "undefined") {
        const balance = localStorage.getItem("youneon_neon_balance");
        if (balance) {
          setNeonBalance(parseInt(balance));
        }
        setPremiumUntil(readStoredPremiumUntil());
        const piUser = piAuthService.getCurrentUser();
        const lite = readLiteSession();
        setUsername(piUser?.username || lite?.username || "");
      }
    } catch (e) {
      console.error("[v0] Error loading neon balance:", e);
    }

    let unsub: (() => void) | undefined;
    seedAnnouncementsIfEmpty()
      .catch(() => {})
      .finally(() => {
        unsub = subscribeToAnnouncements(setAnnouncements);
      });
    return () => unsub?.();
  }, []);

  const handleDeleteAccount = () => {
    try {
      if (typeof window !== "undefined" && typeof Storage !== "undefined") {
        // Clear all user data
        localStorage.removeItem("youneon_user_profile");
        localStorage.removeItem("youneon_authenticated");
        localStorage.removeItem("youneon_neon_balance");
        localStorage.removeItem("youneon_reactions_received");
        localStorage.removeItem("youneon_reports");
        localStorage.removeItem("youneon_reported_users");
        localStorage.removeItem("youneon_blocked_users");
      }
      
      // Logout from Pi service
      piAuthService.logout();
    } catch (e) {
      console.error("[v0] Error deleting account:", e);
    }
    window.location.reload();
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-yn-bg flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yn-bg pt-24 pb-24">
      {/* Settings Header */}
      <div className="px-4 py-4 border-b border-gray-200 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <h1 className="text-3xl font-black text-gray-900">Settings</h1>
      </div>

      {/* Settings Content */}
      <div className="px-4 py-6 space-y-4">
        {/* My Neon - Top Priority */}
        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-yellow-50 border-2 border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/30 transition">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center text-lg shadow-lg shadow-yellow-500/40">
              ◆
            </div>
            <div className="flex flex-col items-start">
              <span className="text-gray-900 text-sm font-semibold">My Neon</span>
              <span className="text-yellow-600 text-xs font-bold">{neonBalance} Neon</span>
            </div>
          </div>
          <ChevronRight size={24} className="text-yellow-600" />
        </button>

        <SubscribeWithPi
          variant="settings"
          isPremium={isPremiumActive(premiumUntil)}
          premiumUntil={premiumUntil}
        />

        {isCurrentUserAdmin(username) && (
          <div className="space-y-3 rounded-xl border border-purple-200 bg-purple-50 p-4">
            <a
              href="/admin"
              className="flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-[14px] font-semibold text-white"
            >
              Open admin panel
            </a>
            <AnnouncementsAdmin announcements={announcements} />
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-200 my-2"></div>

        {/* Language Section */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide px-2">App Language</h3>
          <div className="space-y-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                  language === lang.code
                    ? "bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-400 shadow-lg shadow-purple-400/30"
                    : "bg-white border-2 border-gray-300 hover:border-purple-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className={`font-medium ${language === lang.code ? "text-purple-700" : "text-gray-900"}`}>
                    {lang.name}
                  </span>
                </div>
                {language === lang.code && (
                  <span className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 my-4"></div>

        {/* Account Section */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide px-2">Account</h3>
          <div className="space-y-2">
            {/* Log Out Button */}
            <button
              onClick={() => {
                try {
                  if (typeof window !== "undefined" && typeof Storage !== "undefined") {
                    localStorage.removeItem("youneon_user_profile");
                    localStorage.removeItem("youneon_authenticated");
                  }
                } catch (e) {
                  console.error("[v0] Error clearing profile:", e);
                }
                onLogOut();
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-50 border-2 border-red-400 hover:shadow-lg hover:shadow-red-400/30 transition"
            >
              <LogOut size={20} className="text-red-600" />
              <span className="flex-1 text-left font-semibold text-red-600">Log Out</span>
              <ChevronRight size={20} className="text-red-600" />
            </button>

            {/* Delete Account Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-50 border-2 border-red-400 hover:shadow-lg hover:shadow-red-400/30 transition"
            >
              <Trash2 size={20} className="text-red-600" />
              <span className="flex-1 text-left font-semibold text-red-600">Delete My Account</span>
              <ChevronRight size={20} className="text-red-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl px-6 py-8 max-w-sm space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={32} className="text-red-600" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-gray-900">Delete Account?</h2>
              <p className="text-gray-600 text-sm">This action cannot be undone. All your data, conversations, and profile will be permanently deleted.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  handleDeleteAccount();
                }}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
              >
                Delete My Account
              </button>

              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
