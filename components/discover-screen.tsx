"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Flame } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";

interface DiscoverScreenProps {
  onStartVideo: () => void;
  neonBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currentUserId?: string;
  onOpenNeonShop?: () => void;
}

export function DiscoverScreen({ onStartVideo, neonBalance, onUpdateBalance, currentUserId, onOpenNeonShop }: DiscoverScreenProps) {
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

  const countries = [
    "Worldwide", "United States", "United Kingdom", "Germany", "France", "Brazil",
    "India", "Saudi Arabia", "Egypt", "Nigeria", "South Africa", "China", "Japan",
    "South Korea", "Turkey", "Sweden", "Denmark", "Netherlands", "Spain", "Italy",
    "Canada", "Australia", "Indonesia", "Thailand", "Vietnam", "Pakistan", "Kenya",
    "Ghana", "Morocco", "United Arab Emirates", "Mexico", "Argentina", "Colombia",
    "Chile", "Peru", "Russia", "Poland", "Greece", "Portugal", "Belgium",
    "Switzerland", "Austria", "Ireland", "Finland", "Czech Republic", "Hungary",
    "Singapore", "Malaysia", "Philippines", "Bangladesh", "Iran", "Iraq", "Syria", "Yemen",
  ];

  const genderCost = genderOptions.find((g) => g.value === selectedGender)?.cost || 0;
  const countryCost = selectedCountry !== "Worldwide" ? 5 : 0;
  const totalCost = genderCost + countryCost;
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
    onStartVideo();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px-104px)] px-4 pt-3 pb-2 gap-3 overflow-hidden">
      <style>{`
        @keyframes neonPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(236,72,153,0.5), 0 0 60px rgba(168,85,247,0.3); }
          50% { box-shadow: 0 0 60px rgba(236,72,153,0.9), 0 0 120px rgba(168,85,247,0.6); }
        }
        @keyframes liveBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes flameWiggle {
          0%, 100% { transform: rotate(-5deg) scale(1); }
          50% { transform: rotate(5deg) scale(1.1); }
        }
        .neon-frame { animation: neonPulse 3s ease-in-out infinite; }
        .start-btn {
          background: linear-gradient(90deg, #a855f7 0%, #ec4899 25%, #f43f5e 50%, #ec4899 75%, #a855f7 100%);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        .start-btn:hover { transform: translateY(-2px) scale(1.01); }
        .start-btn:active { transform: translateY(0) scale(0.99); }
      `}</style>

      {/* ===== HERO VIDEO (viser hele videoen) ===== */}
      <div className="relative flex-1 min-h-0 rounded-3xl overflow-hidden neon-frame border-2 border-pink-500/40 bg-black">
        {/* Video showing full content (no crop). bg-black handles any letterboxing. */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-contain"
          data-testid="hero-video"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Subtle dark gradient overlay so badges/text are readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

        {/* LIVE badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-full shadow-lg z-10">
          <div className="w-2 h-2 rounded-full bg-white" style={{ animation: "liveBlink 1.5s ease-in-out infinite" }} />
          <span className="text-xs font-black tracking-widest">LIVE</span>
        </div>

        {/* Online count */}
        <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-green-400/40 z-10">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,1)]" />
          <span className="text-sm font-bold tabular-nums" data-testid="online-count">{onlineCount.toLocaleString()}</span>
          <span className="text-[11px] text-white/70 font-medium">online</span>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div className="flex-shrink-0 space-y-2.5">
        <div>
          <p className="text-xs text-white/60 mb-2 px-1 font-bold uppercase tracking-widest">Looking for</p>
          <div className="flex gap-2">
            {genderOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedGender(option.value as "women" | "men" | "both")}
                className={`flex-1 py-3 rounded-2xl font-bold transition-all border-2 ${
                  selectedGender === option.value
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-pink-400 shadow-lg shadow-pink-500/40 scale-[1.02]"
                    : "bg-zinc-900/80 text-white border-zinc-700 hover:border-zinc-500"
                }`}
                data-testid={`gender-${option.value}-btn`}
              >
                <div className="text-base leading-tight">{option.label}</div>
                <div className="text-[11px] opacity-90 flex items-center justify-center gap-1 mt-0.5 font-medium">
                  {option.cost > 0 ? (
                    <>
                      <span className="text-yellow-400">◆</span>
                      <span>{option.cost} Neon</span>
                    </>
                  ) : (
                    <span className="text-emerald-300">Gratis</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-xs text-white/60 mb-2 px-1 font-bold uppercase tracking-widest">Country</p>
          <button
            onClick={() => setShowCountryDropdown((v) => !v)}
            className="w-full bg-zinc-900/80 border-2 border-zinc-700 rounded-2xl px-4 py-3 flex items-center justify-between hover:border-zinc-500 transition-all"
            data-testid="country-dropdown-btn"
          >
            <span className="text-white text-base font-semibold">{selectedCountry}</span>
            <div className="flex items-center gap-2">
              {selectedCountry !== "Worldwide" && (
                <span className="text-[11px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full font-bold">◆ 5</span>
              )}
              <ChevronDown className={`w-5 h-5 text-white/60 transition-transform ${showCountryDropdown ? "rotate-180" : ""}`} />
            </div>
          </button>
          {showCountryDropdown && (
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-zinc-900 border-2 border-zinc-700 rounded-2xl max-h-60 overflow-y-auto shadow-2xl z-30">
              {countries.map((country) => (
                <div
                  key={country}
                  onClick={() => { setSelectedCountry(country); setShowCountryDropdown(false); }}
                  className={`px-4 py-3 cursor-pointer text-sm flex justify-between items-center hover:bg-zinc-800 transition ${
                    selectedCountry === country ? "bg-gradient-to-r from-purple-600/40 to-pink-600/40 text-white font-semibold" : "text-white"
                  }`}
                >
                  <span>{country}</span>
                  {country !== "Worldwide" && <span className="text-[11px] text-yellow-300 font-bold">◆ 5</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== BIG START BUTTON ===== */}
      <button
        onClick={handleStart}
        className="start-btn flex-shrink-0 relative rounded-2xl py-5 font-black text-white shadow-[0_8px_30px_rgba(236,72,153,0.6)] overflow-hidden border-2 border-pink-300/70 transition-all"
        data-testid="start-random-chat-btn"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20 pointer-events-none" />

        <div className="relative flex items-center justify-center gap-3">
          <Flame
            className="w-7 h-7 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.9)]"
            style={{ animation: "flameWiggle 0.8s ease-in-out infinite" }}
            fill="currentColor"
          />
          <span className="text-2xl sm:text-3xl tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            START RANDOM CHAT
          </span>
          <Flame
            className="w-7 h-7 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.9)]"
            style={{ animation: "flameWiggle 0.8s ease-in-out infinite", animationDelay: "0.4s" }}
            fill="currentColor"
          />
        </div>

        {totalCost > 0 && (
          <div className="relative mt-1 text-xs font-bold opacity-90 flex items-center justify-center gap-1">
            <span className="text-yellow-200">◆</span>
            <span>{totalCost} Neon · første chat gratis</span>
          </div>
        )}
      </button>

      {/* ===== INSUFFICIENT NEON MODAL ===== */}
      {showInsufficientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowInsufficientModal(false)}>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 max-w-sm w-full border border-pink-500/30 shadow-2xl text-white" onClick={(e) => e.stopPropagation()} data-testid="insufficient-neon-modal">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/30 to-pink-500/20 border-2 border-yellow-400/60 mb-4 shadow-[0_0_30px_rgba(250,204,21,0.4)]">
                <span className="text-4xl">◆</span>
              </div>
              <h3 className="text-2xl font-black mb-3">Ikke nok Neon</h3>
              <div className="bg-zinc-900/60 rounded-2xl p-4 mb-3 border border-zinc-700/60">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/60">Du skal bruge:</span>
                  <span className="font-bold text-yellow-300">◆ {totalCost} Neon</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/60">Du har:</span>
                  <span className="font-bold text-white">◆ {neonBalance} Neon</span>
                </div>
                <div className="border-t border-zinc-700/60 my-2"></div>
                <div className="flex items-center justify-between text-base">
                  <span className="text-white/80 font-semibold">Du mangler:</span>
                  <span className="font-black text-pink-400 text-lg">◆ {missingNeon} Neon</span>
                </div>
              </div>
              <p className="text-white/70 text-sm">
                Fyld dit Neon-saldo op for at starte chatten 🚀
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowInsufficientModal(false)}
                className="flex-1 py-3 rounded-2xl border border-zinc-700 text-white font-semibold hover:bg-zinc-800 transition"
                data-testid="cancel-insufficient-btn"
              >
                Annullér
              </button>
              <button
                onClick={() => {
                  setShowInsufficientModal(false);
                  if (onOpenNeonShop) {
                    onOpenNeonShop();
                  } else {
                    alert("Neon Shop er ikke tilgængelig endnu.");
                  }
                }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black shadow-lg shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all"
                data-testid="buy-neon-btn"
              >
                ◆ Køb Neon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}