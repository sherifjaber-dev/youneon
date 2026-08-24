"use client";

import { usePiAuth } from "@/contexts/pi-auth-context";
import { useState, useEffect } from "react";
import { PI_SIGNIN_ONCLICK } from "@/lib/pi-signin-onclick";

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
    try {
      const P = window.Pi;
      if (P) {
        console.log("[Pi] authenticate start");
        if (P.init) P.init({ version: "2.0", sandbox: true });
        try {
          P.authenticate({ scopes: ["username"] });
        } catch {
          P.authenticate(["username"], function () {});
        }
      } else {
        console.log("[Pi] error: no window.Pi");
      }
    } catch (e) {
      console.log("[Pi] error: " + e);
    }
    if (typeof window.__youneonPiAuth === "function") {
      void window.__youneonPiAuth(true);
    }
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
            onClick={handleSignIn}
            dangerouslySetInnerHTML={{
              __html:
                '<button type="button" class="youneon-signin-btn" data-youneon-signin="1" style="width:100%;padding:16px 24px;font-size:1.125rem;font-weight:700;border-radius:16px;background-image:linear-gradient(to right,#a855f7,#ec4899);color:#ffffff;border:0;cursor:pointer;pointer-events:auto;position:relative;z-index:2147483647" onclick="' +
                PI_SIGNIN_ONCLICK +
                '">Sign in with Pi Network</button>',
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
