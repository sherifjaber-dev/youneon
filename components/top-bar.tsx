"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Bell, Crown } from "lucide-react";
import { piAuthService } from "@/lib/pi-auth-service";
import { NotificationPanel } from "@/components/notification-panel";
import type { Announcement } from "@/lib/announcements";
import { markAnnouncementsRead, unreadAnnouncementCount } from "@/lib/announcements";

interface TopBarProps {
  onProfileClick: () => void;
  neonBalance: number;
  onNeonClick?: () => void;
  isPremium?: boolean;
  announcements?: Announcement[];
}

export function TopBar({
  onProfileClick,
  neonBalance,
  onNeonClick,
  isPremium = false,
  announcements = [],
}: TopBarProps) {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const user = piAuthService.getCurrentUser() || piAuthService.loadProfile();
    if (user?.profilePicture) {
      setProfilePic(user.profilePicture);
    }
  }, []);

  useEffect(() => {
    setUnread(unreadAnnouncementCount(announcements));
  }, [announcements]);

  const openPanel = () => {
    setPanelOpen(true);
    const ids = announcements.filter((item) => item.active).map((item) => item.id);
    markAnnouncementsRead(ids);
    setUnread(0);
  };

  return (
    <>
      <div className="yn-glass fixed top-0 left-0 right-0 z-50 border-b border-white/8 px-4 pt-[env(safe-area-inset-top)]">
        <div className="flex h-12 items-center justify-between gap-2">
          <button
            onClick={onProfileClick}
            className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/20 transition-transform active:scale-95"
            aria-label="Open profile"
          >
            {profilePic ? (
              <Image
                src={profilePic}
                alt="Your Profile"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-sm text-white">
                👤
              </div>
            )}
            {isPremium && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#0f0117] bg-gradient-to-br from-amber-400 to-pink-500">
                <Crown size={8} className="text-white" />
              </span>
            )}
          </button>

          <span className="min-w-0 truncate bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-[15px] font-semibold tracking-tight text-transparent">
            YouNeon
          </span>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={openPanel}
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/80 transition-colors hover:text-white active:scale-95"
              aria-label="Notifications"
            >
              <Bell size={16} strokeWidth={2} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-bold leading-none text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            <button
              onClick={onNeonClick}
              className="flex h-8 items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-2.5 transition-colors active:scale-95"
              aria-label="Open Neon shop"
            >
              <span className="text-[13px] text-yellow-400">◆</span>
              <span className="text-[13px] font-semibold tabular-nums text-yellow-300">{neonBalance}</span>
              <span className="text-[11px] font-medium text-yellow-300/70">Neon</span>
            </button>
          </div>
        </div>
      </div>
      <NotificationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        announcements={announcements}
      />
    </>
  );
}
