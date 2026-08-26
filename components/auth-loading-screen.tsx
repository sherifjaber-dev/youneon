"use client";

import { usePiAuth } from "@/contexts/pi-auth-context";
import { useState, useEffect } from "react";
import { bindPiSigninButtonIn, piSigninControlsHtml } from "@/lib/pi-signin-onclick";
import { tapPiAuthenticate } from "@/lib/pi-sdk";

const LOGIN_FALLBACK_MS = 2000;

export function AuthLoadingScreen() {
  const { authMessage, hasError, login, isInitializing } = usePiAuth();
  const [displayMessage, setDisplayMessage] = useState(authMessage);
  const [showLoginButton, setShowLoginButton] = useState(false);

  useEffect(() => {
    setDisplayMessage(authMessage);
  }, [authMessage]);

  useEffect(() => {
    const t = setTimeout(() => setShowLoginButton(true), LOGIN_FALLBACK_MS);
    return () => clearTimeout(t);
  }, []);

  const handleSignIn = () => {
    tapPiAuthenticate();
    void login();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "#1a0533",
        backgroundImage: "linear-gradient(to bottom right, #2e1065, #000000)",
        minHeight: "100dvh",
      }}
    >
      <div className="max-w-sm w-full px-4 text-center space-y-5">
        <div className="flex justify-center">
          <div className="text-4xl font-extrabold">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 bg-clip-text text-transparent">
              YouNeon
            </span>
          </div>
        </div>

        {!showLoginButton && (
          <div className="flex justify-center">
            {hasError ? (
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  strokeWidth="2"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
            ) : (
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500 animate-spin" />
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-purple-100">
            {hasError ? "Connection Failed" : showLoginButton ? "YouNeon" : "Initializing YouNeon"}
          </h2>
          {!showLoginButton && (
            <p
              className={`text-sm font-medium ${
                hasError ? "text-red-300" : "text-purple-300/70"
              }`}
            >
              {displayMessage}
            </p>
          )}
        </div>

        {(showLoginButton || hasError) && (
          <div
            ref={(el) => {
              const btn = bindPiSigninButtonIn(el);
              if (!btn || btn.getAttribute("data-youneon-extra-bound") === "1") return;
              btn.setAttribute("data-youneon-extra-bound", "1");
              const run = () => {
                handleSignIn();
              };
              btn.addEventListener("pointerdown", run);
              btn.addEventListener("mousedown", run);
              btn.addEventListener("touchstart", run);
              btn.addEventListener("click", run);
            }}
            style={{ pointerEvents: "auto", userSelect: "none", WebkitUserSelect: "none" }}
            dangerouslySetInnerHTML={{
              __html: piSigninControlsHtml("youneon-signin-btn-auth"),
            }}
          />
        )}

        {isInitializing && !showLoginButton && (
          <p className="text-xs text-purple-300/50">Initializing your account...</p>
        )}
      </div>
    </div>
  );
}
