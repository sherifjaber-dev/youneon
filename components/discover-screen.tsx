"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Crown, Globe, Video } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { AdInterstitial } from "@/components/ad-placements";
import { CountryLabel } from "@/components/country-flag";
import { PremiumBadge } from "@/components/premium-badge";
import { NeonAvatar } from "@/components/neon-avatar";
import { DottedWorldMap } from "@/components/dotted-world-map";
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

const RING_COLORS = ["#38bdf8", "#f472b6", "#c084fc", "#38bdf8"];
const DOT_COLORS = ["#38bdf8", "#f472b6", "#a78bfa", "#22d3ee"];

function BothGenderMark() {
  return (
    <svg viewBox="0 0 18 18" width="13" height="13" className="yn-gender-symbol inline-block align-[-1px]" aria-hidden>
      <circle cx="8" cy="10.2" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.55" />
      <path d="M8 13.8v3.1M6.4 15.4h3.2" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      <path d="M10.6 7.6L14.8 3.4M12.2 3.4h2.6v2.6" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LiveWaveIcon() {
  return (
    <svg viewBox="0 0 14 12" width="12" height="11" aria-hidden fill="none">
      <circle cx="3.2" cy="6" r="1.35" fill="white" />
      <path d="M5.6 3.7a3.4 3.4 0 0 1 0 4.6" stroke="white" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M8.1 2.1a5.6 5.6 0 0 1 0 7.8" stroke="white" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M10.6 0.8a7.6 7.6 0 0 1 0 10.4" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

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
    symbol: string;
    cost: number;
    tone: "pink" | "blue" | "purple";
  }[] = [
    { value: "women", label: "Women", symbol: "♀", cost: 10, tone: "pink" },
    { value: "men", label: "Men", symbol: "♂", cost: 10, tone: "blue" },
    { value: "both", label: "Both", symbol: "⚥", cost: 0, tone: "purple" },
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
    <div className="yn-discover flex h-full min-h-0 flex-col gap-3 overflow-y-auto px-4 pb-4 pt-3">
      <div className="yn-live-card relative min-h-[188px] flex-[1.05] overflow-hidden">
        <DottedWorldMap className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#07040f]/20 via-transparent to-[#07040f]/75" />

        <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-[#ef4444] px-2 py-0.5 shadow-[0_0_12px_rgba(239,68,68,0.55)]">
          <LiveWaveIcon />
          <span className="text-[10px] font-bold tracking-[0.14em] text-white">LIVE</span>
        </div>

        <div className="relative z-10 flex h-full min-h-[188px] flex-col items-center justify-center px-4 pb-4 pt-8">
          <p className="text-center text-[22px] font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
            Start Random <span className="text-[#ff4ec8] drop-shadow-[0_0_12px_rgba(255,78,200,0.7)]">Video Chat</span>
          </p>

          {liveAvatars.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              {liveAvatars.map((person, i) => (
                <div
                  key={person.id}
                  className="relative rounded-full p-[2px]"
                  style={{
                    boxShadow: `0 0 12px ${RING_COLORS[i % RING_COLORS.length]}`,
                    background: `linear-gradient(135deg, ${RING_COLORS[i % RING_COLORS.length]}, ${RING_COLORS[(i + 1) % RING_COLORS.length]})`,
                  }}
                >
                  <div className="rounded-full bg-[#07040f] p-[2px]">
                    <NeonAvatar src={person.photo} name={person.name} size={44} showPhoto />
                  </div>
                  <span
                    className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full"
                    style={{
                      background: DOT_COLORS[i % DOT_COLORS.length],
                      boxShadow: `0 0 8px ${DOT_COLORS[i % DOT_COLORS.length]}`,
                    }}
                    aria-label="Online"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 space-y-3">
        <div>
          <p className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9b8bb8]">
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
                  <span className="text-[14px] font-semibold leading-none">
                    {option.label}{" "}
                    {option.value === "both" ? (
                      <BothGenderMark />
                    ) : (
                      <span className="yn-gender-symbol">{option.symbol}</span>
                    )}
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
                className={`h-4 w-4 text-[#c084fc] transition-transform ${showCountryDropdown ? "rotate-180" : ""}`}
              />
            </div>
          </button>
          {showCountryDropdown && (
            <div className="absolute left-0 right-0 z-30 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-[#a855f7]/35 bg-[#12081c] shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
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
          <Video className="h-[18px] w-[18px] text-white" strokeWidth={2.1} />
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
          <p className="mt-2 text-center text-[12px] font-medium text-[#c4b5d8]">
            • Matching worldwide · <span className="font-semibold text-[#e9d5ff]">Free</span> •
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
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f5d76e]">
              <Crown size={12} className="text-[#f5d76e]" />
              Sponsored · YouNeon Premium
            </p>
            <p className="mt-1 text-[15px] font-bold leading-snug text-[#f5d76e]">Unlock Premium Features,</p>
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
            className="w-full max-w-sm rounded-2xl border border-[#a855f7]/30 bg-[#12081c] p-5 text-white shadow-xl"
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
