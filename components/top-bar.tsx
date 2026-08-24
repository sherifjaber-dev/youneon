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
    <div className="yn-glass fixed top-0 left-0 right-0 z-50 border-b border-white/8 px-4 pt-[env(safe-area-inset-top)]">
      <div className="flex h-12 items-center justify-between">
        <button
          onClick={onProfileClick}
          className="h-8 w-8 overflow-hidden rounded-full border border-white/20 transition-transform active:scale-95"
          aria-label="Open profile"
        >
          {profilePic ? (
            <Image
              src={profilePic}
              alt="Your Profile"
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-sm text-white">
              👤
            </div>
          )}
        </button>

        <span className="bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-[15px] font-semibold tracking-tight text-transparent">
          YouNeon
        </span>

        <button
          onClick={onNeonClick}
          className="flex h-8 items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-2.5 transition-colors active:scale-95"
          aria-label="Open Neon shop"
        >
          <span className="text-[13px] text-yellow-400">◆</span>
          <span className="text-[13px] font-semibold tabular-nums text-yellow-300">{neonBalance}</span>
          <span className="text-[11px] font-medium text-yellow-300/70">Neon</span>
        </button>
      </div>
    </div>
  );
}
