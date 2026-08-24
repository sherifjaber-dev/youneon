"use client";

import React from "react";
import { Zap } from "lucide-react";

export function CoinBalance() {
  const totalNeon = 0;   // Du kan senere ændre dette til det rigtige tal

  return (
    <div className="fixed top-6 left-6 z-40 flex items-center gap-2.5 rounded-lg bg-purple-900 px-4 py-2.5 border-2 border-purple-400 shadow-lg shadow-purple-500/60 pointer-events-none">
      <div className="relative">
        <Zap size={18} className="text-pink-300" fill="currentColor" />
      </div>
      <div className="flex flex-col items-start">
        <span className="text-xs font-bold text-pink-300 leading-none tracking-wide">Neon</span>
        <span className="text-lg font-black text-pink-300 leading-tight">
          {totalNeon.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
