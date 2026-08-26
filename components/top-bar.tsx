"use client";

import { useState } from "react";
import { NotificationsScreen } from "@/components/notifications-screen";
import { MyItemsSheet } from "@/components/my-items-sheet";
import { YouNeonBagIconNeon, YouNeonBellIcon } from "@/components/icons/youneon-chrome-icons";
import { YouNeonScriptLogo } from "@/components/youneon-script-logo";
import { NeonAvatar } from "@/components/neon-avatar";
import { useNotificationInbox } from "@/hooks/use-notification-inbox";
import type { Announcement } from "@/lib/announcements";

interface TopBarProps {
  onProfileClick: () => void;
  neonBalance: number;
  onNeonClick?: () => void;
  isPremium?: boolean;
  premiumUntil?: string | null;
  announcements?: Announcement[];
  profilePicture?: string;
  photos?: string[];
  profileName?: string;
  currentUserId?: string;
  onOpenChat?: (user: { id: string; name: string; avatar: string; photo?: string }) => void;
  onOpenMessages?: () => void;
  freeUnlocksRemaining?: number;
}

export function TopBar({
  onProfileClick,
  neonBalance,
  onNeonClick,
  isPremium = false,
  premiumUntil = null,
  announcements = [],
  profilePicture,
  photos,
  profileName,
  currentUserId,
  onOpenChat,
  onOpenMessages,
  freeUnlocksRemaining = 0,
}: TopBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const { items, unread, markAllRead } = useNotificationInbox(currentUserId, announcements);
  const bagActive = freeUnlocksRemaining > 0;
  const bagCount = Math.min(99, Math.max(0, Math.floor(freeUnlocksRemaining)));
  const photoSrc = profilePicture || photos?.[0] || "";

  const openPanel = () => {
    setPanelOpen(true);
    markAllRead();
  };

  return (
    <>
      <div className="yn-chrome yn-topbar fixed top-0 left-0 right-0 z-50 border-b px-4 pt-[env(safe-area-inset-top)]">
        <div className="relative flex h-14 items-center justify-between gap-3">
          <div className="relative z-10 flex min-w-0 items-center">
            <button
              type="button"
              onClick={onProfileClick}
              className="relative shrink-0 rounded-full p-[2px] active:scale-95"
              style={{
                background: "linear-gradient(135deg, var(--pink) 0%, #c084fc 48%, #7c3aed 100%)",
                boxShadow:
                  "0 0 8px var(--pink-soft), 0 0 16px rgba(168, 85, 247, 0.5)",
              }}
              aria-label="Open profile"
              data-testid="topbar-profile-photo"
            >
              <span className="block overflow-hidden rounded-full bg-[#080412]">
                <NeonAvatar
                  src={photoSrc}
                  name={profileName}
                  size={32}
                  alt={profileName || "Your profile"}
                />
              </span>
            </button>
          </div>

          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
            <YouNeonScriptLogo />
          </div>

          <div className="relative z-10 flex shrink-0 flex-col items-end gap-0.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={openPanel}
                className="yn-chrome-neon relative flex h-9 w-9 items-center justify-center rounded-full active:scale-95"
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
              >
                <YouNeonBellIcon size={28} className="yn-chrome-icon" />
                {unread > 0 && (
                  <span className="yn-chrome-count is-bell">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setItemsOpen(true)}
                className="yn-chrome-neon relative flex h-9 w-9 items-center justify-center rounded-full active:scale-95"
                title={
                  bagActive
                    ? `${bagCount} free chat ${bagCount === 1 ? "unlock" : "unlocks"} today`
                    : "No free chat unlocks left today"
                }
                aria-label={
                  bagActive
                    ? `${bagCount} free chat ${bagCount === 1 ? "unlock" : "unlocks"} remaining today`
                    : "No free chat unlocks remaining today"
                }
                data-testid="free-message-bag"
              >
                <YouNeonBagIconNeon size={28} className="yn-chrome-icon" />
                {bagActive && (
                  <span className="yn-chrome-count is-bag">
                    {bagCount > 9 ? "9+" : bagCount}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={onNeonClick}
              className="yn-chrome-gold flex items-center gap-1 pr-0.5 transition-opacity active:scale-95"
              aria-label="Open Neon shop"
            >
              <span className="text-[11px] leading-none">◆</span>
              <span className="text-[11px] font-semibold leading-none">
                Neon Balance: {neonBalance.toLocaleString()}
              </span>
            </button>
          </div>
        </div>
      </div>
      <NotificationsScreen
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        announcements={announcements}
        items={items}
        markAllRead={markAllRead}
        isPremium={isPremium}
        premiumUntil={premiumUntil}
        onOpenShop={onNeonClick}
        onOpenChat={onOpenChat}
        onOpenMessages={onOpenMessages}
      />
      <MyItemsSheet
        open={itemsOpen}
        onClose={() => setItemsOpen(false)}
        freeUnlocksRemaining={freeUnlocksRemaining}
        onEnterShop={onNeonClick}
        username={currentUserId}
      />
    </>
  );
}
