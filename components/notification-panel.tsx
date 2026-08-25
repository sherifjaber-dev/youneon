"use client";

import { NotificationsScreen } from "@/components/notifications-screen";
import { useNotificationInbox } from "@/hooks/use-notification-inbox";
import type { Announcement } from "@/lib/announcements";

type NotificationPanelProps = {
  open: boolean;
  onClose: () => void;
  announcements: Announcement[];
};

/** @deprecated Use NotificationsScreen. Kept so existing bell imports keep working. */
export function NotificationPanel({ open, onClose, announcements }: NotificationPanelProps) {
  const { items, markAllRead } = useNotificationInbox(undefined, announcements);
  return (
    <NotificationsScreen
      open={open}
      onClose={onClose}
      announcements={announcements}
      items={items}
      markAllRead={markAllRead}
    />
  );
}
