"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { DiscoverScreen } from "@/components/discover-screen";
import { MessagesScreen } from "@/components/messages-screen";
import { HistoryScreen } from "@/components/history-screen";
import { ChatScreen } from "@/components/chat-screen";
import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";
import { ProfileEditModal } from "@/components/profile-edit-modal";
import { NeonShopModal } from "@/components/neon-shop-modal";
import { saveUserProfile, getUserProfile, getOrCreateConversation, addToHistory } from "@/lib/firestore-service";
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

const MOCK_MATCHES = [
  { id: "sofia", name: "Sofia", avatar: "👩‍🦰", flag: "🇮🇹" },
  { id: "marcus", name: "Marcus", avatar: "👨‍🎤", flag: "🇸🇪" },
  { id: "emma", name: "Emma", avatar: "👩‍💻", flag: "🇩🇪" },
  { id: "lucas", name: "Lucas", avatar: "👨‍🎓", flag: "🇲🇽" },
  { id: "ava", name: "Ava", avatar: "👩‍🎨", flag: "🇫🇷" },
  { id: "james", name: "James", avatar: "👨‍💼", flag: "🇬🇧" },
];

type YouNeonUser = {
  id: string;
  uid?: string;
  piUsername: string;
  fullName: string;
  age: number;
  country: string;
  avatar: string;
  profilePicture: string;
  languages: string[];
  interests: string[];
  premiumUntil?: string;
};

function readLocalProfileExtras(): Partial<YouNeonUser> {
  try {
    const stored = localStorage.getItem("youneon_user_profile");
    if (!stored) return {};
    const data = JSON.parse(stored);
    const photo = data?.profilePicture || data?.photos?.[data?.mainPhotoIndex || 0] || "";
    return { ...data, profilePicture: photo };
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
    country: extras.country || "",
    avatar: extras.avatar || "🙂",
    profilePicture: extras.profilePicture || "",
    languages: extras.languages || ["English"],
    interests: extras.interests || [],
  };
}

export function YouNeonApp() {
  const { user, isAuthenticated, sessionUnverified } = usePiAuth();
  const isGuestDemo = false;
  const [bootAuthOk, setBootAuthOk] = useState(false);
  const [currentUser, setCurrentUser] = useState<YouNeonUser | null>(null);
  const [activeTab, setActiveTab] = useState<"discover" | "messages" | "history">("discover");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isInVideoChat, setIsInVideoChat] = useState(false);
  const [neonBalance, setNeonBalance] = useState(100);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showNeonShop, setShowNeonShop] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);

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
        avatar: "🙂",
        profilePicture: "",
        languages: ["English"],
        interests: [],
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
      const extras = readLocalProfileExtras();
      let profile: YouNeonUser = {
        id: piUsername,
        uid,
        piUsername,
        fullName: extras.fullName || piUsername,
        age: extras.age || 18,
        country: extras.country || "",
        avatar: extras.avatar || "🙂",
        profilePicture: extras.profilePicture || "",
        languages: extras.languages || ["English"],
        interests: extras.interests || [],
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
            premiumUntil: remote.premiumUntil || extras.premiumUntil || readStoredPremiumUntil() || undefined,
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

      try {
        await saveUserProfile(profile);
      } catch (e) {
        console.warn("Profile sync failed", e);
      }

      if (cancelled) return;
      setCurrentUser(profile);
      localStorage.setItem("youneon_user", JSON.stringify(profile));
    })();

    return () => {
      cancelled = true;
    };
  }, [signedIn, isGuestDemo, user]);

  const updateNeonBalance = (n: number) => {
    setNeonBalance(n);
    localStorage.setItem("youneon_neon_balance", n.toString());
  };

  const refreshProfilePhoto = () => {
    try {
      const stored = localStorage.getItem("youneon_user_profile");
      if (!stored || !currentUser) return;
      const data = JSON.parse(stored);
      const photo = data?.profilePicture || data?.photos?.[data?.mainPhotoIndex || 0] || "";
      const merged = { ...currentUser, ...data, profilePicture: photo };
      setCurrentUser(merged);
      localStorage.setItem("youneon_user", JSON.stringify(merged));
      if (!isGuestDemo) {
        saveUserProfile(merged).catch(() => {});
      }
    } catch {
      /* silent */
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
        },
        {
          id: other.id,
          name: other.name,
          avatar: other.avatar,
          photo: other.photo || "",
          flag: other.countryFlag,
        }
      );
      setActiveChat({ conversationId: cid, otherUser: other });
    } catch (e) {
      console.error(e);
      alert("Could not open chat.");
    }
  };

  const handleEndVideoChat = async () => {
    const match = MOCK_MATCHES[Math.floor(Math.random() * MOCK_MATCHES.length)];
    const myId = currentUser?.id || currentUser?.piUsername;
    if (myId && !isGuestDemo) {
      try {
        await addToHistory(myId, { ...match, duration: `${Math.floor(Math.random() * 20 + 5)} min chat` });
      } catch (e) {
        console.warn("History save failed:", e);
      }
    }
    setIsInVideoChat(false);
  };

  const lite = typeof window !== "undefined" ? readLiteSession() : null;
  const displayUser =
    currentUser ||
    stubUser(user?.uid || lite?.uid, user?.username || lite?.username);

  if (!showApp) {
    return null;
  }

  const currentUserId = displayUser.id || displayUser.piUsername;
  const hasOwnPhoto = !!(displayUser.profilePicture && displayUser.profilePicture.length > 0);
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
            setActiveChat(null);
            setIsInVideoChat(true);
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

  if (isInVideoChat) {
    return (
      <VideoCallScreen
        onEnd={handleEndVideoChat}
        currentUserId={currentUserId}
        currentUserName={displayUser.fullName}
        isPremium={isPremium}
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
        announcements={announcements}
      />
      <div className={`fixed inset-x-0 top-[calc(48px+env(safe-area-inset-top))] bottom-[calc(56px+env(safe-area-inset-bottom))] ${activeTab === "discover" ? "overflow-hidden" : "overflow-y-auto"}`}>
        {activeTab === "discover" && (
          <div className="h-full">
            <DiscoverScreen
              onStartVideo={() => setIsInVideoChat(true)}
              neonBalance={neonBalance}
              onUpdateBalance={updateNeonBalance}
              currentUserId={currentUserId}
              onOpenNeonShop={() => setShowNeonShop(true)}
              isPremium={isPremium}
              announcements={announcements}
            />
          </div>
        )}
        {activeTab === "messages" && (
          <MessagesScreen
            currentUserId={currentUserId}
            hasOwnPhoto={hasOwnPhoto}
            onOpenChat={handleOpenChat}
          />
        )}
        {activeTab === "history" && (
          <HistoryScreen currentUserId={currentUserId} onOpenChat={handleOpenChat} />
        )}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          refreshProfilePhoto();
        }}
        isPremium={isPremium}
        announcements={announcements}
        currentUsername={displayUser.piUsername}
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
