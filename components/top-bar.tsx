"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { NotificationsScreen } from "@/components/notifications-screen";
import { MyItemsSheet } from "@/components/my-items-sheet";
import { YouNeonBagIcon } from "@/components/icons/youneon-chat-connect";
import { YouNeonScriptLogo } from "@/components/youneon-script-logo";
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

  const openPanel = () => {
    setPanelOpen(true);
    markAllRead();
  };

  return (
    <>
      <div className="yn-chrome fixed top-0 left-0 right-0 z-50 border-b px-4 pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center justify-between gap-3">
          <YouNeonScriptLogo onClick={onProfileClick} />

          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={openPanel}
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-[#e5e7eb] transition-colors hover:text-white active:scale-95"
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
              >
                <Bell size={18} strokeWidth={1.7} />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ff4ec8] shadow-[0_0_8px_#ff4ec8]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setItemsOpen(true)}
                className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors active:scale-95 ${
                  bagActive ? "text-[#60a5fa]" : "text-[#e5e7eb] hover:text-white"
                }`}
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
                <YouNeonBagIcon size={18} />
                {bagActive && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3b82ff] px-1 text-[9px] font-bold leading-none text-white">
                    {bagCount > 9 ? "9+" : bagCount}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={onNeonClick}
              className="flex items-center gap-1 pr-0.5 text-[#f5d76e] transition-opacity active:scale-95"
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
