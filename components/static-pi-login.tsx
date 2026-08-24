import type { CSSProperties } from "react";

/**
 * Server-rendered Pi login. Inline styles only — no Tailwind, no custom fonts.
 * Must stay in the HTML until window.__PI_AUTH_OK / authenticated session.
 */
const BG = "#0f0117";

const overlayStyle: CSSProperties = {
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
  backgroundColor: BG,
  color: "#ffffff",
  padding: 16,
  textAlign: "center",
  fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
  minHeight: "100%",
  boxSizing: "border-box",
};

const titleStyle: CSSProperties = {
  fontSize: "2rem",
  fontWeight: 800,
  margin: "0 0 1.25rem",
  color: "#e9d5ff",
  fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
};

const buttonStyle: CSSProperties = {
  padding: "16px 32px",
  fontSize: "1.125rem",
  fontWeight: 700,
  border: 0,
  borderRadius: 16,
  color: "#ffffff",
  backgroundColor: "#a855f7",
  backgroundImage: "linear-gradient(to right, #a855f7, #ec4899)",
  cursor: "pointer",
  width: "100%",
  maxWidth: 320,
  fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
};

export function StaticPiLogin({
  buttonId = "youneon-signin-btn",
  overlayId,
}: {
  buttonId?: string;
  overlayId?: string;
}) {
  return (
    <div className="youneon-static-login" id={overlayId} style={overlayStyle}>
      <h1 style={titleStyle}>YouNeon</h1>
      <button
        id={buttonId}
        type="button"
        data-youneon-signin="1"
        style={buttonStyle}
        {...{
          onclick: "window.__youneonPiAuth&&window.__youneonPiAuth(true)",
        }}
      >
        Sign in with Pi Network
      </button>
    </div>
  );
}
