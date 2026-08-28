"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
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
      <div className="yn-chrome yn-topbar fixed top-0 left-0 right-0 z-50 border-b px-3 pt-[env(safe-area-inset-top)] sm:px-4">
        <div className="yn-topbar-row">
          <div className="yn-topbar-left">
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
                  size={46}
                  alt={profileName || "Your profile"}
                />
              </span>
            </button>
          </div>

          <div className="yn-topbar-brand">
            <YouNeonScriptLogo />
          </div>

          <div className="yn-topbar-actions">
            <button
              type="button"
              onClick={openPanel}
              className="yn-chrome-neon yn-topbar-icon-btn active:scale-95"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
            >
              <YouNeonBellIcon size={26} className="yn-chrome-icon" />
              {unread > 0 && (
                <span className="yn-chrome-count">{unread > 9 ? "9+" : unread}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setItemsOpen(true)}
              className="yn-chrome-neon yn-topbar-icon-btn yn-topbar-icon-btn--bag active:scale-95"
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
              <YouNeonBagIconNeon size={26} className="yn-chrome-icon" />
              {bagActive && (
                <span className="yn-chrome-count">{bagCount > 9 ? "9+" : bagCount}</span>
              )}
            </button>

            <button
              type="button"
              onClick={onNeonClick}
              className="yn-topbar-neon-chip"
              aria-label={`Open Neon shop, balance ${neonBalance.toLocaleString()}`}
              data-testid="topbar-neon-balance"
            >
              <span className="text-[13px] font-semibold leading-none">◆</span>
              <span className="yn-topbar-neon-chip-amt">
                Neon {neonBalance.toLocaleString()}
              </span>
              <ChevronRight size={14} strokeWidth={2.4} className="shrink-0 opacity-90" aria-hidden />
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
