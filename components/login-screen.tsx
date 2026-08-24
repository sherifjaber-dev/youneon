"use client";

import { useEffect } from "react";

interface LoginScreenProps {
  onLogin: () => void;
  isLoggingIn?: boolean;
  errorMessage?: string | null;
  piAvailable?: boolean;
  onGuest?: () => void;
}

export function LoginScreen({
  onLogin,
  isLoggingIn = false,
  errorMessage,
  piAvailable = true,
  onGuest,
}: LoginScreenProps) {
  const showPiBrowserHint = !piAvailable;
  const showError = Boolean(errorMessage) && (piAvailable || !errorMessage?.includes("Pi Browser"));

  useEffect(() => {
    const el = document.getElementById("youneon-static-login");
    if (el) el.style.display = "none";
  }, []);

  const handleSignIn = () => {
    if (typeof window.__youneonPiAuth === "function") {
      void window.__youneonPiAuth(true);
    }
    onLogin();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 overflow-hidden"
      style={{
        backgroundColor: "#1a0533",
        backgroundImage: "linear-gradient(to bottom right, #2e1065, #000000)",
        minHeight: "100dvh",
      }}
    >
      <div className="relative z-10 text-center w-full max-w-sm">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3" style={{ color: "#e9d5ff" }}>
          YouNeon
        </h1>
        <p className="text-sm text-white/90 font-light tracking-wide mb-6">
          Meet the Pi Network – Live video chat with real people
        </p>

        {showPiBrowserHint && (
          <p className="text-amber-200 text-xs mb-4 leading-relaxed">
            Pi authentication only works inside the Pi Browser. Open YouNeon in Pi Browser, then tap
            Sign in with Pi Network.
          </p>
        )}

        {showError && (
          <p className="text-red-200 text-xs mb-4 leading-relaxed">{errorMessage}</p>
        )}

        {isLoggingIn && (
          <p className="text-purple-200 text-xs mb-3">Connecting to Pi Network…</p>
        )}

        <button
          type="button"
          onClick={handleSignIn}
          className="relative z-20 w-full px-6 py-4 text-lg font-bold rounded-2xl shadow-xl shadow-purple-500/60 hover:shadow-pink-500/80 active:scale-95 transition-all cursor-pointer"
          style={{
            color: "#ffffff",
            backgroundImage: "linear-gradient(to right, #a855f7, #ec4899)",
            border: 0,
          }}
        >
          Sign in with Pi Network
        </button>

        {onGuest && (
          <button
            type="button"
            onClick={onGuest}
            className="relative z-20 mt-4 block mx-auto text-sm text-white/60 underline underline-offset-4 hover:text-white/90"
          >
            Continue as guest (demo)
          </button>
        )}

        <p className="text-white/70 text-xs mt-6">Secure • Instant • Powered by Pi Network</p>
      </div>
    </div>
  );
}
