"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Flame } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { AdBanner, AdInterstitial } from "@/components/ad-placements";
import { PremiumBadge } from "@/components/premium-badge";
import type { Announcement } from "@/lib/announcements";
import { COUNTRY_OPTIONS } from "@/lib/countries";

interface DiscoverScreenProps {
  onStartVideo: (filters: { gender: "women" | "men" | "both"; country: string }) => void;
  neonBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currentUserId?: string;
  onOpenNeonShop?: () => void;
  isPremium?: boolean;
  announcements?: Announcement[];
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
  const [selectedGender, setSelectedGender] = useState<"women" | "men" | "both">("both");
  const [selectedCountry, setSelectedCountry] = useState("Worldwide");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(1);

  const genderOptions = [
    { value: "women", label: "Women", cost: 10 },
    { value: "men", label: "Men", cost: 10 },
    { value: "both", label: "Both", cost: 0 },
  ];

  const countries = ["Worldwide", ...COUNTRY_OPTIONS];

  const genderCost = isPremium ? 0 : genderOptions.find((g) => g.value === selectedGender)?.cost || 0;
  const countryCost = isPremium || selectedCountry === "Worldwide" ? 0 : 5;
  const totalCost = genderCost + countryCost;
  const adItems = announcements.filter((item) => item.active && item.type === "ad");
  const hasEnoughNeon = neonBalance >= totalCost;
  const missingNeon = Math.max(0, totalCost - neonBalance);

  // ============ Real-time online counter ============
  useEffect(() => {
    if (!db || !currentUserId) return;

    const updatePresence = async () => {
      try {
        await setDoc(
          doc(db, "presence", currentUserId),
          { userId: currentUserId, lastSeen: serverTimestamp() },
          { merge: true }
        );
      } catch (e) { /* silent */ }
    };
    updatePresence();
    const hbInterval = setInterval(updatePresence, 25000);

    const cutoff = new Date(Date.now() - 60_000);
    const q = query(
      collection(db, "presence"),
      where("lastSeen", ">", Timestamp.fromDate(cutoff))
    );
    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      let count = 0;
      snap.forEach((d) => {
        const data = d.data() as any;
        const ts = data?.lastSeen?.toMillis?.();
        if (ts && now - ts < 60_000) count++;
      });
      setOnlineCount(Math.max(1, count));
    });

    return () => {
      clearInterval(hbInterval);
      unsub();
    };
  }, [currentUserId]);

  const handleStart = () => {
    if (!hasEnoughNeon) { setShowInsufficientModal(true); return; }
    const newBalance = neonBalance - totalCost;
    onUpdateBalance(newBalance);
    onStartVideo({ gender: selectedGender, country: selectedCountry });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-4 pb-3 pt-3">
      {/* ===== HERO VIDEO ===== */}
      <div className="relative min-h-[140px] flex-[0.9] overflow-hidden rounded-2xl border border-pink-500/25 bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-contain"
          data-testid="hero-video"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/55" />

        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-red-500/90 px-2 py-0.5">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          <span className="text-[10px] font-semibold tracking-wider text-white">LIVE</span>
        </div>

        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 backdrop-blur-md">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[12px] font-semibold tabular-nums text-white" data-testid="online-count">
            {onlineCount.toLocaleString()}
          </span>
          <span className="text-[10px] font-medium text-white/60">online</span>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div className="flex-shrink-0 space-y-3">
        <div>
          <p className="mb-1.5 px-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Looking for</p>
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-0.5">
            {genderOptions.map((option) => {
              const selected = selectedGender === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedGender(option.value as "women" | "men" | "both")}
                  className={`flex h-11 flex-1 flex-col items-center justify-center rounded-[10px] transition-all ${
                    selected
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_2px_10px_rgba(168,85,247,0.28)]"
                      : "bg-transparent text-white/70"
                  }`}
                  data-testid={`gender-${option.value}-btn`}
                >
                  <span className="text-[15px] font-semibold leading-none">{option.label}</span>
                  <span className={`mt-1 text-[10px] font-medium leading-none ${selected ? "text-white/80" : "text-white/40"}`}>
                    {isPremium || option.cost === 0 ? (
                      <span className={selected ? "text-emerald-200" : "text-emerald-400/80"}>Free</span>
                    ) : (
                      <>◆ {option.cost} Neon</>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <p className="mb-1.5 px-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Country</p>
          <button
            onClick={() => setShowCountryDropdown((v) => !v)}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 transition-colors hover:border-white/20"
            data-testid="country-dropdown-btn"
          >
            <span className="text-[15px] font-medium text-white">{selectedCountry}</span>
            <div className="flex items-center gap-2">
              {selectedCountry !== "Worldwide" && !isPremium && (
                <span className="rounded-full bg-yellow-400/15 px-2 py-0.5 text-[10px] font-semibold text-yellow-300">◆ 5</span>
              )}
              {selectedCountry !== "Worldwide" && isPremium && (
                <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Free</span>
              )}
              <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${showCountryDropdown ? "rotate-180" : ""}`} />
            </div>
          </button>
          {showCountryDropdown && (
            <div className="absolute bottom-full z-30 mb-2 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#16101f] shadow-xl shadow-black/40">
              {countries.map((country) => (
                <div
                  key={country}
                  onClick={() => { setSelectedCountry(country); setShowCountryDropdown(false); }}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm transition ${
                    selectedCountry === country
                      ? "bg-gradient-to-r from-purple-600/35 to-pink-600/35 font-medium text-white"
                      : "text-white/80 hover:bg-white/6"
                  }`}
                >
                  <span>{country}</span>
                  {country !== "Worldwide" && !isPremium && (
                    <span className="text-[10px] font-semibold text-yellow-300">◆ 5</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== PRIMARY CTA ===== */}
      <div className="flex-shrink-0">
        <button
          onClick={handleStart}
          className="yn-cta flex w-full items-center justify-center gap-2 text-white transition-transform"
          data-testid="start-random-chat-btn"
        >
          <Flame className="h-4 w-4 text-yellow-200" fill="currentColor" />
          <span>Start Random Chat</span>
          {isPremium && <PremiumBadge />}
        </button>
        {isPremium ? (
          <p className="mt-1.5 text-center text-[11px] font-medium text-amber-200/80">
            Priority matching · filters included
          </p>
        ) : totalCost > 0 ? (
          <p className="mt-1.5 text-center text-[11px] font-medium text-white/45">
            ◆ {totalCost} Neon · first chat is free
          </p>
        ) : (
          <p className="mt-1.5 text-center text-[11px] font-medium text-white/45">
            Matching worldwide · Free
          </p>
        )}
      </div>

      {!isPremium && (
        <AdBanner ads={adItems} onSubscribe={onOpenNeonShop} />
      )}
      {!isPremium && (
        <AdInterstitial ads={adItems} onSubscribe={onOpenNeonShop} />
      )}

      {/* ===== INSUFFICIENT NEON MODAL ===== */}
      {showInsufficientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setShowInsufficientModal(false)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#16101f] p-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            data-testid="insufficient-neon-modal"
          >
            <div className="mb-4 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-500/15">
                <span className="text-xl">◆</span>
              </div>
              <h3 className="mb-3 text-lg font-semibold">Not enough Neon</h3>
              <div className="mb-3 rounded-xl border border-white/8 bg-black/30 p-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-white/50">You need</span>
                  <span className="font-semibold text-yellow-300">◆ {totalCost} Neon</span>
                </div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-white/50">You have</span>
                  <span className="font-semibold text-white">◆ {neonBalance} Neon</span>
                </div>
                <div className="my-2 border-t border-white/8" />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-white/70">Missing</span>
                  <span className="font-semibold text-pink-400">◆ {missingNeon} Neon</span>
                </div>
              </div>
              <p className="text-sm text-white/55">Add Neon to start this chat.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowInsufficientModal(false)}
                className="h-11 flex-1 rounded-xl border border-white/12 text-[15px] font-semibold text-white/80 transition hover:bg-white/6"
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
                className="h-11 flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(168,85,247,0.3)]"
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
