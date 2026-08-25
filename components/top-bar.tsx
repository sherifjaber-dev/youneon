"use client";

import { useState } from "react";
import { Bell, Crown } from "lucide-react";
import { NotificationsScreen } from "@/components/notifications-screen";
import { MyItemsSheet } from "@/components/my-items-sheet";
import { NeonAvatar } from "@/components/neon-avatar";
import { YouNeonBagIcon } from "@/components/icons/youneon-chat-connect";
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
  profilePicture = "",
  profileName = "",
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
      <div className="yn-glass fixed top-0 left-0 right-0 z-50 border-b border-black/6 px-4 pt-[env(safe-area-inset-top)]">
        <div className="flex h-12 items-center justify-between gap-2">
          <button
            onClick={onProfileClick}
            className="relative h-8 w-8 shrink-0 overflow-visible rounded-full transition-transform active:scale-95"
            aria-label="Open profile"
          >
            <NeonAvatar src={profilePicture} name={profileName} size={32} showPhoto />
            {isPremium && (
              <span className="absolute -bottom-0.5 -right-0.5 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-yn-nav bg-gradient-to-br from-amber-400 to-pink-500">
                <Crown size={8} className="text-white" />
              </span>
            )}
          </button>

          <span className="min-w-0 truncate bg-gradient-to-r from-fuchsia-600 to-pink-500 bg-clip-text text-[15px] font-semibold tracking-tight text-transparent">
            YouNeon
          </span>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={openPanel}
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-black/8 bg-white text-yn-muted shadow-sm transition-colors hover:text-yn-text active:scale-95"
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
              type="button"
              onClick={() => setItemsOpen(true)}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full border transition-colors active:scale-95 ${
                bagActive
                  ? "border-sky-400/40 bg-sky-500/15 text-sky-500"
                  : "border-black/8 bg-white text-yn-muted/50 shadow-sm"
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
              <YouNeonBagIcon size={16} />
              {bagActive && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-bold leading-none text-white">
                  {bagCount > 9 ? "9+" : bagCount}
                </span>
              )}
            </button>

            <button
              onClick={onNeonClick}
              className="flex h-8 items-center gap-1.5 rounded-full border border-amber-200/80 bg-white px-2.5 shadow-sm transition-colors active:scale-95"
              aria-label="Open Neon shop"
            >
              <span className="text-[13px] text-amber-500">◆</span>
              <span className="text-[13px] font-semibold tabular-nums text-amber-600">{neonBalance}</span>
              <span className="text-[11px] font-medium text-amber-600/80">Neon</span>
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
