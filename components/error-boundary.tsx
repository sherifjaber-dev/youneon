"use client";

import React from "react";

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
  zIndex: 2147483000,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#0f0117",
  color: "#ffffff",
  padding: 16,
  textAlign: "center",
  fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
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
          <button
            type="button"
            data-youneon-signin="1"
            style={{
              padding: "16px 32px",
              fontSize: "1.125rem",
              fontWeight: 700,
              border: 0,
              borderRadius: 16,
              color: "#ffffff",
              backgroundColor: "#a855f7",
              cursor: "pointer",
              width: "100%",
              maxWidth: 320,
            }}
          >
            Sign in with Pi Network
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
