"use client";

import { useCallback, useEffect, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/firestore-service";
import {
  cacheSettingsFromProfile,
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_PRIVACY_CONSENT,
  ensureNeonId,
  loadBlockedPeople,
  mergedBlockedIds,
  normalizeNotificationPrefs,
  normalizePrivacyConsent,
  readLocalBackgroundPlay,
  readLocalHideGender,
  readLocalItems,
  readLocalNeonId,
  readLocalNotificationPrefs,
  readLocalPrivacyConsent,
  SETTINGS_CHANGED_EVENT,
  type BlockedPerson,
  type NotificationPrefs,
  type PrivacyConsent,
  type TimedItem,
} from "@/lib/user-settings";

export function useUserSettings(username?: string) {
  const [neonId, setNeonId] = useState(readLocalNeonId);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(readLocalNotificationPrefs);
  const [privacyConsent, setPrivacyConsent] = useState<PrivacyConsent>(readLocalPrivacyConsent);
  const [hideGender, setHideGender] = useState(readLocalHideGender);
  const [backgroundPlay, setBackgroundPlay] = useState(readLocalBackgroundPlay);
  const [items, setItems] = useState<TimedItem[]>(readLocalItems);
  const [claimedPromoCodes, setClaimedPromoCodes] = useState<string[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [blockedPeople, setBlockedPeople] = useState<BlockedPerson[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshLocal = useCallback(() => {
    setNotificationPrefs(readLocalNotificationPrefs());
    setPrivacyConsent(readLocalPrivacyConsent());
    setHideGender(readLocalHideGender());
    setBackgroundPlay(readLocalBackgroundPlay());
    setItems(readLocalItems());
    setNeonId(readLocalNeonId());
  }, []);

  useEffect(() => {
    const onChange = () => refreshLocal();
    window.addEventListener(SETTINGS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, onChange);
  }, [refreshLocal]);

  useEffect(() => {
    if (!username || username === "anon") return;
    const unsub = onSnapshot(
      doc(db, "users", username),
      (snap) => {
        if (!snap.exists()) return;
        const data = { id: snap.id, ...snap.data() } as UserProfile;
        setProfile(data);
        cacheSettingsFromProfile({
          neonId: data.neonId,
          hideGender: data.hideGender,
          backgroundPlay: data.backgroundPlay,
          notificationPrefs: data.notificationPrefs,
          privacyConsent: data.privacyConsent,
          items: data.items as TimedItem[] | undefined,
          claimedPromoCodes: data.claimedPromoCodes,
        });
        setNotificationPrefs(normalizeNotificationPrefs(data.notificationPrefs));
        setPrivacyConsent(normalizePrivacyConsent(data.privacyConsent));
        setHideGender(!!data.hideGender);
        setBackgroundPlay(!!data.backgroundPlay);
        setItems((data.items || []).filter((item) => Date.parse(item.expiresAt) > Date.now()) as TimedItem[]);
        setClaimedPromoCodes(data.claimedPromoCodes || []);
        const ids = mergedBlockedIds(username, data.blockedUsers);
        setBlockedIds(ids);
        void loadBlockedPeople(username, data.blockedUsers, data.blockedUserMeta).then(setBlockedPeople);
        if (data.neonId) setNeonId(data.neonId);
      },
      () => {}
    );
    void ensureNeonId(username).then(setNeonId);
    return () => unsub();
  }, [username]);

  return {
    profile,
    neonId,
    notificationPrefs,
    privacyConsent,
    hideGender,
    backgroundPlay,
    items,
    claimedPromoCodes,
    blockedIds,
    blockedPeople,
    refreshLocal,
  };
}

export function useBlockedIds(username?: string): Set<string> {
  const [ids, setIds] = useState<Set<string>>(() => new Set(mergedBlockedIds(username || "", null)));

  useEffect(() => {
    if (!username) {
      setIds(new Set());
      return;
    }
    setIds(new Set(mergedBlockedIds(username, null)));
    const unsub = onSnapshot(
      doc(db, "users", username),
      (snap) => {
        const remote = snap.exists() ? (snap.data()?.blockedUsers as string[] | undefined) : [];
        setIds(new Set(mergedBlockedIds(username, remote)));
      },
      () => setIds(new Set(mergedBlockedIds(username, null)))
    );
    const onChange = () => {
      setIds((prev) => new Set([...prev, ...mergedBlockedIds(username, null)]));
    };
    window.addEventListener(SETTINGS_CHANGED_EVENT, onChange);
    return () => {
      unsub();
      window.removeEventListener(SETTINGS_CHANGED_EVENT, onChange);
    };
  }, [username]);

  return ids;
}

export function useNotificationPrefsLive(): NotificationPrefs {
  const [prefs, setPrefs] = useState<NotificationPrefs>(readLocalNotificationPrefs);
  useEffect(() => {
    const sync = () => setPrefs(readLocalNotificationPrefs());
    window.addEventListener(SETTINGS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, sync);
  }, []);
  return prefs;
}

export function usePrivacyConsentLive(): PrivacyConsent {
  const [consent, setConsent] = useState<PrivacyConsent>(readLocalPrivacyConsent);
  useEffect(() => {
    const sync = () => setConsent(readLocalPrivacyConsent());
    window.addEventListener(SETTINGS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, sync);
  }, []);
  return consent;
}
