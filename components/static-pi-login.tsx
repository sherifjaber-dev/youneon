import { PI_SIGNIN_ONCLICK } from "@/lib/pi-signin-onclick";

/**
 * Server-rendered Pi login as raw HTML. React strips string `onclick` handlers,
 * so the button is injected with dangerouslySetInnerHTML — a real HTML attribute
 * that immediately calls window.Pi.authenticate in the App Studio iframe.
 */
const OVERLAY_STYLE =
  "position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#0f0117;color:#ffffff;padding:16px;text-align:center;font-family:system-ui,-apple-system,Segoe UI,sans-serif;min-height:100%;box-sizing:border-box;pointer-events:auto";

const TITLE_STYLE =
  "font-size:2rem;font-weight:800;margin:0 0 1.25rem;color:#e9d5ff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;pointer-events:none";

const BUTTON_STYLE =
  "padding:16px 32px;font-size:1.125rem;font-weight:700;border:0;border-radius:16px;color:#ffffff;background-color:#a855f7;background-image:linear-gradient(to right,#a855f7,#ec4899);cursor:pointer;width:100%;max-width:320px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;pointer-events:auto;position:relative;z-index:2147483647;-webkit-tap-highlight-color:transparent";

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function StaticPiLogin({
  buttonId = "youneon-signin-btn",
  overlayId,
}: {
  buttonId?: string;
  overlayId?: string;
}) {
  const idAttr = overlayId ? ' id="' + escapeAttr(overlayId) + '"' : "";
  const html =
    '<div class="youneon-static-login"' +
    idAttr +
    ' style="' +
    OVERLAY_STYLE +
    '">' +
    '<h1 style="' +
    TITLE_STYLE +
    '">YouNeon</h1>' +
    '<button id="' +
    escapeAttr(buttonId) +
    '" type="button" class="youneon-signin-btn" data-youneon-signin="1" style="' +
    BUTTON_STYLE +
    '" onclick="' +
    PI_SIGNIN_ONCLICK +
    '">Sign in with Pi Network</button>' +
    "</div>";

  return <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
