"use client";

import React from "react";
import { applyPiSigninNativeAttrs, piSigninControlsHtml } from "@/lib/pi-signin-onclick";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

const overlayStyle: React.CSSProperties = {
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
  color: "#ffffff",
  padding: 16,
  textAlign: "center",
  fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
  pointerEvents: "auto",
  cursor: "pointer",
  touchAction: "manipulation",
  userSelect: "none",
  WebkitUserSelect: "none",
  caretColor: "transparent",
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("YouNeon error boundary:", error, info.componentStack);
  }

  handleSignIn = (e?: { preventDefault?: () => void }) => {
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
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="youneon-static-login"
          aria-label="Sign in with Pi Network"
          data-youneon-signin="1"
          style={overlayStyle}
          ref={(el) => applyPiSigninNativeAttrs(el)}
          onPointerDown={this.handleSignIn}
          onMouseDown={this.handleSignIn}
          onTouchStart={this.handleSignIn}
          onClick={this.handleSignIn}
        >
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              margin: "0 0 1.25rem",
              color: "#e9d5ff",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            YouNeon
          </h1>
          <div
            style={{ pointerEvents: "auto", userSelect: "none" }}
            dangerouslySetInnerHTML={{
              __html: piSigninControlsHtml("youneon-signin-btn-error"),
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
