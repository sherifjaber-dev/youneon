"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface MatchingLoadingScreenProps {
  onCancel: () => void;
}

export function MatchingLoadingScreen({ onCancel }: MatchingLoadingScreenProps) {
  const [dots, setDots] = useState(".");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [searchProgress, setSearchProgress] = useState(0);

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 200);

    const timeTimer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    const progressTimer = setInterval(() => {
      setSearchProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => {
      clearInterval(dotTimer);
      clearInterval(timeTimer);
      clearInterval(progressTimer);
    };
  }, []);

  const messages = [
    "Finding your perfect match",
    "Connecting you with someone amazing",
    "Scanning worldwide",
    "Almost there",
    "Matching with awesome people",
  ];

  const randomMessage =
    messages[Math.floor(Math.random() * messages.length)];

  return (
    <div className="h-screen bg-neon-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <Card className="w-full max-w-md bg-purple-950/40 backdrop-blur-2xl border-purple-500/30 p-8 text-center space-y-8 relative z-10 shadow-2xl shadow-purple-500/40">
        {/* Animated Matching Circles */}
        <div className="flex justify-center">
          <div className="relative w-40 h-40">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-400 border-r-pink-400 animate-spin" style={{ animationDuration: "2s" }} />
            {/* Middle ring */}
            <div className="absolute inset-3 rounded-full border-4 border-transparent border-b-pink-400 border-l-purple-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "3s" }} />
            {/* Inner ring */}
            <div className="absolute inset-6 rounded-full border-3 border-transparent border-t-purple-300 border-r-pink-400 animate-spin" style={{ animationDuration: "4s" }} />
            
            {/* Center emoji */}
            <div className="absolute inset-0 flex items-center justify-center text-5xl animate-bounce">
              🔍
            </div>
          </div>
        </div>

        {/* Matching Message */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-purple-100">
            {randomMessage}
            <span className="inline-block w-6">{dots}</span>
          </h2>
          <p className="text-purple-300 font-semibold">
            {elapsedTime > 0 && `${elapsedTime}s`}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-purple-900/50 rounded-full h-3 overflow-hidden border border-purple-500/30">
            <div
              className="neon-gradient-bg transition-all duration-300 shadow-lg shadow-purple-600/60"
              style={{ width: `${Math.min(searchProgress, 95)}%` }}
            />
          </div>
          <p className="text-xs text-purple-300/70">
            {Math.min(Math.round(searchProgress), 95)}% matched
          </p>
        </div>

        {/* Fun Facts Carousel */}
        <div className="bg-purple-500/10 backdrop-blur-md rounded-2xl p-4 space-y-2 border border-purple-500/30">
          <p className="text-sm text-purple-300 font-bold">💡 FUN FACT</p>
          <p className="text-sm text-purple-100 font-medium">
            YouNeon connects 1000+ people every hour!
          </p>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="w-full py-3 px-4 bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 hover:text-pink-200 rounded-xl font-bold transition border border-pink-500/40 backdrop-blur-md shadow-lg shadow-pink-500/30"
        >
          ✕ Cancel
        </button>
      </Card>
    </div>
  );
}
