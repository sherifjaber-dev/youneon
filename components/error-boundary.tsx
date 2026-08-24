"use client";

import React from "react";
import { PI_SIGNIN_ONCLICK } from "@/lib/pi-signin-onclick";

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

  render() {
    if (this.state.hasError) {
      return (
        <div className="youneon-static-login" style={overlayStyle}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              margin: "0 0 1.25rem",
              color: "#e9d5ff",
            }}
          >
            YouNeon
          </h1>
          <div
            dangerouslySetInnerHTML={{
              __html:
                '<button type="button" class="youneon-signin-btn" data-youneon-signin="1" style="padding:16px 32px;font-size:1.125rem;font-weight:700;border:0;border-radius:16px;color:#ffffff;background-color:#a855f7;cursor:pointer;width:100%;max-width:320px;pointer-events:auto;position:relative;z-index:2147483647" onclick="' +
                PI_SIGNIN_ONCLICK +
                '">Sign in with Pi Network</button>',
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
