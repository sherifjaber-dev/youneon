"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Crown, Globe } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { AdInterstitial } from "@/components/ad-placements";
import { CountryLabel } from "@/components/country-flag";
import { PremiumBadge } from "@/components/premium-badge";
import { NeonAvatar } from "@/components/neon-avatar";
import { PremiumGem } from "@/components/premium-gem";
import type { Announcement } from "@/lib/announcements";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { usePrivacyConsentLive } from "@/hooks/use-user-settings";
import { isRealPiUsername } from "@/lib/real-pi-user";
import { subscribeToLoungePeople, type LoungePerson } from "@/lib/lounge-service";

interface DiscoverScreenProps {
  onStartVideo: (filters: { gender: "women" | "men" | "both"; country: string }) => void;
  neonBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currentUserId?: string;
  onOpenNeonShop?: () => void;
  isPremium?: boolean;
  announcements?: Announcement[];
}

const LIVE_RINGS = [
  { left: "18.26%", top: "78.3%" },
  { left: "38.77%", top: "78.3%" },
  { left: "59.33%", top: "78.3%" },
  { left: "79.20%", top: "78.3%" },
];

export function DiscoverScreen({
  onStartVideo,
  neonBalance,
  onUpdateBalance,
  currentUserId,
  onOpenNeonShop,
  isPremium = false,
  announcements = [],
}: DiscoverScreenProps) {
  const privacy = usePrivacyConsentLive();
  const [selectedGender, setSelectedGender] = useState<"women" | "men" | "both">("both");
  const [selectedCountry, setSelectedCountry] = useState("Worldwide");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [livePeople, setLivePeople] = useState<LoungePerson[]>([]);

  const genderOptions: {
    value: "women" | "men" | "both";
    label: string;
    icon: string;
    cost: number;
    tone: "pink" | "blue" | "purple";
  }[] = [
    { value: "women", label: "Women", icon: "/youneon/gender-women.png", cost: 10, tone: "pink" },
    { value: "men", label: "Men", icon: "/youneon/gender-men.png", cost: 10, tone: "blue" },
    { value: "both", label: "Both", icon: "/youneon/gender-both.png", cost: 0, tone: "purple" },
  ];

  const countries = ["Worldwide", ...COUNTRY_OPTIONS];

  const genderCost = isPremium ? 0 : genderOptions.find((g) => g.value === selectedGender)?.cost || 0;
  const countryCost = isPremium || selectedCountry === "Worldwide" ? 0 : 5;
  const totalCost = genderCost + countryCost;
  const adItems = announcements.filter((item) => item.active && item.type === "ad");
  const hasEnoughNeon = neonBalance >= totalCost;
  const missingNeon = Math.max(0, totalCost - neonBalance);
  const liveAvatars = livePeople.slice(0, 4);

  useEffect(() => {
    if (!db || !isRealPiUsername(currentUserId)) return;

    const updatePresence = async () => {
      try {
        await setDoc(
          doc(db, "presence", currentUserId),
          { userId: currentUserId, lastSeen: serverTimestamp() },
          { merge: true }
        );
      } catch {
        /* silent */
      }
    };
    updatePresence();
    const hbInterval = setInterval(updatePresence, 25000);
    return () => clearInterval(hbInterval);
  }, [currentUserId]);

  useEffect(() => {
    if (!isRealPiUsername(currentUserId)) {
      setLivePeople([]);
      return;
    }
    return subscribeToLoungePeople(currentUserId, (people) => {
      const sorted = [...people].sort((a, b) => b.lastSeenMs - a.lastSeenMs);
      setLivePeople(sorted);
    });
  }, [currentUserId]);

  const handleStart = () => {
    if (!hasEnoughNeon) {
      setShowInsufficientModal(true);
      return;
    }
    const newBalance = neonBalance - totalCost;
    onUpdateBalance(newBalance);
    onStartVideo({ gender: selectedGender, country: selectedCountry });
  };

  return (
    <div className="yn-discover flex h-full min-h-0 flex-col gap-3.5 overflow-y-auto px-4 pb-4 pt-3">
      <div className="yn-live-card relative flex-[1.08] overflow-hidden">
        <div className="yn-live-banner-stage relative w-full">
          <img
            src="/youneon/live-banner.png"
            alt=""
            draggable={false}
            className="yn-live-banner-img"
          />
          <p className="yn-live-title">
            Start Random{" "}
            <span className="text-[#ff4fd8] drop-shadow-[0_0_16px_rgba(255,78,200,0.95)]">Video Chat</span>
          </p>
          {LIVE_RINGS.map((ring, i) => {
            const person = liveAvatars[i];
            if (!person) return null;
            return (
              <div
                key={person.id}
                className="yn-live-ring-slot"
                style={{ left: ring.left, top: ring.top }}
              >
                <NeonAvatar src={person.photo} name={person.name} size={48} showPhoto />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-shrink-0 space-y-3">
        <div>
          <p className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b8bb8]">
            Looking for:
          </p>
          <div className="flex gap-2">
            {genderOptions.map((option) => {
              const selected = selectedGender === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedGender(option.value)}
                  className={`yn-gender-pill yn-gender-${option.tone} ${selected ? "is-on" : ""}`}
                  data-testid={`gender-${option.value}-btn`}
                >
                  <span className="flex items-center gap-1 text-[14px] font-semibold leading-none">
                    {option.label}
                    <img src={option.icon} alt="" draggable={false} className="yn-gender-asset" />
                  </span>
                  <span className="mt-1 text-[10px] font-semibold leading-none">
                    {isPremium || option.cost === 0 ? (
                      <span className={selected ? "text-emerald-200" : "text-emerald-400/80"}>Free</span>
                    ) : (
                      <span className="text-[#f5d76e] drop-shadow-[0_0_6px_rgba(212,175,55,0.45)]">
                        ◆ {option.cost} Neon
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowCountryDropdown((v) => !v)}
            className="yn-country-pill"
            data-testid="country-dropdown-btn"
          >
            <Globe className="h-4 w-4 shrink-0 text-[#c084fc]" strokeWidth={1.8} />
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#9b8bb8]">
                Country
              </span>
              <span className="block truncate text-[14px] font-semibold text-white">
                {selectedCountry === "Worldwide" ? (
                  "Worldwide"
                ) : (
                  <CountryLabel country={selectedCountry} size={16} nameClassName="text-white" />
                )}
              </span>
            </span>
            <div className="flex items-center gap-2">
              {selectedCountry !== "Worldwide" && !isPremium && (
                <span className="rounded-full border border-[#f5d76e]/40 bg-[#f5d76e]/10 px-2 py-0.5 text-[10px] font-semibold text-[#f5d76e]">
                  ◆ 5
                </span>
              )}
              {selectedCountry !== "Worldwide" && isPremium && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  Free
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 text-white/90 transition-transform ${showCountryDropdown ? "rotate-180" : ""}`}
              />
            </div>
          </button>
          {showCountryDropdown && (
            <div className="absolute left-0 right-0 z-30 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-[#a855f7]/50 bg-[#0c0616] shadow-[0_12px_32px_rgba(0,0,0,0.55),0_0_22px_rgba(168,85,247,0.28)]">
              {countries.map((country) => (
                <div
                  key={country}
                  onClick={() => {
                    setSelectedCountry(country);
                    setShowCountryDropdown(false);
                  }}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm transition ${
                    selectedCountry === country
                      ? "bg-[#a855f7]/20 font-medium text-white"
                      : "text-[#c4b5d8] hover:bg-white/[0.04]"
                  }`}
                >
                  <span>
                    {country === "Worldwide" ? country : <CountryLabel country={country} size={16} />}
                  </span>
                  {country !== "Worldwide" && !isPremium && (
                    <span className="text-[10px] font-semibold text-[#f5d76e]">◆ 5</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        <button
          onClick={handleStart}
          className="yn-start-cta"
          data-testid="start-random-chat-btn"
        >
          <img src="/youneon/camera.png" alt="" draggable={false} className="yn-cta-camera" />
          <span>Start Random Chat</span>
          {isPremium && <PremiumBadge />}
        </button>
        {isPremium ? (
          <p className="mt-2 text-center text-[12px] font-medium text-[#c4b5d8]">
            Priority matching · filters included
          </p>
        ) : totalCost > 0 ? (
          <p className="mt-2 text-center text-[12px] font-medium text-[#c4b5d8]">
            ◆ {totalCost} Neon · first chat is free
          </p>
        ) : (
          <p className="mt-2 text-center text-[12px] font-medium text-[#b9a8c9]">
            • Matching worldwide · <span className="font-semibold text-white">Free</span> •
          </p>
        )}
      </div>

      {!isPremium && (
        <button
          type="button"
          onClick={() => onOpenNeonShop?.()}
          className="yn-premium-card flex-shrink-0 text-left"
        >
          <div className="min-w-0 flex-1 pr-2">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f5d76e] drop-shadow-[0_0_8px_rgba(245,215,110,0.55)]">
              <Crown size={12} className="text-[#f5d76e] drop-shadow-[0_0_8px_rgba(245,215,110,0.7)]" />
              Sponsored · YouNeon Premium
            </p>
            <p className="mt-1 text-[15px] font-bold leading-snug text-[#f5d76e] drop-shadow-[0_0_10px_rgba(245,215,110,0.45)]">
              Unlock Premium Features,
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-[#b8a9c9]">
              Better matches, HD quality, and no waiting.
            </p>
            <span className="yn-see-premium mt-2.5 inline-flex items-center gap-1">
              See Premium
              <ChevronRight size={14} className="text-[#1a1408]" />
            </span>
          </div>
          <PremiumGem className="h-[72px] w-[64px] shrink-0" />
        </button>
      )}

      {!isPremium && privacy.advertising && (
        <AdInterstitial ads={adItems} onSubscribe={onOpenNeonShop} />
      )}

      {showInsufficientModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowInsufficientModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#a855f7]/40 bg-[#0c0616] p-5 text-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
            data-testid="insufficient-neon-modal"
          >
            <div className="mb-4 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#f5d76e]/40 bg-[#f5d76e]/10">
                <span className="text-xl text-[#f5d76e]">◆</span>
              </div>
              <h3 className="mb-3 text-lg font-semibold">Not enough Neon</h3>
              <div className="mb-3 rounded-xl border border-white/8 bg-black/25 p-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-[#b8a9c9]">You need</span>
                  <span className="font-semibold text-[#f5d76e]">◆ {totalCost} Neon</span>
                </div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-[#b8a9c9]">You have</span>
                  <span className="font-semibold text-white">◆ {neonBalance} Neon</span>
                </div>
                <div className="my-2 border-t border-white/8" />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[#b8a9c9]">Missing</span>
                  <span className="font-semibold text-pink-400">◆ {missingNeon} Neon</span>
                </div>
              </div>
              <p className="text-sm text-[#b8a9c9]">Add Neon to start this chat.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowInsufficientModal(false)}
                className="h-11 flex-1 rounded-xl border border-white/12 text-[15px] font-semibold text-[#c4b5d8] transition hover:bg-white/[0.04]"
                data-testid="cancel-insufficient-btn"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowInsufficientModal(false);
                  if (onOpenNeonShop) {
                    onOpenNeonShop();
                  } else {
                    alert("Neon Shop is not available yet.");
                  }
                }}
                className="h-11 flex-1 rounded-xl bg-gradient-to-r from-[#ff2bd6] to-[#3b82ff] text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(255,43,214,0.35)]"
                data-testid="buy-neon-btn"
              >
                ◆ Buy Neon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
