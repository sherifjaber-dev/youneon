"use client";

import React from "react";
import { applyPiSigninNativeAttrs } from "@/lib/pi-signin-onclick";
import { piWelcomeInnerHtml, youneonWelcomeLegalHtml } from "@/lib/pi-welcome-markup";
import { tapPiAuthenticate } from "@/lib/pi-sdk";

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
  backgroundColor: "#070010",
  color: "#ffffff",
  padding: "48px 16px 72px",
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

  handleSignIn = () => {
    tapPiAuthenticate();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="youneon-static-login"
          aria-label="Sign in with Pi Network"
          data-youneon-signin="1"
          data-youneon-login-v="neon-faces-2"
          style={overlayStyle}
          ref={(el) => applyPiSigninNativeAttrs(el)}
          onPointerDown={this.handleSignIn}
          onMouseDown={this.handleSignIn}
          onTouchStart={this.handleSignIn}
          onClick={this.handleSignIn}
          dangerouslySetInnerHTML={{
            __html: piWelcomeInnerHtml("youneon-signin-btn-error", "ynerror") + youneonWelcomeLegalHtml(),
          }}
        />
      );
    }

    return this.props.children;
  }
}
