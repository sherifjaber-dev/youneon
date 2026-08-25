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
import { saveUserProfile, getUserProfile, getOrCreateConversation, addToHistory, subscribeToUserProfile } from "@/lib/firestore-service";
import { formatCallDuration } from "@/lib/history-utils";
import { countryToFlag } from "@/lib/countries";
import { piAuthService } from "@/lib/pi-auth-service";
import { VideoCallScreen } from "@/components/video-call-screen";
import { usePiAuth } from "@/contexts/pi-auth-context";
import {
  hideStaticLoginOverlays,
  PI_AUTH_LOGOUT_EVENT,
  PI_AUTH_OK_EVENT,
  readLiteSession,
} from "@/lib/pi-client-session";
import {
  isPremiumActive,
  persistPremiumUntil,
  PREMIUM_GRANTED_EVENT,
  readStoredNeonBalance,
  readStoredPremiumUntil,
  type PremiumGrantedDetail,
} from "@/lib/premium";
import {
  seedAnnouncementsIfEmpty,
  subscribeToAnnouncements,
  type Announcement,
} from "@/lib/announcements";

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

function readLocalProfileExtras(): Partial<YouNeonUser> {
  try {
    const stored = localStorage.getItem("youneon_user_profile");
    if (!stored) return {};
    const data = JSON.parse(stored);
    const photos = Array.isArray(data?.photos) ? data.photos.filter(Boolean) : [];
    const photo = data?.profilePicture || photos[0] || "";
    return { ...data, photos, profilePicture: photo };
  } catch {
    return {};
  }
}

function stubUser(uid?: string, username?: string): YouNeonUser {
  const piUsername = username || uid || "pi_user";
  const extras = readLocalProfileExtras();
  return {
    id: piUsername,
    uid: uid || piUsername,
    piUsername,
    fullName: extras.fullName || piUsername,
    age: extras.age || 18,
    country: extras.country || extras.location || "",
    location: extras.location || extras.country || "",
    gender: extras.gender || "",
    avatar: extras.avatar || "🙂",
    profilePicture: extras.profilePicture || "",
    photos: extras.photos || (extras.profilePicture ? [extras.profilePicture] : []),
    languages: extras.languages || ["English"],
    reactionsReceived: extras.reactionsReceived,
    giftsReceivedCount: extras.giftsReceivedCount,
    nameChangeMonth: extras.nameChangeMonth,
    nameChangeCount: extras.nameChangeCount,
    interests: extras.interests || [],
    bio: extras.bio || "",
  };
}

export function YouNeonApp() {
  const { user, isAuthenticated, sessionUnverified } = usePiAuth();
  const isGuestDemo = false;
  const [bootAuthOk, setBootAuthOk] = useState(false);
  const [currentUser, setCurrentUser] = useState<YouNeonUser | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("discover");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [videoSession, setVideoSession] = useState<VideoSession | null>(null);
  const [neonBalance, setNeonBalance] = useState(100);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showNeonShop, setShowNeonShop] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);
  const profileSavedAtRef = useRef(0);

  const signedIn = isAuthenticated || bootAuthOk;
  const showApp = signedIn || (isGuestDemo && !!currentUser);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__PI_AUTH_OK || readLiteSession()) {
      hideStaticLoginOverlays();
      setBootAuthOk(true);
    }
  }, []);

  useEffect(() => {
    function syncFromBoot() {
      if (typeof window === "undefined") return false;
      if (window.__PI_AUTH_OK || readLiteSession()) {
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
    setNeonBalance(readStoredNeonBalance(100));
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
    if (isGuestDemo) {
      setCurrentUser({
        id: "guest_demo",
        piUsername: "guest_demo",
        fullName: "Guest (demo)",
        age: 18,
        country: "",
        location: "",
        gender: "",
        avatar: "🙂",
        profilePicture: "",
        languages: ["English"],
        interests: [],
        bio: "",
      });
      return;
    }

    if (!signedIn) {
      setCurrentUser(null);
      return;
    }

    const lite = readLiteSession();
    const uid = user?.uid || lite?.uid || "pi_user";
    const piUsername = user?.username || lite?.username || uid;
    let cancelled = false;

    setCurrentUser((prev) => prev || stubUser(uid, piUsername));

    (async () => {
      const fetchStartedAt = Date.now();
      const extras = readLocalProfileExtras();
      let profile: YouNeonUser = {
        id: piUsername,
        uid,
        piUsername,
        fullName: extras.fullName || piUsername,
        age: extras.age || 18,
        country: extras.country || extras.location || "",
        location: extras.location || extras.country || "",
        gender: extras.gender || "",
        avatar: extras.avatar || "🙂",
        profilePicture: extras.profilePicture || "",
        photos: extras.photos || (extras.profilePicture ? [extras.profilePicture] : []),
        languages: extras.languages || ["English"],
        interests: extras.interests || [],
        bio: extras.bio || "",
        reactionsReceived: extras.reactionsReceived,
        giftsReceivedCount: extras.giftsReceivedCount,
        nameChangeMonth: extras.nameChangeMonth,
        nameChangeCount: extras.nameChangeCount,
      };

      try {
        const remote = await getUserProfile(piUsername);
        if (remote) {
          profile = {
            ...profile,
            ...remote,
            id: remote.piUsername || piUsername,
            uid,
            piUsername,
            profilePicture: remote.profilePicture || extras.profilePicture || "",
            photos: Array.isArray(remote.photos) && remote.photos.length
              ? remote.photos
              : extras.photos || (remote.profilePicture ? [remote.profilePicture] : extras.profilePicture ? [extras.profilePicture] : []),
            bio: remote.bio || extras.bio || "",
            country: remote.country || remote.location || extras.country || extras.location || "",
            location: remote.location || remote.country || extras.location || extras.country || "",
            gender: remote.gender || extras.gender || "",
            premiumUntil: remote.premiumUntil || extras.premiumUntil || readStoredPremiumUntil() || undefined,
            reactionsReceived: remote.reactionsReceived || extras.reactionsReceived,
            giftsReceivedCount: remote.giftsReceivedCount ?? extras.giftsReceivedCount,
            nameChangeMonth: remote.nameChangeMonth || extras.nameChangeMonth,
            nameChangeCount: remote.nameChangeCount ?? extras.nameChangeCount,
          };
          if (remote.premiumUntil) {
            persistPremiumUntil(remote.premiumUntil);
            setPremiumUntil(remote.premiumUntil);
          }
          if (typeof remote.neonBalance === "number" && remote.neonBalance > readStoredNeonBalance(0)) {
            setNeonBalance(remote.neonBalance);
            localStorage.setItem("youneon_neon_balance", String(remote.neonBalance));
          }
        }
      } catch {
        /* keep local/verified identity */
      }

      if (profileSavedAtRef.current < fetchStartedAt) {
        try {
          await saveUserProfile(profile);
        } catch (e) {
          console.warn("Profile sync failed", e);
        }
      }

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
        try {
          localStorage.setItem("youneon_user", JSON.stringify(next));
        } catch {
          /* quota */
        }
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [signedIn, isGuestDemo, user]);

  useEffect(() => {
    if (isGuestDemo || !signedIn) return;
    const lite = readLiteSession();
    const id = user?.username || lite?.username;
    if (!id) return;
    return subscribeToUserProfile(id, (remote) => {
      if (!remote) return;
      setCurrentUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reactionsReceived: remote.reactionsReceived || prev.reactionsReceived,
          giftsReceivedCount:
            typeof remote.giftsReceivedCount === "number"
              ? remote.giftsReceivedCount
              : prev.giftsReceivedCount,
        };
      });
    });
  }, [signedIn, isGuestDemo, user?.username]);

  const updateNeonBalance = (n: number) => {
    setNeonBalance(n);
    localStorage.setItem("youneon_neon_balance", n.toString());
  };

  const handleProfileSaved = async (saved: ProfileSavePayload) => {
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
      localStorage.setItem("youneon_user", JSON.stringify(merged));
      localStorage.setItem("youneon_user_profile", JSON.stringify(merged));
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

    if (!isGuestDemo) {
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
    }
  };

  const handleOpenChat = async (other: any) => {
    if (!currentUser) return;
    try {
      const cid = await getOrCreateConversation(
        {
          id: currentUser.id || currentUser.piUsername,
          name: currentUser.fullName || "Me",
          avatar: currentUser.avatar || "🙂",
          photo: currentUser.profilePicture || "",
          flag: countryToFlag(currentUser.country || currentUser.location),
        },
        {
          id: other.id,
          name: other.name,
          avatar: other.avatar || other.name || "🙂",
          photo: other.photo || "",
          flag: other.countryFlag || countryToFlag(other.country),
        }
      );
      setActiveChat({ conversationId: cid, otherUser: other });
    } catch (e) {
      console.error(e);
      alert("Could not open chat.");
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
    if (myId && !isGuestDemo && partner?.name && partner.name !== "Partner") {
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
  const displayUser =
    currentUser ||
    stubUser(user?.uid || lite?.uid, user?.username || lite?.username);

  if (!showApp) {
    return null;
  }

  const currentUserId = displayUser.id || displayUser.piUsername;
  const hasOwnPhoto = !!(
    (displayUser.profilePicture && displayUser.profilePicture.length > 0) ||
    displayUser.photos?.[0]
  );
  const isPremium = isPremiumActive(premiumUntil || displayUser.premiumUntil);

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
    <div className="min-h-dvh bg-[#0f0117]">
      {sessionUnverified && (
        <div className="fixed left-0 right-0 top-[calc(48px+env(safe-area-inset-top))] z-40 bg-amber-100/95 px-3 py-1 text-center text-[11px] text-amber-950">
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
        profileName={displayUser.fullName || displayUser.piUsername}
        currentUserId={currentUserId}
        onOpenChat={handleOpenChat}
        onOpenMessages={() => setActiveTab("messages")}
      />
      <div className={`fixed inset-x-0 top-[calc(48px+env(safe-area-inset-top))] bottom-[calc(56px+env(safe-area-inset-bottom))] ${activeTab === "discover" ? "overflow-hidden" : "overflow-y-auto"}`}>
        {activeTab === "discover" && (
          <div className="h-full">
            <DiscoverScreen
              onStartVideo={(filters) => setVideoSession({ mode: "random", filters })}
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
    </div>
  );
}
