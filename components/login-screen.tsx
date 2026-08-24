"use client";

import type { CSSProperties } from "react";
import { applyPiSigninNativeAttrs, piSigninControlsHtml } from "@/lib/pi-signin-onclick";

interface LoginScreenProps {
  onLogin: () => void;
  isLoggingIn?: boolean;
  errorMessage?: string | null;
  piAvailable?: boolean;
  onGuest?: () => void;
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 2147483647,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#0f0117",
  minHeight: "100%",
  padding: 16,
  boxSizing: "border-box",
  fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
  pointerEvents: "auto",
  cursor: "pointer",
  touchAction: "manipulation",
  userSelect: "none",
  WebkitUserSelect: "none",
  MozUserSelect: "none",
  msUserSelect: "none",
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "rgba(168,85,247,0.5)",
  caretColor: "transparent",
} as CSSProperties;

export function LoginScreen({
  onLogin,
  isLoggingIn = false,
  errorMessage,
  piAvailable = true,
  onGuest,
}: LoginScreenProps) {
  const showPiBrowserHint = !piAvailable;
  const showError = Boolean(errorMessage) && (piAvailable || !errorMessage?.includes("Pi Browser"));

  const handleSignIn = (e?: { preventDefault?: () => void }) => {
    try {
      e?.preventDefault?.();
    } catch {
      /* ignore */
    }
    try {
      const P = window.Pi;
      if (!P) {
        console.log("[Pi] error: no window.Pi");
      } else {
        console.log("[Pi] authenticate start");
        if (P.init) P.init({ version: "2.0", sandbox: true });
        try {
          P.authenticate({ scopes: ["username"] });
        } catch {
          P.authenticate(["username"], function () {});
        }
      }
    } catch (err) {
      console.log("[Pi] error: " + err);
    }
    if (typeof window.__youneonPiAuth === "function") {
      void window.__youneonPiAuth(true);
    }
    onLogin();
  };

  const bindOverlay = (el: HTMLDivElement | null) => {
    applyPiSigninNativeAttrs(el);
  };

  return (
    <div
      ref={bindOverlay}
      className="youneon-static-login"
      aria-label="Sign in with Pi Network"
      data-youneon-signin="1"
      style={overlayStyle}
      onPointerDown={handleSignIn}
      onMouseDown={handleSignIn}
      onTouchStart={handleSignIn}
      onClick={handleSignIn}
      onSelect={(e) => e.preventDefault()}
    >
      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          width: "100%",
          maxWidth: 384,
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          cursor: "pointer",
          caretColor: "transparent",
        }}
      >
        <h1
          style={{
            fontSize: "2.25rem",
            fontWeight: 800,
            margin: "0 0 0.75rem",
            color: "#e9d5ff",
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          YouNeon
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.9)",
            margin: "0 0 1.5rem",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          Meet the Pi Network – Live video chat with real people
        </p>

        {showPiBrowserHint && (
          <p
            style={{
              color: "#fde68a",
              fontSize: 12,
              margin: "0 0 1rem",
              lineHeight: 1.5,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            Pi authentication only works inside the Pi Browser. Open YouNeon in Pi Browser, then tap
            Sign in with Pi Network.
          </p>
        )}

        {showError && (
          <p
            style={{
              color: "#fecaca",
              fontSize: 12,
              margin: "0 0 1rem",
              lineHeight: 1.5,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {errorMessage}
          </p>
        )}

        {isLoggingIn && (
          <p
            style={{
              color: "#e9d5ff",
              fontSize: 12,
              margin: "0 0 0.75rem",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            Connecting to Pi Network…
          </p>
        )}

        <div
          style={{ pointerEvents: "auto", userSelect: "none", WebkitUserSelect: "none" }}
          dangerouslySetInnerHTML={{
            __html: piSigninControlsHtml("youneon-signin-btn-login"),
          }}
        />

        {onGuest && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onGuest();
            }}
            style={{
              position: "relative",
              zIndex: 20,
              marginTop: 16,
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
              fontSize: 14,
              color: "rgba(255,255,255,0.6)",
              background: "transparent",
              border: 0,
              textDecoration: "underline",
              cursor: "pointer",
              pointerEvents: "auto",
              userSelect: "none",
            }}
          >
            Continue as guest (demo)
          </button>
        )}

        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 12,
            marginTop: 24,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          Secure • Instant • Powered by Pi Network
        </p>
      </div>
    </div>
  );
}
