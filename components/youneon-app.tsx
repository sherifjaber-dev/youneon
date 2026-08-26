"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { DiscoverScreen } from "@/components/discover-screen";
import { LoungeScreen } from "@/components/lounge-screen";
import { MessagesScreen } from "@/components/messages-screen";
import { HistoryScreen } from "@/components/history-screen";
import { ChatScreen } from "@/components/chat-screen";
import { BottomNav, type AppTab } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";
import { ProfileEditModal, type ProfileSavePayload } from "@/components/profile-edit-modal";
import { NeonShopModal } from "@/components/neon-shop-modal";
import {
  saveUserProfile,
  loadOrCreateUserProfile,
  persistUserNeonBalance,
  persistUserPremiumUntil,
  getOrCreateConversation,
  addToHistory,
  subscribeToUserProfile,
  conversationExists,
  unlockConversation,
  STARTING_NEON_BALANCE,
  type UserProfile as CloudUserProfile,
} from "@/lib/firestore-service";
import { formatCallDuration } from "@/lib/history-utils";
import { countryToIso } from "@/lib/countries";
import { piAuthService } from "@/lib/pi-auth-service";
import { VideoCallScreen } from "@/components/video-call-screen";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { useLanguage } from "@/contexts/language-context";
import {
  hideStaticLoginOverlays,
  isPiAuthOk,
  PI_AUTH_LOGOUT_EVENT,
  PI_AUTH_OK_EVENT,
  readLiteSession,
  showStaticLoginOverlays,
} from "@/lib/pi-client-session";
import {
  isPremiumActive,
  persistNeonBalance,
  persistPremiumUntil,
  PREMIUM_GRANTED_EVENT,
  readStoredNeonBalance,
  readStoredNeonBalanceIfSet,
  readStoredPremiumUntil,
  type PremiumGrantedDetail,
} from "@/lib/premium";
import {
  seedAnnouncementsIfEmpty,
  subscribeToAnnouncements,
  type Announcement,
} from "@/lib/announcements";
import { cacheSettingsFromProfile, ensureNeonId, readLocalItems, SETTINGS_CHANGED_EVENT, type TimedItem } from "@/lib/user-settings";
import { isLanguage } from "@/lib/i18n";
import { ensureCreatedAt, isAdultAge } from "@/lib/safety";
import {
  consumeChatUnlock,
  isPeerUnlocked,
  normalizeChatUnlocks,
  normalizeUnlockedChats,
  remainingFreeUnlocks,
  rememberUnlockedPeer,
  type ChatUnlocks,
} from "@/lib/chat-unlock";
import { ChatUnlockModal, type ChatUnlockTarget } from "@/components/chat-unlock-modal";
import { isRealPiUsername } from "@/lib/real-pi-user";

type VideoSession = {
  mode: "random" | "direct";
  filters?: { gender: "women" | "men" | "both"; country: string };
  roomKey?: string;
  partner?: {
    userId?: string;
    name: string;
    avatar?: string;
    countryFlag?: string;
  };
};

type YouNeonUser = {
  id: string;
  uid?: string;
  piUsername: string;
  fullName: string;
  age: number;
  country: string;
  location?: string;
  gender?: string;
  avatar: string;
  profilePicture: string;
  photos?: string[];
  languages: string[];
  interests: string[];
  bio?: string;
  premiumUntil?: string;
  reactionsReceived?: Record<string, number>;
  giftsReceivedCount?: number;
  nameChangeMonth?: string;
  nameChangeCount?: number;
};

function readLocalProfileExtras(forUsername?: string): Partial<YouNeonUser> {
  try {
    const stored = localStorage.getItem("youneon_user_profile");
    if (!stored) return {};
    const data = JSON.parse(stored);
    if (forUsername && data?.piUsername && data.piUsername !== forUsername) return {};
    const photos = Array.isArray(data?.photos) ? data.photos.filter(Boolean) : [];
    const photo = data?.profilePicture || photos[0] || "";
    return { ...data, photos, profilePicture: photo };
  } catch {
    return {};
  }
}

function cacheLocalUser(next: YouNeonUser) {
  try {
    localStorage.setItem("youneon_user", JSON.stringify(next));
    localStorage.setItem("youneon_user_profile", JSON.stringify(next));
  } catch {
    /* quota */
  }
}

function userFromRemote(
  remote: CloudUserProfile,
  uid: string,
  piUsername: string,
  extras: Partial<YouNeonUser>
): YouNeonUser {
  const remotePhotos = Array.isArray(remote.photos) ? remote.photos.filter(Boolean) : [];
  const extraPhotos = Array.isArray(extras.photos) ? extras.photos.filter(Boolean) : [];
  const photos = remotePhotos.length ? remotePhotos : extraPhotos;
  const picture = remote.profilePicture || photos[0] || extras.profilePicture || "";
  const place = remote.country || remote.location || extras.country || extras.location || "";
  const remoteLangs = Array.isArray(remote.languages) ? remote.languages : [];
  const remoteInterests = Array.isArray(remote.interests) ? remote.interests : [];
  return {
    id: remote.piUsername || piUsername,
    uid,
    piUsername,
    fullName: (remote.fullName && String(remote.fullName).trim()) || extras.fullName || piUsername,
    age: typeof remote.age === "number" && remote.age > 0 ? remote.age : extras.age || 0,
    country: place,
    location: remote.location || remote.country || extras.location || extras.country || place,
    gender: remote.gender || extras.gender || "",
    avatar: remote.avatar || extras.avatar || "🙂",
    profilePicture: picture,
    photos: photos.length ? photos : picture ? [picture] : [],
    languages: remoteLangs.length ? remoteLangs : extras.languages || [],
    interests: remoteInterests.length ? remoteInterests : extras.interests || [],
    bio: remote.bio || extras.bio || "",
    premiumUntil: remote.premiumUntil || extras.premiumUntil,
    reactionsReceived: remote.reactionsReceived || extras.reactionsReceived,
    giftsReceivedCount: remote.giftsReceivedCount ?? extras.giftsReceivedCount,
    nameChangeMonth: remote.nameChangeMonth || extras.nameChangeMonth,
    nameChangeCount: remote.nameChangeCount ?? extras.nameChangeCount,
  };
}

function stubUser(uid?: string, username?: string): YouNeonUser {
  const piUsername = username || uid || "";
  const extras = readLocalProfileExtras(piUsername);
  return {
    id: piUsername,
    uid: uid || piUsername,
    piUsername,
    fullName: extras.fullName || piUsername,
    age: extras.age || 0,
    country: extras.country || extras.location || "",
    location: extras.location || extras.country || "",
    gender: extras.gender || "",
    avatar: extras.avatar || "🙂",
    profilePicture: extras.profilePicture || "",
    photos: extras.photos || (extras.profilePicture ? [extras.profilePicture] : []),
    languages: extras.languages || [],
    reactionsReceived: extras.reactionsReceived,
    giftsReceivedCount: extras.giftsReceivedCount,
    nameChangeMonth: extras.nameChangeMonth,
    nameChangeCount: extras.nameChangeCount,
    interests: extras.interests || [],
    bio: extras.bio || "",
    premiumUntil: extras.premiumUntil,
  };
}

export function YouNeonApp() {
  const { user, isAuthenticated, sessionUnverified, logout } = usePiAuth();
  const { setLanguage } = useLanguage();
  const [bootAuthOk, setBootAuthOk] = useState(false);
  const [currentUser, setCurrentUser] = useState<YouNeonUser | null>(null);
  const [accountBanned, setAccountBanned] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("discover");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [videoSession, setVideoSession] = useState<VideoSession | null>(null);
  const [neonBalance, setNeonBalance] = useState(0);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showNeonShop, setShowNeonShop] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatUnlocks, setChatUnlocks] = useState<ChatUnlocks | null>(null);
  const [unlockedChats, setUnlockedChats] = useState<string[]>([]);
  const [timedItems, setTimedItems] = useState<TimedItem[]>([]);
  const [pendingChat, setPendingChat] = useState<any | null>(null);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const profileSavedAtRef = useRef(0);
  const unlockInFlightRef = useRef(false);
  const userIdRef = useRef("");

  const signedIn = isAuthenticated || bootAuthOk;
  const showApp = signedIn;
  userIdRef.current = currentUser?.piUsername || user?.username || "";

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (isPiAuthOk()) {
      hideStaticLoginOverlays();
      setBootAuthOk(true);
    }
  }, []);

  useEffect(() => {
    function syncFromBoot() {
      if (typeof window === "undefined") return false;
      if (isPiAuthOk()) {
        hideStaticLoginOverlays();
        setBootAuthOk(true);
        return true;
      }
      return false;
    }

    const onOk = () => {
      syncFromBoot();
    };
    const onLogout = () => {
      setBootAuthOk(false);
      setCurrentUser(null);
      showStaticLoginOverlays();
    };

    window.addEventListener(PI_AUTH_OK_EVENT, onOk);
    window.addEventListener(PI_AUTH_LOGOUT_EVENT, onLogout);
    const already = syncFromBoot();
    const poll = already
      ? null
      : window.setInterval(() => {
          if (syncFromBoot()) window.clearInterval(poll!);
        }, 200);

    return () => {
      window.removeEventListener(PI_AUTH_OK_EVENT, onOk);
      window.removeEventListener(PI_AUTH_LOGOUT_EVENT, onLogout);
      if (poll) window.clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    if (!showApp) return;
    hideStaticLoginOverlays();
  }, [showApp, isAuthenticated]);

  useEffect(() => {
    setNeonBalance(readStoredNeonBalance(0));
    const storedUntil = readStoredPremiumUntil();
    if (storedUntil) setPremiumUntil(storedUntil);
  }, []);

  useEffect(() => {
    const onGranted = (event: Event) => {
      const detail = (event as CustomEvent<PremiumGrantedDetail>).detail;
      if (!detail) return;
      if (detail.premiumUntil) setPremiumUntil(detail.premiumUntil);
      setNeonBalance(readStoredNeonBalance(0));
    };
    window.addEventListener(PREMIUM_GRANTED_EVENT, onGranted);
    return () => window.removeEventListener(PREMIUM_GRANTED_EVENT, onGranted);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;
    seedAnnouncementsIfEmpty()
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        unsub = subscribeToAnnouncements(setAnnouncements);
      });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  useEffect(() => {
    if (!signedIn) {
      setCurrentUser(null);
      setAccountBanned(false);
      return;
    }

    const lite = readLiteSession();
    const uid = user?.uid || lite?.uid || "";
    const piUsername = user?.username || lite?.username || uid;
    if (!isRealPiUsername(piUsername)) {
      setCurrentUser(null);
      return;
    }
    let cancelled = false;

    setCurrentUser((prev) => prev || stubUser(uid, piUsername));

    (async () => {
      const fetchStartedAt = Date.now();
      const extras = readLocalProfileExtras(piUsername);
      let profile: YouNeonUser = stubUser(uid, piUsername);

      try {
        const { profile: remote } = await loadOrCreateUserProfile(piUsername, uid);
        if (remote.banned) {
          if (!cancelled) setAccountBanned(true);
          return;
        }
        setAccountBanned(false);
        profile = userFromRemote(remote, uid, piUsername, extras);

        if (typeof remote.neonBalance === "number") {
          setNeonBalance(remote.neonBalance);
          persistNeonBalance(remote.neonBalance);
        } else {
          const localNeon = readStoredNeonBalanceIfSet();
          const grant = localNeon != null ? localNeon : STARTING_NEON_BALANCE;
          setNeonBalance(grant);
          persistNeonBalance(grant);
          void persistUserNeonBalance(piUsername, grant).catch(() => {});
        }

        if (remote.premiumUntil) {
          persistPremiumUntil(remote.premiumUntil);
          setPremiumUntil(remote.premiumUntil);
        } else {
          const localUntil = readStoredPremiumUntil();
          if (localUntil) {
            persistPremiumUntil(localUntil);
            setPremiumUntil(localUntil);
            void persistUserPremiumUntil(piUsername, localUntil).catch(() => {});
          }
        }

        cacheSettingsFromProfile({
          neonId: remote.neonId,
          hideGender: remote.hideGender,
          backgroundPlay: remote.backgroundPlay,
          notificationPrefs: remote.notificationPrefs,
          privacyConsent: remote.privacyConsent as {
            necessary?: true;
            analytics?: boolean;
            advertising?: boolean;
            marketing?: boolean;
          },
          items: remote.items as TimedItem[] | undefined,
          claimedPromoCodes: remote.claimedPromoCodes,
        });
        setChatUnlocks(normalizeChatUnlocks(remote.chatUnlocks));
        setUnlockedChats(normalizeUnlockedChats(remote.unlockedChats));
        setTimedItems(
          Array.isArray(remote.items)
            ? (remote.items.filter((item) => Date.parse(item.expiresAt) > Date.now()) as TimedItem[])
            : []
        );
        if (remote.locale && isLanguage(remote.locale)) {
          setLanguage(remote.locale);
        }
      } catch {
        /* keep stub; never write empty defaults over a returning user */
      }

      void ensureNeonId(piUsername);
      void ensureCreatedAt(piUsername);

      if (cancelled) return;
      setCurrentUser((prev) => {
        const next =
          prev && profileSavedAtRef.current >= fetchStartedAt
            ? {
                ...profile,
                fullName: prev.fullName,
                age: prev.age,
                country: prev.country,
                location: prev.location,
                gender: prev.gender,
                bio: prev.bio,
                interests: prev.interests,
                languages: prev.languages,
                profilePicture: prev.profilePicture,
                photos: prev.photos,
                nameChangeMonth: prev.nameChangeMonth,
                nameChangeCount: prev.nameChangeCount,
              }
            : profile;
        cacheLocalUser(next);
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [signedIn, user]);

  useEffect(() => {
    if (!signedIn) return;
    const lite = readLiteSession();
    const id = user?.username || lite?.username;
    if (!isRealPiUsername(id)) return;
    return subscribeToUserProfile(id, (remote) => {
      if (!remote) return;
      setChatUnlocks(normalizeChatUnlocks(remote.chatUnlocks));
      setUnlockedChats(normalizeUnlockedChats(remote.unlockedChats));
      if (Array.isArray(remote.items)) {
        setTimedItems(
          remote.items.filter((item) => Date.parse(item.expiresAt) > Date.now()) as TimedItem[]
        );
      }
      if (typeof remote.neonBalance === "number") {
        setNeonBalance(remote.neonBalance);
        persistNeonBalance(remote.neonBalance);
      }
      if (remote.premiumUntil) {
        persistPremiumUntil(remote.premiumUntil);
        setPremiumUntil(remote.premiumUntil);
      }
      cacheSettingsFromProfile({
        neonId: remote.neonId,
        hideGender: remote.hideGender,
        backgroundPlay: remote.backgroundPlay,
        notificationPrefs: remote.notificationPrefs,
        privacyConsent: remote.privacyConsent as {
          necessary?: true;
          analytics?: boolean;
          advertising?: boolean;
          marketing?: boolean;
        },
        items: remote.items as TimedItem[] | undefined,
        claimedPromoCodes: remote.claimedPromoCodes,
      });
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const recentlySaved = profileSavedAtRef.current > Date.now() - 2500;
        const hydrated = userFromRemote(remote, prev.uid || "", prev.piUsername, prev);
        return {
          ...(recentlySaved ? prev : hydrated),
          reactionsReceived: remote.reactionsReceived || prev.reactionsReceived,
          giftsReceivedCount:
            typeof remote.giftsReceivedCount === "number"
              ? remote.giftsReceivedCount
              : prev.giftsReceivedCount,
          premiumUntil: remote.premiumUntil || prev.premiumUntil,
        };
      });
    });
  }, [signedIn, user?.username]);

  useEffect(() => {
    const syncItems = () => setTimedItems(readLocalItems());
    window.addEventListener(SETTINGS_CHANGED_EVENT, syncItems);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, syncItems);
  }, []);

  const updateNeonBalance = (n: number) => {
    const next = Math.max(0, Math.floor(n));
    setNeonBalance(next);
    persistNeonBalance(next);
    const id = userIdRef.current;
    if (id) {
      void persistUserNeonBalance(id, next).catch((e) => console.warn("Neon sync failed", e));
    }
  };

  const handleProfileSaved = async (saved: ProfileSavePayload) => {
    if (!isAdultAge(saved.age)) {
      return;
    }
    const lite = readLiteSession();
    const base = currentUser || stubUser(user?.uid || lite?.uid, user?.username || lite?.username);
    const place = saved.country || saved.location || base.country || "";
    const merged: YouNeonUser = {
      ...base,
      fullName: saved.fullName || base.fullName,
      age: saved.age || base.age,
      country: place,
      location: place,
      gender: saved.gender || "",
      bio: saved.bio || "",
      interests: saved.interests || base.interests,
      languages: saved.languages?.length ? saved.languages : base.languages,
      profilePicture: saved.profilePicture || "",
      photos: Array.isArray(saved.photos) ? saved.photos : base.photos || [],
      nameChangeMonth: saved.nameChangeMonth || base.nameChangeMonth,
      nameChangeCount: saved.nameChangeCount ?? base.nameChangeCount,
      reactionsReceived: base.reactionsReceived,
      giftsReceivedCount: base.giftsReceivedCount,
    };

    profileSavedAtRef.current = Date.now();
    setCurrentUser(merged);

    try {
      cacheLocalUser(merged);
    } catch {
      /* quota */
    }

    try {
      piAuthService.saveProfile({
        piUsername: merged.piUsername,
        fullName: merged.fullName,
        age: merged.age,
        country: merged.country,
        location: merged.location,
        gender: merged.gender,
        languages: merged.languages,
        interests: merged.interests,
        profilePicture: merged.profilePicture,
        bio: merged.bio,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch {
      /* non-critical */
    }

    try {
      await saveUserProfile({
        piUsername: merged.piUsername,
        uid: merged.uid,
        fullName: merged.fullName,
        age: merged.age,
        country: merged.country,
        location: merged.location,
        gender: merged.gender,
        languages: merged.languages,
        interests: merged.interests,
        avatar: merged.avatar,
        profilePicture: merged.profilePicture,
        photos: merged.photos || [],
        bio: merged.bio,
        nameChangeMonth: merged.nameChangeMonth,
        nameChangeCount: merged.nameChangeCount,
      });
    } catch (e) {
      console.warn("Profile cloud save failed", e);
    }
  };

  const openChatWithUser = async (other: any) => {
    if (!currentUser) return;
    const meId = currentUser.id || currentUser.piUsername;
    try {
      const cid = await getOrCreateConversation(
        {
          id: meId,
          name: currentUser.fullName || "Me",
          avatar: currentUser.avatar || "🙂",
          photo: currentUser.profilePicture || "",
          flag: countryToIso(currentUser.country || currentUser.location),
        },
        {
          id: other.id,
          name: other.name,
          avatar: other.avatar || other.name || "🙂",
          photo: other.photo || "",
          flag: countryToIso(other.countryFlag || other.country),
        }
      );
      await unlockConversation(cid, meId).catch(() => {});
      setPendingChat(null);
      setActiveChat({ conversationId: cid, otherUser: other });
    } catch (e) {
      console.error(e);
      alert("Could not open chat.");
    }
  };

  const handleOpenChat = async (other: any) => {
    if (!currentUser) return;
    const meId = currentUser.id || currentUser.piUsername;
    const peerId = typeof other?.id === "string" ? other.id : "";
    if (!meId || !peerId || peerId === meId) return;
    if (unlockInFlightRef.current) return;

    if (isPeerUnlocked(unlockedChats, peerId)) {
      await openChatWithUser(other);
      return;
    }

    unlockInFlightRef.current = true;
    try {
      const exists = await conversationExists(meId, peerId);
      if (exists) {
        await rememberUnlockedPeer(meId, peerId).catch(() => {});
        setUnlockedChats((prev) => (prev.includes(peerId) ? prev : [...prev, peerId]));
        await openChatWithUser(other);
        return;
      }
    } catch (e) {
      console.warn("Could not check existing conversation", e);
    } finally {
      unlockInFlightRef.current = false;
    }

    setPendingChat(other);
  };

  const handleConfirmFreeMessage = async () => {
    if (!pendingChat || !currentUser || unlockBusy) return;
    const meId = currentUser.id || currentUser.piUsername;
    const peerId = String(pendingChat.id || "");
    if (!peerId) return;
    setUnlockBusy(true);
    try {
      const result = await consumeChatUnlock({
        username: meId,
        peerId,
        isPremium: isPremiumActive(premiumUntil || currentUser.premiumUntil),
        unlocks: chatUnlocks,
        items: timedItems,
      });
      if (!result.ok) {
        alert("No free messages left today.");
        return;
      }
      setChatUnlocks(result.unlocks);
      setTimedItems(result.items);
      setUnlockedChats((prev) => (prev.includes(peerId) ? prev : [...prev, peerId]));
      await openChatWithUser(pendingChat);
    } catch (e) {
      console.error(e);
      alert("Could not start chat. Please try again.");
    } finally {
      setUnlockBusy(false);
    }
  };

  const handleUnlockByPurchase = async () => {
    if (!pendingChat || !currentUser) return;
    const meId = currentUser.id || currentUser.piUsername;
    const peerId = String(pendingChat.id || "");
    if (!peerId) return;
    try {
      await rememberUnlockedPeer(meId, peerId);
      setUnlockedChats((prev) => (prev.includes(peerId) ? prev : [...prev, peerId]));
      await openChatWithUser(pendingChat);
    } catch (e) {
      console.error(e);
      alert("Purchase succeeded, but chat could not open. Try Messages again.");
    }
  };

  const handleEndVideoChat = async (info?: {
    partner: {
      userId?: string;
      name: string;
      avatar?: string;
      countryFlag?: string;
      country?: string;
      gender?: string;
    } | null;
    durationSeconds: number;
  }) => {
    const partner = info?.partner;
    const myId = currentUser?.id || currentUser?.piUsername;
    if (isRealPiUsername(myId) && partner?.name && partner.name !== "Partner") {
      const secs = Math.max(0, Math.floor(info?.durationSeconds || 0));
      try {
        await addToHistory(myId, {
          id: partner.userId || partner.name,
          name: partner.name,
          avatar: partner.avatar || "🙂",
          photo: partner.avatar || "",
          flag: partner.countryFlag,
          country: partner.country,
          gender: partner.gender,
          durationSeconds: secs,
          duration: formatCallDuration(secs) || "0s",
        });
      } catch (e) {
        console.warn("History save failed:", e);
      }
    }
    setVideoSession(null);
  };

  const lite = typeof window !== "undefined" ? readLiteSession() : null;
  const signedUsername = user?.username || lite?.username || user?.uid || lite?.uid || "";
  const displayUser =
    currentUser ||
    (isRealPiUsername(signedUsername) ? stubUser(user?.uid || lite?.uid, signedUsername) : null);

  if (!showApp || !displayUser) {
    return null;
  }

  if (accountBanned) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-yn-bg px-6 text-center">
        <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-yn-text">Account suspended</h1>
        <p className="mt-2 max-w-sm text-[15px] leading-6 text-yn-muted">
          This Pi account cannot use YouNeon. If you think this is a mistake, contact support from the Pi app listing.
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 h-12 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 px-6 text-[15px] font-semibold text-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  const currentUserId = displayUser.id || displayUser.piUsername;
  const hasOwnPhoto = !!(
    (displayUser.profilePicture && displayUser.profilePicture.length > 0) ||
    displayUser.photos?.[0]
  );
  const isPremium = isPremiumActive(premiumUntil || displayUser.premiumUntil);
  const freeUnlocksLeft = remainingFreeUnlocks({
    isPremium,
    unlocks: chatUnlocks,
    items: timedItems,
  });
  const unlockModalTarget: ChatUnlockTarget | null = pendingChat
    ? {
        id: String(pendingChat.id || ""),
        name: pendingChat.name || String(pendingChat.id || ""),
        avatar: pendingChat.avatar,
        photo: pendingChat.photo,
      }
    : null;

  if (activeChat && displayUser) {
    return (
      <>
        <ChatScreen
          conversationId={activeChat.conversationId}
          currentUserId={currentUserId}
          hasOwnPhoto={hasOwnPhoto}
          otherUser={activeChat.otherUser}
          onBack={() => setActiveChat(null)}
          onCall={() => {
            if (!isAdultAge(displayUser.age)) {
              window.alert("YouNeon is 18+. Add your age (18 or older) in your profile before calling.");
              return;
            }
            const chat = activeChat;
            setActiveChat(null);
            setVideoSession({
              mode: "direct",
              roomKey: chat?.conversationId,
              partner: chat?.otherUser
                ? {
                    userId: chat.otherUser.id,
                    name: chat.otherUser.name,
                    avatar: chat.otherUser.photo || chat.otherUser.avatar,
                    countryFlag: chat.otherUser.countryFlag,
                  }
                : undefined,
            });
          }}
          neonBalance={neonBalance}
          onUpdateBalance={updateNeonBalance}
          onOpenNeonShop={() => setShowNeonShop(true)}
          isPremium={isPremium}
        />
        <NeonShopModal
          isOpen={showNeonShop}
          onClose={() => setShowNeonShop(false)}
          isPremium={isPremium}
          premiumUntil={premiumUntil}
        />
      </>
    );
  }

  if (videoSession) {
    return (
      <VideoCallScreen
        onEnd={handleEndVideoChat}
        currentUserId={currentUserId}
        currentUserName={displayUser.fullName}
        currentUserProfile={{
          age: displayUser.age,
          country: displayUser.country || displayUser.location,
          gender: displayUser.gender,
          avatar: displayUser.profilePicture || displayUser.avatar,
          bio: displayUser.bio,
          interests: displayUser.interests,
        }}
        isPremium={isPremium}
        matchMode={videoSession.mode}
        filters={videoSession.filters}
        roomKey={videoSession.roomKey}
        partnerProfile={videoSession.partner}
      />
    );
  }

  return (
    <div className={`min-h-dvh ${activeTab === "discover" || activeTab === "lounge" || activeTab === "messages" || activeTab === "history" ? "bg-[#05050d] text-white" : "bg-yn-bg text-yn-text"}`}>
      {sessionUnverified && (
        <div className="fixed left-0 right-0 top-[calc(var(--yn-topbar-inner)+env(safe-area-inset-top))] z-40 bg-amber-100/95 px-3 py-1 text-center text-[11px] text-amber-950">
          Signed in. Pi account verification is still pending.
        </div>
      )}
      <TopBar
        onProfileClick={() => setShowProfileModal(true)}
        neonBalance={neonBalance}
        onNeonClick={() => setShowNeonShop(true)}
        isPremium={isPremium}
        premiumUntil={premiumUntil}
        announcements={announcements}
        profilePicture={displayUser.profilePicture}
        photos={displayUser.photos}
        profileName={displayUser.fullName || displayUser.piUsername}
        currentUserId={currentUserId}
        onOpenChat={handleOpenChat}
        onOpenMessages={() => setActiveTab("messages")}
        freeUnlocksRemaining={freeUnlocksLeft}
      />
      <div className={`fixed inset-x-0 top-[calc(var(--yn-topbar-inner)+env(safe-area-inset-top))] bottom-[calc(var(--yn-bottomnav-inner)+env(safe-area-inset-bottom))] ${activeTab === "discover" ? "overflow-hidden" : "overflow-y-auto"}`}>
        {activeTab === "discover" && (
          <div className="h-full">
            <DiscoverScreen
              onStartVideo={(filters) => {
                if (!isAdultAge(displayUser.age)) {
                  window.alert("YouNeon is 18+. Add your age (18 or older) in your profile before matching.");
                  return;
                }
                setVideoSession({ mode: "random", filters });
              }}
              neonBalance={neonBalance}
              onUpdateBalance={updateNeonBalance}
              currentUserId={currentUserId}
              onOpenNeonShop={() => setShowNeonShop(true)}
              isPremium={isPremium}
              announcements={announcements}
            />
          </div>
        )}
        {activeTab === "lounge" && (
          <LoungeScreen
            currentUserId={currentUserId}
            currentUser={{
              id: currentUserId,
              name: displayUser.fullName,
              photo: displayUser.profilePicture,
              country: displayUser.country || displayUser.location,
              age: displayUser.age,
              gender: displayUser.gender,
              languages: displayUser.languages,
            }}
            onOpenChat={handleOpenChat}
          />
        )}
        {activeTab === "messages" && (
          <MessagesScreen
            currentUserId={currentUserId}
            hasOwnPhoto={hasOwnPhoto}
            currentUser={{
              id: currentUserId,
              name: displayUser.fullName,
              avatar: displayUser.avatar,
              photo: displayUser.profilePicture,
              country: displayUser.country || displayUser.location,
              age: displayUser.age,
            }}
            onOpenChat={handleOpenChat}
          />
        )}
        {activeTab === "history" && (
          <HistoryScreen
            currentUserId={currentUserId}
            hasOwnPhoto={hasOwnPhoto}
            currentUser={{
              id: currentUserId,
              name: displayUser.fullName,
              photo: displayUser.profilePicture,
              country: displayUser.country || displayUser.location,
              age: displayUser.age,
            }}
            onOpenChat={handleOpenChat}
          />
        )}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={handleProfileSaved}
        currentUser={displayUser}
        isPremium={isPremium}
        premiumUntil={premiumUntil}
        neonBalance={neonBalance}
        announcements={announcements}
        currentUsername={displayUser.piUsername}
        onOpenShop={() => {
          setShowProfileModal(false);
          setShowNeonShop(true);
        }}
      />
      <NeonShopModal
        isOpen={showNeonShop}
        onClose={() => setShowNeonShop(false)}
        isPremium={isPremium}
        premiumUntil={premiumUntil}
      />
      <ChatUnlockModal
        open={!!pendingChat}
        remaining={freeUnlocksLeft}
        target={unlockModalTarget}
        isPremium={isPremium}
        premiumUntil={premiumUntil}
        confirming={unlockBusy}
        onClose={() => {
          if (!unlockBusy) setPendingChat(null);
        }}
        onUseFreeMessage={() => void handleConfirmFreeMessage()}
        onUnlockedByPurchase={() => void handleUnlockByPurchase()}
      />
    </div>
  );
}
