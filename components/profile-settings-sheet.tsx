"use client";

import { useState } from "react";
import { ChevronRight, LogOut, Trash2, X, Zap } from "lucide-react";
import { SubscribeWithPi } from "@/components/subscribe-with-pi";
import { AnnouncementsAdmin } from "@/components/announcements-admin";
import { isCurrentUserAdmin } from "@/lib/admin";
import { useLanguage, type Language } from "@/contexts/language-context";
import { piAuthService } from "@/lib/pi-auth-service";
import type { Announcement } from "@/lib/announcements";

const APP_LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

export function ProfileSettingsSheet({
  open,
  onClose,
  neonBalance,
  isPremium,
  premiumUntil,
  announcements,
  currentUsername,
  onOpenShop,
}: {
  open: boolean;
  onClose: () => void;
  neonBalance: number;
  isPremium: boolean;
  premiumUntil: string | null;
  announcements: Announcement[];
  currentUsername?: string;
  onOpenShop?: () => void;
}) {
  const { language, setLanguage } = useLanguage();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!open) return null;

  const logout = () => {
    try {
      localStorage.removeItem("youneon_user_profile");
      localStorage.removeItem("youneon_authenticated");
    } catch {
      /* ignore */
    }
    piAuthService.logout();
    window.location.reload();
  };

  const deleteAccount = () => {
    try {
      localStorage.removeItem("youneon_user_profile");
      localStorage.removeItem("youneon_authenticated");
      localStorage.removeItem("youneon_neon_balance");
      localStorage.removeItem("youneon_reactions_received");
      localStorage.removeItem("youneon_reports");
      localStorage.removeItem("youneon_reported_users");
      localStorage.removeItem("youneon_blocked_users");
    } catch {
      /* ignore */
    }
    piAuthService.logout();
    window.location.reload();
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#0f0117]">
      <header className="flex min-h-12 shrink-0 items-center justify-between border-b border-white/8 px-2 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/85 hover:bg-white/10"
          aria-label="Close settings"
        >
          <X size={20} />
        </button>
        <h2 className="text-[17px] font-semibold text-white">Settings</h2>
        <span className="w-11" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => {
            onOpenShop?.();
            onClose();
          }}
          className="flex h-14 w-full items-center gap-3 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 px-4 text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 text-black">
            <Zap size={18} />
          </span>
          <span className="flex-1">
            <span className="block text-[14px] font-semibold text-white">My Neon</span>
            <span className="text-[12px] font-medium text-yellow-300">{neonBalance} Neon</span>
          </span>
          <ChevronRight size={18} className="text-yellow-400/80" />
        </button>

        <div className="-mx-4 mt-3">
          <SubscribeWithPi variant="shop" isPremium={isPremium} premiumUntil={premiumUntil} />
        </div>

        {isCurrentUserAdmin(currentUsername) && (
          <div className="mt-4 rounded-2xl border border-purple-400/25 bg-purple-500/10 p-3">
            <AnnouncementsAdmin announcements={announcements} />
          </div>
        )}

        <h3 className="mb-2 mt-6 px-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
          App language
        </h3>
        <div className="space-y-1.5">
          {APP_LANGUAGES.map((lang) => {
            const on = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`flex h-12 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[14px] font-medium ${
                  on
                    ? "border border-pink-400/40 bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white"
                    : "bg-white/[0.05] text-white/80"
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1">{lang.name}</span>
                {on && <span className="text-pink-300">✓</span>}
              </button>
            );
          })}
        </div>

        <h3 className="mb-2 mt-6 px-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
          Account
        </h3>
        <button
          type="button"
          onClick={logout}
          className="mb-1.5 flex h-12 w-full items-center gap-3 rounded-xl bg-white/[0.05] px-3.5 text-[14px] font-semibold text-pink-200"
        >
          <LogOut size={18} />
          Log out
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="flex h-12 w-full items-center gap-3 rounded-xl bg-red-500/10 px-3.5 text-[14px] font-semibold text-red-300"
        >
          <Trash2 size={18} />
          Delete my account
        </button>
      </div>

      {confirmDelete && (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a0a24] p-5">
            <h3 className="text-[17px] font-semibold text-white">Delete account?</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/55">
              This cannot be undone. Profile data on this device will be cleared and you will be signed out.
            </p>
            <button
              type="button"
              onClick={deleteAccount}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-red-600 text-[14px] font-semibold text-white"
            >
              Delete my account
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-white/10 text-[14px] font-semibold text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
