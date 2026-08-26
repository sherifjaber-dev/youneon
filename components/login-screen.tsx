"use client";

import type { CSSProperties } from "react";
import { applyPiSigninNativeAttrs } from "@/lib/pi-signin-onclick";
import { PI_WELCOME_OVERLAY_STYLE, piWelcomeInnerHtml, youneonWelcomeLegalHtml } from "@/lib/pi-welcome-markup";
import { tapPiAuthenticate } from "@/lib/pi-sdk";

interface LoginScreenProps {
  onLogin: () => void;
  isLoggingIn?: boolean;
  errorMessage?: string | null;
  piAvailable?: boolean;
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
  backgroundColor: "#070010",
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
  WebkitTapHighlightColor: "rgba(194,24,117,0.35)",
  caretColor: "transparent",
} as CSSProperties;

export function LoginScreen({
  onLogin,
  isLoggingIn = false,
  errorMessage,
  piAvailable = true,
}: LoginScreenProps) {
  const showPiBrowserHint = !piAvailable;
  const showError = Boolean(errorMessage) && (piAvailable || !errorMessage?.includes("Pi Browser"));

  const handleSignIn = () => {
    tapPiAuthenticate();
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
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html:
            '<div style="' +
            PI_WELCOME_OVERLAY_STYLE.replace("position:fixed;top:0;right:0;bottom:0;left:0;", "position:relative;") +
            'padding:0;min-height:0">' +
            piWelcomeInnerHtml("youneon-signin-btn-login", "ynlogin") +
            "</div>",
        }}
      />

      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: youneonWelcomeLegalHtml() }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          width: "100%",
          maxWidth: 360,
          pointerEvents: "none",
          userSelect: "none",
          marginTop: 8,
        }}
      >
        {showPiBrowserHint && (
          <p
            style={{
              color: "#fde68a",
              fontSize: 12,
              margin: "8px 0 0",
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
      </div>
    </div>
  );
}
