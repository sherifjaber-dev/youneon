"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { piAuthService } from "@/lib/pi-auth-service";

interface TopBarProps {
  onProfileClick: () => void;
  neonBalance: number;
  onNeonClick?: () => void;
}

export function TopBar({ onProfileClick, neonBalance, onNeonClick }: TopBarProps) {
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
    const user = piAuthService.getCurrentUser() || piAuthService.loadProfile();
    if (user?.profilePicture) {
      setProfilePic(user.profilePicture);
    }
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-purple-950/95 to-purple-950/80 backdrop-blur-lg border-b border-purple-500/30 px-4 py-3">
      <div className="flex items-center justify-between">
        
        {/* Profil billede – klikbart */}
        <button
          onClick={onProfileClick}
          className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/80 shadow-md hover:scale-105 active:scale-95 transition-all"
        >
          {profilePic ? (
            <Image
              src={profilePic}
              alt="Your Profile"
              width={44}
              height={44}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl text-white">
              👤
            </div>
          )}
        </button>

        {/* Neon balance */}
        <button
          onClick={onNeonClick}
          className="flex items-center gap-2 bg-zinc-900/90 px-4 py-1.5 rounded-2xl border border-purple-400/50 hover:border-pink-400 transition-all active:scale-95"
        >
          <span className="text-yellow-400 text-xl">◆</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-yellow-400">{neonBalance}</span>
            <span className="text-xs text-yellow-400/70">Neon</span>
          </div>
        </button>
      </div>
    </div>
  );
}