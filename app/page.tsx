"use client";
import { useState, useEffect } from "react";
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
import { AuthLoadingScreen } from "@/components/auth-loading-screen";
import { LoginScreen } from "@/components/login-screen";
import { usePiAuth } from "@/contexts/pi-auth-context";

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

export default function HomePage() {
  const {
    user,
    isAuthenticated,
    isInitializing,
    hasError,
    authMessage,
    login,
    piAvailable,
  } = usePiAuth();
  const [isGuestDemo, setIsGuestDemo] = useState(false);
  const [currentUser, setCurrentUser] = useState<YouNeonUser | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [activeTab, setActiveTab] = useState<"discover" | "messages" | "history">("discover");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isInVideoChat, setIsInVideoChat] = useState(false);
  const [neonBalance, setNeonBalance] = useState(100);
  const [showNeonShop, setShowNeonShop] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);

  useEffect(() => {
    const bal = localStorage.getItem("youneon_neon_balance");
    if (bal) setNeonBalance(parseInt(bal));
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
      setProfileReady(true);
      return;
    }

    if (!isAuthenticated || !user?.uid) {
      setCurrentUser(null);
      setProfileReady(false);
      return;
    }

    let cancelled = false;
    setProfileReady(false);

    (async () => {
      const piUsername = user.username || user.uid;
      const extras = readLocalProfileExtras();
      let profile: YouNeonUser = {
        id: piUsername,
        uid: user.uid,
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
            uid: user.uid,
            piUsername,
            profilePicture: remote.profilePicture || extras.profilePicture || "",
          };
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
      setProfileReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isGuestDemo, user]);

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

  const currentUserId = currentUser?.id || currentUser?.piUsername;
  const showApp = (isAuthenticated && profileReady && !!currentUser) || (isGuestDemo && !!currentUser);

  // Keep LoginScreen mounted while Pi.authenticate runs. Do not block on AuthLoadingScreen
  // until after authenticate has already succeeded. Guest is never the default path.
  if (!showApp) {
    if (isAuthenticated && !isGuestDemo) {
      return <AuthLoadingScreen />;
    }

    return (
      <LoginScreen
        onLogin={() => {
          console.log("[Pi] LoginScreen requesting Sign in");
          void login();
        }}
        isLoggingIn={isInitializing}
        errorMessage={hasError ? authMessage : null}
        piAvailable={piAvailable}
        onGuest={() => setIsGuestDemo(true)}
      />
    );
  }

  const hasOwnPhoto = !!(currentUser?.profilePicture && currentUser.profilePicture.length > 0);

  if (activeChat && currentUser) {
    return (
      <ChatScreen
        conversationId={activeChat.conversationId}
        currentUserId={currentUserId!}
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
      />
    );
  }

  if (isInVideoChat) {
    return (
      <VideoCallScreen
        onEnd={handleEndVideoChat}
        currentUserId={currentUserId}
        currentUserName={currentUser?.fullName}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBar
        onProfileClick={() => setShowProfileModal(true)}
        neonBalance={neonBalance}
        onNeonClick={() => setShowNeonShop(true)}
      />
      <div className="flex-1 overflow-y-auto pt-16 pb-24">
        {activeTab === "discover" && (
          <DiscoverScreen
            onStartVideo={() => setIsInVideoChat(true)}
            neonBalance={neonBalance}
            onUpdateBalance={updateNeonBalance}
            currentUserId={currentUserId}
            onOpenNeonShop={() => setShowNeonShop(true)}
          />
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
      />
      <NeonShopModal isOpen={showNeonShop} onClose={() => setShowNeonShop(false)} />
    </div>
  );
}
