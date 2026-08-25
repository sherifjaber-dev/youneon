import { piSigninControlsHtml, piSigninStatusHtml } from "@/lib/pi-signin-onclick";

const NONE =
  "pointer-events:none;user-select:none;-webkit-user-select:none;cursor:pointer";

export const PI_WELCOME_OVERLAY_STYLE =
  "position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#0f0117;color:#ffffff;padding:20px 16px;text-align:center;font-family:system-ui,-apple-system,Segoe UI,sans-serif;min-height:100%;box-sizing:border-box;pointer-events:auto;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:rgba(168,85,247,0.35);caret-color:transparent";

const CARD_STYLE =
  "position:relative;z-index:2;width:100%;max-width:380px;padding:26px 22px 22px;border-radius:28px;background-color:#fff8ff;background-image:linear-gradient(180deg,#fff8ff 0%,#f6edff 52%,#fde8f4 100%);box-shadow:0 28px 70px rgba(88,28,135,0.45),0 0 0 1px rgba(236,72,153,0.18);box-sizing:border-box;" +
  NONE;

const LOGO_ROW =
  "display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 14px;" + NONE;

const WORDMARK_STYLE =
  "font-size:1.7rem;font-weight:800;letter-spacing:-0.03em;line-height:1;margin:0;color:#6b21a8;font-family:system-ui,-apple-system,Segoe UI,sans-serif;" +
  NONE;

const LIVE_STYLE =
  "display:inline-flex;align-items:center;gap:6px;margin:6px 0 0;padding:3px 10px;border-radius:999px;background-color:#fdf2f8;color:#9d174d;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;" +
  NONE;

const TITLE_STYLE =
  "font-size:1.15rem;font-weight:700;letter-spacing:-0.02em;margin:14px 0 6px;color:#3b0764;font-family:system-ui,-apple-system,Segoe UI,sans-serif;" +
  NONE;

const SUB_STYLE =
  "font-size:14px;line-height:1.45;color:#6b21a8;margin:0 0 18px;max-width:320px;margin-left:auto;margin-right:auto;" +
  NONE;

const HINT_STYLE =
  "font-size:0.8125rem;color:#7e22ce;margin:12px 0 0;max-width:320px;margin-left:auto;margin-right:auto;" +
  NONE;

const GLOW_A =
  "position:absolute;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(168,85,247,0.4) 0%,rgba(15,1,23,0) 70%);top:-40px;left:-30px;z-index:0;" +
  NONE;

const GLOW_B =
  "position:absolute;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(236,72,153,0.32) 0%,rgba(15,1,23,0) 70%);bottom:-50px;right:-40px;z-index:0;" +
  NONE;

/** YouNeon mark — rounded tile with two video faces. */
export function youneonLogoSvg(idPrefix: string): string {
  const a = idPrefix + "-lg";
  const b = idPrefix + "-lp";
  return (
    '<svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true" style="' +
    NONE +
    '">' +
    "<defs>" +
    '<linearGradient id="' +
    a +
    '" x1="6" y1="4" x2="48" y2="48">' +
    '<stop offset="0%" stop-color="#c084fc"/>' +
    '<stop offset="55%" stop-color="#a855f7"/>' +
    '<stop offset="100%" stop-color="#ec4899"/>' +
    "</linearGradient>" +
    '<linearGradient id="' +
    b +
    '" x1="12" y1="10" x2="40" y2="42">' +
    '<stop offset="0%" stop-color="#fdf4ff"/>' +
    '<stop offset="100%" stop-color="#f5d0fe"/>' +
    "</linearGradient>" +
    "</defs>" +
    '<rect width="52" height="52" rx="16" fill="url(#' +
    a +
    ')"/>' +
    '<rect x="8" y="11" width="22" height="28" rx="6" fill="url(#' +
    b +
    ')" fill-opacity="0.95"/>' +
    '<rect x="22" y="15" width="22" height="26" rx="6" fill="#fff" fill-opacity="0.92"/>' +
    '<circle cx="19" cy="22" r="4.2" fill="#7c3aed"/>' +
    '<path d="M12.5 33.5c1.2-4 3.8-6 6.5-6s5.3 2 6.5 6" fill="#7c3aed"/>' +
    '<circle cx="33" cy="25" r="4.2" fill="#db2777"/>' +
    '<path d="M26.8 35.8c1.2-3.8 3.7-5.6 6.2-5.6s5 1.8 6.2 5.6" fill="#db2777"/>' +
    '<circle cx="26" cy="10" r="3" fill="#f0abfc"/>' +
    "</svg>"
  );
}

/** Original illustration: two people on a live video call. Not copied from Azar. */
export function youneonVideoChatArtSvg(idPrefix: string): string {
  const g = idPrefix + "-ag";
  const s = idPrefix + "-as";
  const fl = idPrefix + "-fl";
  const fr = idPrefix + "-fr";
  return (
    '<svg viewBox="0 0 320 168" width="100%" height="168" fill="none" aria-hidden="true" style="display:block;margin:0 auto 4px;max-width:320px;' +
    NONE +
    '">' +
    "<defs>" +
    '<linearGradient id="' +
    g +
    '" x1="20" y1="10" x2="300" y2="160">' +
    '<stop offset="0%" stop-color="#f5d0fe"/>' +
    '<stop offset="100%" stop-color="#fbcfe8"/>' +
    "</linearGradient>" +
    '<linearGradient id="' +
    s +
    '" x1="40" y1="30" x2="280" y2="140">' +
    '<stop offset="0%" stop-color="#c084fc"/>' +
    '<stop offset="100%" stop-color="#ec4899"/>' +
    "</linearGradient>" +
    '<linearGradient id="' +
    fl +
    '" x1="48" y1="40" x2="140" y2="150">' +
    '<stop offset="0%" stop-color="#ddd6fe"/>' +
    '<stop offset="100%" stop-color="#a78bfa"/>' +
    "</linearGradient>" +
    '<linearGradient id="' +
    fr +
    '" x1="180" y1="40" x2="280" y2="150">' +
    '<stop offset="0%" stop-color="#fbcfe8"/>' +
    '<stop offset="100%" stop-color="#f472b6"/>' +
    "</linearGradient>" +
    "</defs>" +
    '<rect x="8" y="8" width="304" height="152" rx="24" fill="url(#' +
    g +
    ')"/>' +
    '<path d="M108 92c18-20 86-20 104 0" stroke="url(#' +
    s +
    ')" stroke-width="2" stroke-linecap="round" opacity="0.55"/>' +
    '<path d="M118 104c14 12 70 12 84 0" stroke="url(#' +
    s +
    ')" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>' +
    // left phone
    '<rect x="28" y="28" width="92" height="118" rx="16" fill="#2e1065" stroke="url(#' +
    s +
    ')" stroke-width="2"/>' +
    '<rect x="34" y="38" width="80" height="88" rx="10" fill="url(#' +
    fl +
    ')"/>' +
    '<circle cx="74" cy="72" r="16" fill="#efe4ff"/>' +
    '<circle cx="74" cy="70" r="11" fill="#7c3aed"/>' +
    '<path d="M54 112c4-14 12-22 20-22s16 8 20 22" fill="#5b21b6"/>' +
    '<rect x="42" y="132" width="64" height="6" rx="3" fill="#c084fc" opacity="0.7"/>' +
    '<rect x="40" y="32" width="28" height="10" rx="5" fill="#ef4444"/>' +
    '<circle cx="47" cy="37" r="2.2" fill="#fff"/>' +
    // right phone
    '<rect x="200" y="22" width="92" height="118" rx="16" fill="#4a044e" stroke="url(#' +
    s +
    ')" stroke-width="2"/>' +
    '<rect x="206" y="32" width="80" height="88" rx="10" fill="url(#' +
    fr +
    ')"/>' +
    '<circle cx="246" cy="66" r="16" fill="#ffe4f1"/>' +
    '<circle cx="246" cy="64" r="11" fill="#db2777"/>' +
    '<path d="M226 106c4-14 12-22 20-22s16 8 20 22" fill="#9d174d"/>' +
    '<rect x="214" y="126" width="64" height="6" rx="3" fill="#f9a8d4" opacity="0.75"/>' +
    '<rect x="212" y="26" width="28" height="10" rx="5" fill="#ef4444"/>' +
    '<circle cx="219" cy="31" r="2.2" fill="#fff"/>' +
    // center spark
    '<path d="M160 58l8 14-8 14-8-14z" fill="#f0abfc"/>' +
    '<circle cx="160" cy="72" r="3" fill="#fff"/>' +
    "</svg>"
  );
}

export function piWelcomeInnerHtml(buttonId: string, idPrefix: string): string {
  return (
    '<div class="youneon-welcome-card" style="' +
    CARD_STYLE +
    '">' +
    '<div style="' +
    LOGO_ROW +
    '">' +
    youneonLogoSvg(idPrefix) +
    '<div style="' +
    NONE +
    ';text-align:left">' +
    '<h1 style="' +
    WORDMARK_STYLE +
    '">YouNeon</h1>' +
    '<span class="youneon-live-pill" style="' +
    LIVE_STYLE +
    '"><span class="youneon-live-dot" style="width:7px;height:7px;border-radius:50%;background:#ef4444;display:inline-block"></span>LIVE video chat</span>' +
    "</div></div>" +
    youneonVideoChatArtSvg(idPrefix) +
    '<p style="' +
    TITLE_STYLE +
    '">Random video chat with the Pi community</p>' +
    '<p style="' +
    SUB_STYLE +
    '">Meet people on Pi Network in live 1:1 video. Sign in to start matching.</p>' +
    '<div style="pointer-events:auto;user-select:none;-webkit-user-select:none;width:100%;display:flex;justify-content:center">' +
    piSigninControlsHtml(buttonId) +
    "</div>" +
    '<p style="' +
    HINT_STYLE +
    '">Tap anywhere to sign in with Pi Network</p>' +
    piSigninStatusHtml() +
    "</div>"
  );
}

export function piWelcomeOverlayHtml(opts: {
  overlayId?: string;
  buttonId: string;
  nativeAttrs: string;
}): string {
  const idAttr = opts.overlayId
    ? ' id="' + opts.overlayId.replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '"'
    : "";
  const prefix = (opts.overlayId || opts.buttonId || "yn").replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    '<div class="youneon-static-login"' +
    idAttr +
    ' aria-label="Sign in with Pi Network" data-youneon-signin="1" style="' +
    PI_WELCOME_OVERLAY_STYLE +
    '" ' +
    opts.nativeAttrs +
    ">" +
    '<div style="' +
    GLOW_A +
    '"></div>' +
    '<div style="' +
    GLOW_B +
    '"></div>' +
    piWelcomeInnerHtml(opts.buttonId, prefix) +
    "</div>"
  );
}
