"use client";

import { usePiAuth } from "@/contexts/pi-auth-context";
import { useState, useEffect } from "react";

export function AuthLoadingScreen() {
  const { authMessage, hasError, reinitialize, isInitializing } = usePiAuth();
  const [displayMessage, setDisplayMessage] = useState(authMessage);

  useEffect(() => {
    setDisplayMessage(authMessage);
  }, [authMessage]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 to-black">
      <div className="max-w-md w-full px-6 text-center space-y-6">
        {/* Logo Header */}
        <div className="flex justify-center mb-8">
          <div className="text-5xl font-bold">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl">
              YouNeon
            </span>
          </div>
        </div>

        {/* Loader or Error Icon */}
        <div className="flex justify-center">
          {hasError ? (
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-400"
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
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Status Message */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-purple-100">
            {hasError ? "Connection Failed" : "Initializing YouNeon"}
          </h2>
          <p
            className={`text-sm font-medium h-12 flex items-center justify-center ${
              hasError ? "text-red-300" : "text-purple-300/70"
            }`}
          >
            {displayMessage}
          </p>
        </div>

        {/* Retry Button - Only show on error */}
        {hasError && (
          <button
            onClick={reinitialize}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/50 hover:shadow-pink-500/50"
          >
            Try Again
          </button>
        )}

        {/* Help Text */}
        {!isInitializing && !hasError && (
          <p className="text-xs text-purple-300/50 pt-4">
            Initializing your account...
          </p>
        )}

        {hasError && (
          <p className="text-xs text-red-300/50 pt-4">
            Please check your connection and try again
          </p>
        )}
      </div>
    </div>
  );
}
