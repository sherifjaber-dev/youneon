import { piSigninControlsHtml, piSigninStatusHtml } from "@/lib/pi-signin-onclick";

const NONE =
  "pointer-events:none;user-select:none;-webkit-user-select:none;cursor:pointer";

export const PI_WELCOME_OVERLAY_STYLE =
  "position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#0f0117;color:#ffffff;padding:20px 16px;text-align:center;font-family:system-ui,-apple-system,Segoe UI,sans-serif;min-height:100%;box-sizing:border-box;pointer-events:auto;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:rgba(168,85,247,0.35);caret-color:transparent";

const CARD_STYLE =
  "position:relative;z-index:2;width:100%;max-width:400px;padding:0 0 22px;border-radius:28px;overflow:hidden;background-color:#ffffff;background-image:linear-gradient(180deg,#ffffff 0%,#faf7ff 100%);box-shadow:0 36px 80px rgba(8,0,18,0.58),0 0 0 1px rgba(255,255,255,0.1);box-sizing:border-box;" +
  NONE;

const HERO_WRAP =
  "position:relative;width:100%;height:0;padding-bottom:56.25%;overflow:hidden;background-color:#14021c;" +
  NONE;

const HERO_MEDIA =
  "position:absolute;top:0;left:0;width:100%;height:100%;display:block;object-fit:cover;" +
  NONE;

const BODY_STYLE = "padding:18px 22px 0;box-sizing:border-box;" + NONE;

const LOGO_ROW =
  "display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 12px;" + NONE;

const WORDMARK_STYLE =
  "font-size:1.85rem;font-weight:800;letter-spacing:-0.04em;line-height:1;margin:0;color:#1a0b2e;font-family:system-ui,-apple-system,Segoe UI,sans-serif;" +
  NONE;

const TAG_STYLE =
  "font-size:15px;line-height:1.4;font-weight:500;color:#52525b;margin:0 0 20px;max-width:300px;margin-left:auto;margin-right:auto;" +
  NONE;

const GLOW_A =
  "position:absolute;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(168,85,247,0.26) 0%,rgba(15,1,23,0) 70%);top:-70px;left:-40px;z-index:0;" +
  NONE;

const GLOW_B =
  "position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(236,72,153,0.2) 0%,rgba(15,1,23,0) 72%);bottom:-90px;right:-50px;z-index:0;" +
  NONE;

/** YouNeon mark — rounded tile with two video faces. */
export function youneonLogoSvg(idPrefix: string): string {
  const a = idPrefix + "-lg";
  const b = idPrefix + "-lp";
  const c = idPrefix + "-lr";
  return (
    '<svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true" style="' +
    NONE +
    '">' +
    "<defs>" +
    '<linearGradient id="' +
    a +
    '" x1="6" y1="4" x2="66" y2="68">' +
    '<stop offset="0%" stop-color="#d8b4fe"/>' +
    '<stop offset="52%" stop-color="#a855f7"/>' +
    '<stop offset="100%" stop-color="#db2777"/>' +
    "</linearGradient>" +
    '<linearGradient id="' +
    b +
    '" x1="16" y1="14" x2="36" y2="54">' +
    '<stop offset="0%" stop-color="#fdf4ff"/>' +
    '<stop offset="100%" stop-color="#ddd6fe"/>' +
    "</linearGradient>" +
    '<linearGradient id="' +
    c +
    '" x1="34" y1="20" x2="58" y2="58">' +
    '<stop offset="0%" stop-color="#fff1f7"/>' +
    '<stop offset="100%" stop-color="#fbcfe8"/>' +
    "</linearGradient>" +
    "</defs>" +
    '<rect width="72" height="72" rx="20" fill="url(#' +
    a +
    ')"/>' +
    '<rect x="11" y="16" width="28" height="40" rx="8" fill="url(#' +
    b +
    ')"/>' +
    '<rect x="32" y="20" width="28" height="38" rx="8" fill="url(#' +
    c +
    ')"/>' +
    '<circle cx="25" cy="31" r="6" fill="#7c3aed"/>' +
    '<path d="M16 50c2.4-8.5 5.6-12.5 9-12.5s6.6 4 9 12.5" fill="#5b21b6"/>' +
    '<circle cx="46" cy="35" r="6" fill="#db2777"/>' +
    '<path d="M37 52.5c2.4-7.8 5.6-11.5 9-11.5s6.6 3.7 9 11.5" fill="#9d174d"/>' +
    '<circle cx="36" cy="13" r="4" fill="#f5d0fe"/>' +
    "</svg>"
  );
}

/** Original 16:9 illustration — live tiles + globe. Fallback if the hero photo fails. */
export function youneonVideoChatArtSvg(idPrefix: string): string {
  const bg = idPrefix + "-bg";
  const neon = idPrefix + "-neon";
  const tileL = idPrefix + "-tl";
  const tileC = idPrefix + "-tc";
  const tileR = idPrefix + "-tr";
  return (
    '<svg viewBox="0 0 360 202" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true" style="display:none;position:absolute;top:0;left:0;width:100%;height:100%;' +
    NONE +
    '">' +
    "<defs>" +
    '<linearGradient id="' +
    bg +
    '" x1="0" y1="0" x2="360" y2="202">' +
    '<stop offset="0%" stop-color="#1a0530"/>' +
    '<stop offset="100%" stop-color="#0f0117"/>' +
    "</linearGradient>" +
    '<linearGradient id="' +
    neon +
    '" x1="40" y1="20" x2="320" y2="180">' +
    '<stop offset="0%" stop-color="#c084fc"/>' +
    '<stop offset="100%" stop-color="#f472b6"/>' +
    "</linearGradient>" +
    '<linearGradient id="' +
    tileL +
    '" x1="30" y1="40" x2="130" y2="160">' +
    '<stop offset="0%" stop-color="#ede9fe"/>' +
    '<stop offset="100%" stop-color="#a78bfa"/>' +
    "</linearGradient>" +
    '<linearGradient id="' +
    tileC +
    '" x1="130" y1="20" x2="250" y2="180">' +
    '<stop offset="0%" stop-color="#c4b5fd"/>' +
    '<stop offset="100%" stop-color="#7c3aed"/>' +
    "</linearGradient>" +
    '<linearGradient id="' +
    tileR +
    '" x1="240" y1="80" x2="330" y2="180">' +
    '<stop offset="0%" stop-color="#fbcfe8"/>' +
    '<stop offset="100%" stop-color="#f472b6"/>' +
    "</linearGradient>" +
    "</defs>" +
    '<rect width="360" height="202" fill="url(#' +
    bg +
    ')"/>' +
    '<ellipse cx="180" cy="118" rx="92" ry="92" fill="none" stroke="url(#' +
    neon +
    ')" stroke-width="1.2" opacity="0.35"/>' +
    '<ellipse cx="180" cy="118" rx="92" ry="34" fill="none" stroke="#c084fc" stroke-width="0.8" opacity="0.28"/>' +
    '<ellipse cx="180" cy="118" rx="40" ry="92" fill="none" stroke="#f0abfc" stroke-width="0.8" opacity="0.22"/>' +
    '<circle cx="180" cy="118" r="3" fill="#f5d0fe"/>' +
    '<path d="M118 96c22-18 102-18 124 0" stroke="url(#' +
    neon +
    ')" stroke-width="1.6" stroke-linecap="round" opacity="0.45"/>' +
    '<rect x="24" y="38" width="112" height="136" rx="18" fill="#241038" stroke="url(#' +
    neon +
    ')" stroke-width="1.8"/>' +
    '<rect x="32" y="50" width="96" height="108" rx="12" fill="url(#' +
    tileL +
    ')"/>' +
    '<circle cx="80" cy="90" r="16" fill="#f5f3ff"/>' +
    '<circle cx="80" cy="88" r="11" fill="#7c3aed"/>' +
    '<path d="M58 142c5-18 13-26 22-26s17 8 22 26" fill="#5b21b6"/>' +
    '<rect x="36" y="44" width="34" height="12" rx="6" fill="#ef4444"/>' +
    '<circle cx="44" cy="50" r="2.4" fill="#fff"/>' +
    '<rect x="118" y="22" width="128" height="154" rx="20" fill="#2a1048" stroke="url(#' +
    neon +
    ')" stroke-width="2"/>' +
    '<rect x="126" y="34" width="112" height="122" rx="14" fill="url(#' +
    tileC +
    ')"/>' +
    '<circle cx="182" cy="82" r="18" fill="#ede9fe"/>' +
    '<circle cx="182" cy="80" r="12.5" fill="#4c1d95"/>' +
    '<path d="M154 140c6-20 16-30 28-30s22 10 28 30" fill="#3b0764"/>' +
    '<rect x="132" y="28" width="34" height="12" rx="6" fill="#ef4444"/>' +
    '<circle cx="140" cy="34" r="2.4" fill="#fff"/>' +
    '<circle cx="166" cy="146" r="8" fill="rgba(15,1,23,0.35)"/>' +
    '<circle cx="186" cy="146" r="8" fill="rgba(15,1,23,0.35)"/>' +
    '<rect x="236" y="86" width="100" height="92" rx="16" fill="#3b0a2e" stroke="url(#' +
    neon +
    ')" stroke-width="1.6"/>' +
    '<rect x="243" y="96" width="86" height="72" rx="10" fill="url(#' +
    tileR +
    ')"/>' +
    '<circle cx="286" cy="122" r="12" fill="#ffe4f1"/>' +
    '<circle cx="286" cy="120" r="8.5" fill="#db2777"/>' +
    '<path d="M268 156c3-12 8-18 18-18s15 6 18 18" fill="#9d174d"/>' +
    "</svg>"
  );
}

export function youneonWelcomeHeroHtml(idPrefix: string): string {
  return (
    '<div class="youneon-welcome-hero" style="' +
    HERO_WRAP +
    '">' +
    '<img src="/youneon-welcome-hero.jpg" alt="" width="1280" height="720" decoding="async" style="' +
    HERO_MEDIA +
    "\" onerror=\"this.style.display='none';var s=this.nextSibling;if(s&&s.style)s.style.display='block'\"" +
    " />" +
    youneonVideoChatArtSvg(idPrefix) +
    "</div>"
  );
}

export function piWelcomeInnerHtml(buttonId: string, idPrefix: string): string {
  return (
    '<div class="youneon-welcome-card" style="' +
    CARD_STYLE +
    '">' +
    youneonWelcomeHeroHtml(idPrefix) +
    '<div style="' +
    BODY_STYLE +
    '">' +
    '<div style="' +
    LOGO_ROW +
    '">' +
    youneonLogoSvg(idPrefix) +
    '<h1 style="' +
    WORDMARK_STYLE +
    '">YouNeon</h1>' +
    "</div>" +
    '<p style="' +
    TAG_STYLE +
    '">Random video chat with the Pi community</p>' +
    '<div style="pointer-events:auto;user-select:none;-webkit-user-select:none;width:100%;display:flex;justify-content:center">' +
    piSigninControlsHtml(buttonId) +
    "</div>" +
    piSigninStatusHtml() +
    "</div></div>"
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
