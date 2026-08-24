"use client";

interface LoginScreenProps {
  onLogin: () => void;
  isLoggingIn?: boolean;
  errorMessage?: string | null;
  piAvailable?: boolean;
  onGuest?: () => void;
}

export function LoginScreen({
  onLogin,
  isLoggingIn = false,
  errorMessage,
  piAvailable = true,
  onGuest,
}: LoginScreenProps) {
  const showPiBrowserHint = !piAvailable;
  const showError = Boolean(errorMessage) && (piAvailable || !errorMessage?.includes("Pi Browser"));

  const handleSignIn = () => {
    if (typeof window.__youneonPiAuth === "function") {
      void window.__youneonPiAuth(true);
    }
    onLogin();
  };

  return (
    <div
      className="youneon-static-login"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f0117",
        minHeight: "100%",
        padding: 16,
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", width: "100%", maxWidth: 384 }}>
        <h1
          style={{
            fontSize: "2.25rem",
            fontWeight: 800,
            margin: "0 0 0.75rem",
            color: "#e9d5ff",
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          }}
        >
          YouNeon
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", margin: "0 0 1.5rem" }}>
          Meet the Pi Network – Live video chat with real people
        </p>

        {showPiBrowserHint && (
          <p style={{ color: "#fde68a", fontSize: 12, margin: "0 0 1rem", lineHeight: 1.5 }}>
            Pi authentication only works inside the Pi Browser. Open YouNeon in Pi Browser, then tap
            Sign in with Pi Network.
          </p>
        )}

        {showError && (
          <p style={{ color: "#fecaca", fontSize: 12, margin: "0 0 1rem", lineHeight: 1.5 }}>{errorMessage}</p>
        )}

        {isLoggingIn && (
          <p style={{ color: "#e9d5ff", fontSize: 12, margin: "0 0 0.75rem" }}>Connecting to Pi Network…</p>
        )}

        <button
          type="button"
          data-youneon-signin="1"
          onClick={handleSignIn}
          style={{
            position: "relative",
            zIndex: 20,
            width: "100%",
            padding: "16px 24px",
            fontSize: "1.125rem",
            fontWeight: 700,
            borderRadius: 16,
            color: "#ffffff",
            backgroundColor: "#a855f7",
            backgroundImage: "linear-gradient(to right, #a855f7, #ec4899)",
            border: 0,
            cursor: "pointer",
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          }}
        >
          Sign in with Pi Network
        </button>

        {onGuest && (
          <button
            type="button"
            onClick={onGuest}
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
            }}
          >
            Continue as guest (demo)
          </button>
        )}

        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 24 }}>
          Secure • Instant • Powered by Pi Network
        </p>
      </div>
    </div>
  );
}
