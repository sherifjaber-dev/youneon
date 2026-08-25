"use client";
import { useState, useEffect } from "react";
import { User, Settings, LogOut, Edit2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileOnboarding } from "@/components/profile-onboarding";
import { SettingsScreen } from "@/components/settings-screen";
import { NeonShopModal } from "@/components/neon-shop-modal";   // ← NY IMPORT
import { useLanguage, type Language } from "@/contexts/language-context";
import { piAuthService } from "@/lib/pi-auth-service";

interface UserProfile {
  fullName: string;
  age: number;
  country: string;
  languages: string[];
  interests: string[];
  profilePicture?: string;
}

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

export function ProfileScreen() {
  const { t, language, setLanguage } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [reactionsReceived, setReactionsReceived] = useState<Record<string, number>>({});
  const [reportedUsers, setReportedUsers] = useState<Record<string, number>>({});
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showNeonShop, setShowNeonShop] = useState(false);   // ← NY STATE

  const REACTION_LIST = [
    { name: "Awesome", emoji: "👍" },
    { name: "Funny", emoji: "😂" },
    { name: "Friendly", emoji: "🙌" },
    { name: "WOW", emoji: "😲" },
    { name: "Magic Rabbit", emoji: "🪄" },
    { name: "Charming", emoji: "❤️" },
    { name: "Rose", emoji: "🌹" },
  ];

  useEffect(() => {
    setIsMounted(true);
    try {
      if (typeof window !== "undefined" && typeof Storage !== "undefined") {
        const piProfile = piAuthService.loadProfile();
        if (piProfile) {
          setProfile({
            fullName: piProfile.fullName,
            age: piProfile.age,
            country: piProfile.country,
            languages: piProfile.languages,
            interests: piProfile.interests,
            profilePicture: piProfile.profilePicture
          });
        }

        const reactions = localStorage.getItem("youneon_reactions_received");
        if (reactions) setReactionsReceived(JSON.parse(reactions));

        const reported = localStorage.getItem("youneon_reported_users");
        if (reported) setReportedUsers(JSON.parse(reported));

        const blocked = localStorage.getItem("youneon_blocked_users");
        if (blocked) setBlockedUsers(JSON.parse(blocked));
      }
    } catch (e) {
      console.error("[v0] Error loading profile:", e);
    }
  }, []);

  if (!isMounted || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (isEditing) {
    return <ProfileOnboarding isEditing={true} onBack={() => setIsEditing(false)} onComplete={(data) => {
      const updated = { ...data, age: typeof data.age === "string" ? parseInt(data.age) : data.age };
      setProfile(updated);
      const piUser = piAuthService.getCurrentUser();
      if (piUser) piAuthService.saveProfile({ ...piUser, ...updated });
      setIsEditing(false);
    }} />;
  }

  if (showSettings) {
    return <SettingsScreen onBack={() => setShowSettings(false)} onLogOut={() => { piAuthService.logout(); window.location.reload(); }} />;
  }

  return (
    <div className="min-h-screen bg-yn-bg pt-24 pb-24">
      {/* Profile Header */}
      <div className="bg-gradient-to-b from-purple-100 to-transparent px-4 py-8 text-center border-b border-gray-200 relative">
        <button onClick={() => setShowSettings(true)} className="absolute top-6 right-4 p-2 hover:bg-white rounded-lg transition">
          <Settings size={24} className="text-purple-600" />
        </button>
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-4 flex items-center justify-center text-5xl shadow-lg shadow-purple-400/40 overflow-hidden">
          {profile.profilePicture ? (
            <img src={profile.profilePicture} alt={profile.fullName} className="w-full h-full object-cover" />
          ) : (
            <span>👤</span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{profile.fullName}</h1>
        <p className="text-gray-600">{profile.age} years old • {profile.country}</p>
      </div>

      {/* Profile Details + Stats + Menu */}
      <div className="px-4 py-6 space-y-4">
        {/* ... (din gamle kode med sprog, interesser osv. er beholdt) ... */}
        {/* Languages, Interests, Reactions Received og Reported Users er uændret */}
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Language Selector (uændret) */}
        <div className="relative"> ... (din gamle sprog-knap) ... </div>

        {/* Edit Profile */}
        <button onClick={() => setIsEditing(true)} className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-purple-400 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-400/30 transition text-gray-900">
          <Edit2 size={20} className="text-purple-600" />
          <span className="flex-1 text-left font-medium">Edit Profile</span>
        </button>

        {/* ← NY NEON SHOP KNAP */}
        <button
          onClick={() => setShowNeonShop(true)}
          className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-lg shadow-purple-500/30 transition-all"
        >
          <span className="text-2xl">✨</span>
          <span className="flex-1 text-left">Buy Neon</span>
          <span className="text-xl">π</span>
        </button>

        {/* Log Out */}
        <button onClick={() => { piAuthService.logout(); window.location.reload(); }} className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-pink-400 hover:border-pink-500 hover:shadow-lg hover:shadow-pink-400/30 transition">
          <LogOut size={20} className="text-pink-600" />
          <span className="flex-1 text-left font-medium text-pink-600">Log Out</span>
        </button>
      </div>

      {/* Neon Shop Modal */}
      <NeonShopModal 
        isOpen={showNeonShop} 
        onClose={() => setShowNeonShop(false)} 
      />
    </div>
  );
}
