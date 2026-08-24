import {
  PI_SIGNIN_NATIVE_ATTRS,
  escapePiSigninAttr,
  piSigninControlsHtml,
} from "@/lib/pi-signin-onclick";

/**
 * Server-rendered Pi login as raw HTML. React strips string `on*` handlers on JSX
 * and can hydrate a <button> into a text-selectable div/span — so the overlay and
 * controls are injected with dangerouslySetInnerHTML and never re-rendered as JSX.
 * The entire overlay is the hit target (click/tap anywhere = Pi.authenticate).
 */
const OVERLAY_STYLE =
  "position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#0f0117;color:#ffffff;padding:16px;text-align:center;font-family:system-ui,-apple-system,Segoe UI,sans-serif;min-height:100%;box-sizing:border-box;pointer-events:auto;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:rgba(168,85,247,0.5);caret-color:transparent";

const TITLE_STYLE =
  "font-size:2rem;font-weight:800;margin:0 0 1.25rem;color:#e9d5ff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;pointer-events:none;user-select:none;-webkit-user-select:none;cursor:pointer;caret-color:transparent";

const HINT_STYLE =
  "font-size:0.875rem;color:rgba(255,255,255,0.75);margin:12px 0 0;max-width:320px;pointer-events:none;user-select:none;-webkit-user-select:none;cursor:pointer";

export function StaticPiLogin({
  buttonId = "youneon-signin-btn",
  overlayId,
}: {
  buttonId?: string;
  overlayId?: string;
}) {
  const idAttr = overlayId ? ' id="' + escapePiSigninAttr(overlayId) + '"' : "";
  const html =
    '<div class="youneon-static-login"' +
    idAttr +
    ' aria-label="Sign in with Pi Network" data-youneon-signin="1" style="' +
    OVERLAY_STYLE +
    '" ' +
    PI_SIGNIN_NATIVE_ATTRS +
    ">" +
    '<h1 style="' +
    TITLE_STYLE +
    '">YouNeon</h1>' +
    piSigninControlsHtml(buttonId) +
    '<p style="' +
    HINT_STYLE +
    '">Tap anywhere to sign in</p>' +
    "</div>";

  return (
    <div
      data-youneon-login-host="1"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
