"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  markAnnouncementsRead,
  readAnnouncementIds,
  unreadAnnouncementCount,
  type Announcement,
} from "@/lib/announcements";
import { subscribeToConversations } from "@/lib/firestore-service";
import {
  announcementsToInbox,
  conversationsToInbox,
  localGiftsToInbox,
  markNotificationsRead,
  mergeInbox,
  readNotificationIds,
  socialToInbox,
  subscribeToFollowInbox,
  subscribeToUserNotifications,
  unreadInboxCount,
  filterInboxByPrefs,
  type InboxItem,
  type UserNotification,
} from "@/lib/notifications";
import { useNotificationPrefsLive } from "@/hooks/use-user-settings";

export function useNotificationInbox(userId: string | undefined, announcements: Announcement[]) {
  const prefs = useNotificationPrefsLive();
  const [social, setSocial] = useState<UserNotification[]>([]);
  const [follows, setFollows] = useState<InboxItem[]>([]);
  const [convs, setConvs] = useState<Array<Record<string, unknown>>>([]);
  const [readTick, setReadTick] = useState(0);
  const itemsRef = useRef<InboxItem[]>([]);
  const announcementsRef = useRef(announcements);
  announcementsRef.current = announcements;

  useEffect(() => {
    if (!userId) {
      setSocial([]);
      return;
    }
    return subscribeToUserNotifications(userId, setSocial);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setFollows([]);
      return;
    }
    return subscribeToFollowInbox(userId, setFollows);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setConvs([]);
      return;
    }
    return subscribeToConversations(userId, (rows) => {
      setConvs(rows as Array<Record<string, unknown>>);
    });
  }, [userId]);

  const items = useMemo(() => {
    const notifRead = new Set(readNotificationIds());
    const annRead = new Set(readAnnouncementIds());
    const written = social.map((row) => socialToInbox(row, notifRead));
    const fromConvs = userId ? conversationsToInbox(userId, convs, notifRead) : [];
    const gifts = userId && !social.some((row) => row.type === "gift")
      ? localGiftsToInbox(userId, notifRead)
      : [];
    const anns = announcementsToInbox(announcements, annRead);
    void readTick;
    return filterInboxByPrefs(mergeInbox([written, follows, fromConvs, gifts, anns]), prefs);
  }, [social, follows, convs, announcements, userId, readTick, prefs]);

  itemsRef.current = items;

  const unread = useMemo(() => {
    void readTick;
    const merged = unreadInboxCount(items);
    const leftoverAnnouncements = unreadAnnouncementCount(announcements);
    return Math.max(merged, leftoverAnnouncements);
  }, [items, announcements, readTick]);

  const markAllRead = useCallback(() => {
    const announcementIds = announcementsRef.current
      .filter((item) => item.active)
      .map((item) => item.id);
    const itemIds = itemsRef.current.map((item) => item.id);
    const alreadyNotifs = new Set(readNotificationIds());
    const alreadyAnns = new Set(readAnnouncementIds());
    const newNotifs = itemIds.filter((id) => !alreadyNotifs.has(id));
    const newAnns = announcementIds.filter((id) => !alreadyAnns.has(id));
    if (newNotifs.length === 0 && newAnns.length === 0) return;
    markAnnouncementsRead(announcementIds);
    markNotificationsRead(itemIds);
    setReadTick((n) => n + 1);
  }, []);

  return { items, unread, markAllRead };
}
