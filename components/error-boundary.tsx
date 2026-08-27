"use client";

import React from "react";
import { bindPiSigninButtonIn } from "@/lib/pi-signin-onclick";
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
  cursor: "default",
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

  bindHost = (el: HTMLDivElement | null) => {
    const btn = bindPiSigninButtonIn(el);
    if (!btn || btn.getAttribute("data-youneon-extra-bound") === "1") return;
    btn.setAttribute("data-youneon-extra-bound", "1");
    const run = () => {
      this.handleSignIn();
    };
    btn.addEventListener("pointerdown", run);
    btn.addEventListener("mousedown", run);
    btn.addEventListener("touchstart", run);
    btn.addEventListener("click", run);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="youneon-static-login"
          aria-label="YouNeon"
          data-youneon-login-v="login-wordmark-img-1"
          style={overlayStyle}
          ref={this.bindHost}
          dangerouslySetInnerHTML={{
            __html: piWelcomeInnerHtml("youneon-signin-btn-error", "ynerror") + youneonWelcomeLegalHtml(),
          }}
        />
      );
    }

    return this.props.children;
  }
}
