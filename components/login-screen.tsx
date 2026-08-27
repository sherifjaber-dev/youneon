"use client";

import { type CSSProperties } from "react";
import { bindPiSigninButtonIn } from "@/lib/pi-signin-onclick";
import { PI_WELCOME_OVERLAY_STYLE, piWelcomeInnerHtml } from "@/lib/pi-welcome-markup";

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
  cursor: "default",
  touchAction: "manipulation",
  userSelect: "none",
  WebkitUserSelect: "none",
  MozUserSelect: "none",
  msUserSelect: "none",
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "transparent",
  caretColor: "transparent",
} as CSSProperties;

export function LoginScreen({
  onLogin: _onLogin,
  isLoggingIn = false,
  errorMessage,
  piAvailable = true,
}: LoginScreenProps) {
  const showPiBrowserHint = !piAvailable;
  const showError = Boolean(errorMessage) && (piAvailable || !errorMessage?.includes("Pi Browser"));

  const bindHost = (el: HTMLDivElement | null) => {
    bindPiSigninButtonIn(el);
  };

  return (
    <div
      ref={bindHost}
      className="youneon-static-login"
      aria-label="YouNeon"
      data-youneon-login-v="login-signin-tap-1"
      style={overlayStyle}
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
