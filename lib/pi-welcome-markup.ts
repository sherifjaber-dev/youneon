import { piSigninControlsHtml, piSigninStatusHtml } from "@/lib/pi-signin-onclick";

const NONE =
  "pointer-events:none;user-select:none;-webkit-user-select:none;cursor:default";

/** First-paint overlay: dark Studio-safe canvas. Auth handlers stay on the Sign in button. */
export const PI_WELCOME_OVERLAY_STYLE =
  "position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#070010;color:#ffffff;padding:48px 16px;text-align:center;font-family:system-ui,-apple-system,Segoe UI,sans-serif;min-height:100%;box-sizing:border-box;pointer-events:auto;cursor:default;touch-action:manipulation;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;caret-color:transparent";

const INNER_STYLE =
  "position:relative;z-index:2;width:100%;max-width:400px;display:flex;flex-direction:column;align-items:center;box-sizing:border-box;" +
  NONE;

const WORDMARK_WRAP_STYLE =
  "margin:0 0 8px;padding:0;line-height:0;width:100%;display:flex;justify-content:center;align-items:center;background:transparent;" +
  NONE;

const WORDMARK_IMG_STYLE =
  "display:block;width:min(80vw,280px);max-width:280px;height:auto;margin:0;background:transparent;mix-blend-mode:screen;-webkit-mix-blend-mode:screen;object-fit:contain;" +
  NONE;

const HERO_STYLE =
  "display:block;width:min(72vw,268px);height:auto;margin:10px 0 18px;object-fit:contain;" +
  NONE;

const TAG_STYLE =
  "font-size:15px;line-height:1.4;font-weight:500;color:#8b8494;margin:0 0 22px;" +
  NONE;

const HINT_STYLE =
  "font-size:12px;line-height:1.45;font-weight:500;color:#5c5666;margin:0;" +
  NONE;

const BUTTON_WRAP =
  "pointer-events:auto;user-select:none;-webkit-user-select:none;width:100%;display:flex;justify-content:center";

/** In-flow block under Sign in — never absolute/fixed to the overlay bottom. */
const FOOTER_STYLE =
  "position:relative;z-index:2;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:10px;margin:12px 0 0;flex-shrink:0;box-sizing:border-box;" +
  NONE;

/** stopPropagation only — never preventDefault (Pi needs the user gesture on the button). */
const LEGAL_STOP =
  'onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';

const LEGAL_WRAP =
  "position:relative;display:flex;align-items:center;justify-content:center;gap:6px;margin:0;flex-shrink:0;pointer-events:auto;user-select:none;-webkit-user-select:none";

const LEGAL_LINK =
  "color:#E03596;font-size:14px;font-weight:600;text-decoration:none;pointer-events:auto;cursor:pointer;font-family:system-ui,-apple-system,Segoe UI,sans-serif";

const LEGAL_AMP =
  "color:#E03596;font-size:14px;font-weight:600;pointer-events:none;font-family:system-ui,-apple-system,Segoe UI,sans-serif";

export function youneonWelcomeHeroHtml(_idPrefix: string): string {
  return (
    '<img class="youneon-welcome-hero" src="/default-avatar.png" alt="" width="512" height="512" decoding="async" style="' +
    HERO_STYLE +
    '" />'
  );
}

export function youneonWelcomeWordmarkHtml(): string {
  return (
    '<h1 class="youneon-welcome-wordmark-wrap" style="' +
    WORDMARK_WRAP_STYLE +
    '"><img class="youneon-welcome-wordmark" src="/youneon-login-logo.png" alt="YouNeon" width="560" height="274" decoding="async" style="' +
    WORDMARK_IMG_STYLE +
    '" /></h1>'
  );
}

export function youneonWelcomeLegalHtml(): string {
  return (
    '<div class="youneon-welcome-legal" data-youneon-legal="1" style="' +
    LEGAL_WRAP +
    '">' +
    '<a href="/terms" ' +
    LEGAL_STOP +
    ' style="' +
    LEGAL_LINK +
    '">Terms</a>' +
    '<span style="' +
    LEGAL_AMP +
    '">&amp;</span>' +
    '<a href="/privacy" ' +
    LEGAL_STOP +
    ' style="' +
    LEGAL_LINK +
    '">Privacy</a>' +
    "</div>"
  );
}

export function youneonWelcomeFooterHtml(): string {
  return (
    '<div class="youneon-welcome-footer" data-youneon-login-footer="1" style="' +
    FOOTER_STYLE +
    '">' +
    '<p class="youneon-welcome-hint" style="' +
    HINT_STYLE +
    '">You need a Pi account to enter.</p>' +
    youneonWelcomeLegalHtml() +
    "</div>"
  );
}

export function piWelcomeInnerHtml(buttonId: string, idPrefix: string): string {
  return (
    '<div class="youneon-welcome-card" style="' +
    INNER_STYLE +
    '">' +
    youneonWelcomeWordmarkHtml() +
    youneonWelcomeHeroHtml(idPrefix) +
    '<p style="' +
    TAG_STYLE +
    '">Meet in the glow.</p>' +
    '<div style="' +
    BUTTON_WRAP +
    '">' +
    piSigninControlsHtml(buttonId) +
    "</div>" +
    youneonWelcomeFooterHtml() +
    piSigninStatusHtml() +
    "</div>"
  );
}

export function piWelcomeOverlayHtml(opts: {
  overlayId?: string;
  buttonId: string;
}): string {
  const idAttr = opts.overlayId
    ? ' id="' + opts.overlayId.replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '"'
    : "";
  const prefix = (opts.overlayId || opts.buttonId || "yn").replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    '<div class="youneon-static-login"' +
    idAttr +
    ' aria-label="YouNeon" data-youneon-login-v="login-footer-flow-1" style="' +
    PI_WELCOME_OVERLAY_STYLE +
    '">' +
    piWelcomeInnerHtml(opts.buttonId, prefix) +
    "</div>"
  );
}
