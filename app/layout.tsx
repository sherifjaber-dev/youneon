import type React from "react";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { AppProviders } from "@/components/app-providers";
import { StaticPiLogin } from "@/components/static-pi-login";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://youneonwtce7005.pinet.com";

const CRITICAL_CSS =
  "html,body{background:#070010 !important;background-color:#070010 !important;color:#fff !important;margin:0;min-height:100%;height:100%;font-family:system-ui,-apple-system,Segoe UI,sans-serif}" +
  "html.youneon-signed-in,html.youneon-signed-in body{background:#05050d !important;background-color:#05050d !important;color:#1f1f23 !important}" +
  "html.youneon-legal,html.youneon-legal body{background:#F6F4F8 !important;background-color:#F6F4F8 !important;color:#1f1f23 !important}" +
  "@keyframes youneonLivePulse{0%,100%{opacity:1}50%{opacity:.4}}" +
  ".youneon-live-dot{animation:youneonLivePulse 1.4s ease-in-out infinite}" +
  "#youneon-static-login,.youneon-static-login,#youneon-static-login *,.youneon-static-login *{user-select:none !important;-webkit-user-select:none !important;-moz-user-select:none !important;-ms-user-select:none !important;-webkit-touch-callout:none !important;caret-color:transparent !important;cursor:pointer !important}" +
  "#youneon-static-login,.youneon-static-login{background:#070010;pointer-events:auto !important;z-index:2147483647 !important;position:fixed !important;top:0;right:0;bottom:0;left:0;cursor:pointer !important;touch-action:manipulation !important;-webkit-tap-highlight-color:rgba(194,24,117,0.5) !important}" +
  "#youneon-static-login h1,.youneon-static-login h1,#youneon-static-login p,.youneon-static-login p,.youneon-welcome-card,.youneon-welcome-card svg,.youneon-welcome-card img,.youneon-welcome-hero{pointer-events:none !important}" +
  ".youneon-welcome-legal,.youneon-welcome-legal a{pointer-events:auto !important;cursor:pointer !important}" +
  "#youneon-signin-btn,.youneon-signin-btn,button[data-youneon-signin],input[data-youneon-signin]{pointer-events:auto !important;position:relative !important;z-index:2147483647 !important;cursor:pointer !important;touch-action:manipulation !important;-webkit-tap-highlight-color:rgba(194,24,117,0.5) !important}" +
  "#youneon-app-tree{pointer-events:none;position:relative;z-index:0}" +
  "html.youneon-signed-in #youneon-static-login,html.youneon-signed-in .youneon-static-login,html.youneon-signed-in [data-youneon-login-host],html.youneon-signed-in [data-youneon-login-hidden='1'],html.youneon-legal #youneon-static-login,html.youneon-legal .youneon-static-login,html.youneon-legal [data-youneon-login-host],html.youneon-legal [data-youneon-login-hidden='1']{display:none !important;visibility:hidden !important;pointer-events:none !important;z-index:0 !important}" +
  "html.youneon-signed-in #youneon-app-tree,html.youneon-legal #youneon-app-tree{pointer-events:auto !important;z-index:1}";

/**
 * Vanilla ES5 boot script. No async/await, no arrow functions, no template
 * literals in the output — old Pi App Studio webviews throw on those.
 * Never loads sdk.minepi.com if App Studio already injected window.Pi.
 * Classic Pi.authenticate(scopesArray, cb) runs FIRST so Studio can hook it.
 */
const PI_BOOT_SCRIPT =
  "(function youneonPiEarly() {" +
  "function errMsg(e) {" +
  "if (!e) return 'unknown';" +
  "if (typeof e === 'string') return e;" +
  "if (e.message) return e.message;" +
  "try { return JSON.stringify(e); } catch (x) { return String(e); }" +
  "}" +
  "function findPi() {" +
  "var found = null;" +
  "try { if (window.Pi) found = window.Pi; } catch (w) {}" +
  "if (!found) { try { if (window.parent && window.parent.Pi) found = window.parent.Pi; } catch (p) {} }" +
  "if (!found) { try { if (window.top && window.top.Pi) found = window.top.Pi; } catch (t) {} }" +
  "if (found && !window.Pi) { try { window.Pi = found; } catch (cp) { console.log('[Pi] error: ' + errMsg(cp)); } }" +
  "try { return window.Pi || found; } catch (r) { return found; }" +
  "}" +
  "function renderStatus() {" +
  "var nodes = document.querySelectorAll('[data-youneon-pi-status], #youneon-pi-status');" +
  "if (!nodes.length) return;" +
  "var P = findPi();" +
  "var last = window.__YOUNEON_PI_LAST__ || '';" +
  "var text = 'Pi SDK: ' + (P ? 'yes' : 'no') + (last ? '  ·  ' + last : '');" +
  "for (var i = 0; i < nodes.length; i++) nodes[i].textContent = text;" +
  "}" +
  "function setLast(text) { window.__YOUNEON_PI_LAST__ = text; renderStatus(); }" +
  "function isPublicLegalPath() {" +
  "try { var p = String((location && location.pathname) || ''); return p === '/privacy' || p === '/terms' || p.indexOf('/privacy/') === 0 || p.indexOf('/terms/') === 0; } catch (e) { return false; }" +
  "}" +
  "function hideOverlays() {" +
  "try { if (document.documentElement.classList) document.documentElement.classList.add('youneon-signed-in'); else document.documentElement.className += ' youneon-signed-in'; } catch (c) {}" +
  "var nodes = document.querySelectorAll('.youneon-static-login, #youneon-static-login, [data-youneon-login-host]');" +
  "for (var i = 0; i < nodes.length; i++) { nodes[i].style.display = 'none'; nodes[i].style.visibility = 'hidden'; nodes[i].style.pointerEvents = 'none'; try { nodes[i].setAttribute('data-youneon-login-hidden', '1'); } catch (a) {} }" +
  "var tree = document.getElementById('youneon-app-tree'); if (tree) tree.style.pointerEvents = 'auto';" +
  "}" +
  "function showOverlays() {" +
  "if (window.__YOUNEON_PUBLIC_PAGE__ || isPublicLegalPath()) { hideOverlays(); return; }" +
  "try { if (document.documentElement.classList) document.documentElement.classList.remove('youneon-signed-in'); else document.documentElement.className = String(document.documentElement.className || '').replace(/youneon-signed-in/g, ''); } catch (c) {}" +
  "var nodes = document.querySelectorAll('.youneon-static-login, #youneon-static-login, [data-youneon-login-host]');" +
  "for (var i = 0; i < nodes.length; i++) { nodes[i].style.display = 'flex'; nodes[i].style.visibility = 'visible'; nodes[i].style.pointerEvents = 'auto'; try { nodes[i].removeAttribute('data-youneon-login-hidden'); } catch (a) {} }" +
  "var tree = document.getElementById('youneon-app-tree'); if (tree) tree.style.pointerEvents = 'none';" +
  "}" +
  "function pickUser(result) {" +
  "var rec = result || {}; var nested = rec.user && typeof rec.user === 'object' ? rec.user : null; var source = nested || rec;" +
  "var uid = source && source.uid ? String(source.uid) : ''; var username = source && source.username ? String(source.username) : '';" +
  "var token = rec.accessToken ? String(rec.accessToken) : '';" +
  "if (!(uid || username)) return null;" +
  "return { uid: uid || username, username: username || uid, accessToken: token };" +
  "}" +
  "function markOk(result) {" +
  "var picked = pickUser(result); if (!picked) return;" +
  "if (window.__PI_AUTH_OK) { hideOverlays(); return; }" +
  "window.__PI_AUTH_OK = true;" +
  "try { localStorage.setItem('youneon_pi_session_lite', JSON.stringify({ uid: picked.uid, username: picked.username })); localStorage.setItem('youneon_authenticated', '1'); localStorage.setItem('youneon_pi_current_user', JSON.stringify({ uid: picked.uid, username: picked.username })); } catch (ls) {}" +
  "hideOverlays(); setLast('Last: signed in' + (picked.username ? ' as ' + picked.username : '')); console.log('[Pi] authenticate success');" +
  "try { window.dispatchEvent(new CustomEvent('youneon:pi-auth-ok', { detail: { uid: picked.uid, username: picked.username } })); } catch (ev) { try { window.dispatchEvent(new Event('youneon:pi-auth-ok')); } catch (ev2) {} }" +
  "if (picked.accessToken && picked.accessToken !== 'restored') { try { var x = new XMLHttpRequest(); x.open('POST', '/api/pi/auth', true); x.setRequestHeader('Content-Type', 'application/json'); x.withCredentials = true; x.send(JSON.stringify({ accessToken: picked.accessToken })); } catch (pe) { console.log('[Pi] error: ' + errMsg(pe)); } }" +
  "}" +
  "function clearAuth() {" +
  "window.__PI_AUTH_OK = false;" +
  "try { localStorage.removeItem('youneon_pi_session_lite'); localStorage.removeItem('youneon_authenticated'); localStorage.removeItem('youneon_pi_current_user'); } catch (c) {}" +
  "showOverlays();" +
  "try { window.dispatchEvent(new CustomEvent('youneon:pi-auth-logout')); } catch (ev) { try { window.dispatchEvent(new Event('youneon:pi-auth-logout')); } catch (ev2) {} }" +
  "}" +
  "function wireAuth(p) { try { if (p && typeof p.then === 'function') p.then(function (r) { markOk(r); }, function (e) { console.log('[Pi] error: ' + errMsg(e)); setLast('Last: ' + errMsg(e)); }); } catch (w) { console.log('[Pi] error: ' + errMsg(w)); } }" +
  "window.__youneonMarkPiAuthOk = markOk;" +
  "window.__youneonClearPiAuth = clearAuth;" +
  "if (isPublicLegalPath()) { window.__YOUNEON_PUBLIC_PAGE__ = true; hideOverlays(); }" +
  "if (!window.__PI_AUTH_OK && !window.__YOUNEON_PUBLIC_PAGE__) showOverlays();" +
  "function callAuthenticate() {" +
  "var P = findPi();" +
  "if (!P || typeof P.authenticate !== 'function') { setLast('Last: window.Pi missing'); console.log('[Pi] error: no window.Pi'); return; }" +
  "console.log('[Pi] authenticate start');" +
  "setLast('Last: authenticate called');" +
  "var promise = null;" +
  "try { promise = P.authenticate(['username','payments'], function (payment) { try { var x = new XMLHttpRequest(); x.open('POST', '/api/pi/payment/incomplete', true); x.setRequestHeader('Content-Type', 'application/json'); x.withCredentials = true; x.send(JSON.stringify({ paymentId: payment && payment.identifier, payment: payment })); } catch (ie) { console.log('[Pi] error: ' + errMsg(ie)); } }); wireAuth(promise); } catch (classicErr) { console.log('[Pi] error: ' + errMsg(classicErr)); setLast('Last: ' + errMsg(classicErr)); }" +
  "try { var objectResult = P.authenticate({ scopes: ['username','payments'] }); wireAuth(objectResult); if (!promise) promise = objectResult; } catch (objectErr) { console.log('[Pi] error: ' + errMsg(objectErr)); }" +
  "return promise;" +
  "}" +
  "window.__youneonFindPi = findPi;" +
  "window.__youneonCallPiAuthenticate = callAuthenticate;" +
  "window.__youneonPiAuth = function () {" +
  "var P = findPi();" +
  "if (!P) { setLast('Last: window.Pi missing'); console.log('[Pi] error: no window.Pi'); return; }" +
  "try { if (P.init) P.init({ version: '2.0', sandbox: true }); } catch (ie) { console.log('[Pi] error: ' + errMsg(ie)); }" +
  "return callAuthenticate();" +
  "};" +
  "function isLoginTarget(t) {" +
  "if (!t) return false;" +
  "if (t.nodeType === 3) t = t.parentNode;" +
  "if (!t || !t.closest) return false;" +
  "if (t.closest('[data-youneon-legal],.youneon-welcome-legal')) return false;" +
  "return !!(t.closest('.youneon-static-login') || t.closest('#youneon-static-login') || t.closest('[data-youneon-login-host]') || t.closest('[data-youneon-signin]') || t.closest('.youneon-signin-btn'));" +
  "}" +
  "function onLoginHit(ev) {" +
  "if (window.__PI_AUTH_OK) return;" +
  "if (!isLoginTarget(ev && ev.target)) return;" +
  "if (typeof window.__youneonPiAuth === 'function') window.__youneonPiAuth(); else callAuthenticate();" +
  "}" +
  "if (!window.__YOUNEON_LOGIN_HIT_BOUND__) {" +
  "window.__YOUNEON_LOGIN_HIT_BOUND__ = true;" +
  "var hitEv = ['pointerdown', 'mousedown', 'touchstart', 'click'];" +
  "for (var hi = 0; hi < hitEv.length; hi++) { try { document.addEventListener(hitEv[hi], onLoginHit, true); } catch (he) { console.log('[Pi] error: ' + errMsg(he)); } }" +
  "}" +
  "function runInitThenAuth() {" +
  "if (window.__YOUNEON_PI_AUTO_AUTH_STARTED__) return;" +
  "window.__YOUNEON_PI_AUTO_AUTH_STARTED__ = true;" +
  "var P = findPi();" +
  "if (!P) { setLast('Last: window.Pi missing'); console.log('[Pi] error: no window.Pi'); return; }" +
  "if (!window.__YOUNEON_PI_SDK_LOGGED__) { window.__YOUNEON_PI_SDK_LOGGED__ = true; console.log('[Pi] SDK loaded'); }" +
  "try {" +
  "if (P.init) {" +
  "console.log('[Pi] init start');" +
  "var r = P.init({ version: '2.0', sandbox: true });" +
  "if (r && typeof r.then === 'function') {" +
  "r.then(function () { console.log('[Pi] init success'); }, function (e) { console.log('[Pi] error: ' + errMsg(e)); });" +
  "} else { console.log('[Pi] init success'); }" +
  "}" +
  "} catch (e) { console.log('[Pi] error: ' + errMsg(e)); }" +
  "}" +
  "renderStatus();" +
  "var piPoll = setInterval(function () { renderStatus(); if (!findPi()) return; clearInterval(piPoll); runInitThenAuth(); }, 200);" +
  "if (findPi()) { clearInterval(piPoll); runInitThenAuth(); }" +
  "if (!window.__YOUNEON_PI_SDK_LOAD_SCHEDULED__) {" +
  "window.__YOUNEON_PI_SDK_LOAD_SCHEDULED__ = true;" +
  "setTimeout(function () {" +
  "if (findPi()) { renderStatus(); return; }" +
  "if (document.querySelector('script[data-youneon-pi-sdk]')) return;" +
  "var preserved = null; try { preserved = window.Pi; } catch (pe) { console.log('[Pi] error: ' + errMsg(pe)); }" +
  "var s = document.createElement('script');" +
  "s.src = 'https://sdk.minepi.com/pi-sdk.js';" +
  "s.async = true;" +
  "s.setAttribute('data-youneon-pi-sdk', '1');" +
  "s.onload = function () { if (preserved) { try { window.Pi = preserved; } catch (re) { console.log('[Pi] error: ' + errMsg(re)); } } renderStatus(); };" +
  "s.onerror = function () { console.log('[Pi] error: failed to load sdk.minepi.com'); setLast('Last: SDK script failed'); };" +
  "(document.head || document.documentElement).appendChild(s);" +
  "}, 500);" +
  "}" +
  "})();";

const PUBLIC_LEGAL_PATH_SCRIPT =
  "(function(){" +
  "try{" +
  "var p=String((location&&location.pathname)||'');" +
  "if(p==='/privacy'||p==='/terms'||p.indexOf('/privacy/')===0||p.indexOf('/terms/')===0){" +
  "window.__YOUNEON_PUBLIC_PAGE__=true;" +
  "var d=document.documentElement;" +
  "if(d.classList){d.classList.add('youneon-legal');d.classList.add('youneon-signed-in');}" +
  "else{d.className+=' youneon-legal youneon-signed-in';}" +
  "}" +
  "}catch(e){}" +
  "})();";

function isPublicLegalPath(pathname: string) {
  const p = pathname.split("?")[0] || "";
  return p === "/privacy" || p === "/terms" || p.startsWith("/privacy/") || p.startsWith("/terms/");
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "YouNeon - Random Video Chat",
  description: "Random live video chat with people from all over the world. Meet new friends, have fun conversations and experience the unexpected in a cool neon universe.",
  generator: "v0.app",
  applicationName: "YouNeon",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "YouNeon"
  },
  formatDetection: {
    telephone: false
  },
  manifest: "/manifest.json",
  keywords: ["video chat", "random chat", "social", "meet people", "live streaming"],
  authors: [{ name: "YouNeon Team" }],
  alternates: {
    canonical: APP_URL
  },
  openGraph: {
    type: "website",
    url: APP_URL,
    title: "YouNeon - Random Video Chat",
    description: "Connect with random people from around the world instantly. Meet new friends and have fun conversations.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "YouNeon"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "YouNeon",
    description: "Random video chat with people worldwide"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#070010"
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const isPublicLegal = isPublicLegalPath(headerList.get("x-youneon-pathname") || "");
  const pageBg = isPublicLegal ? "#F6F4F8" : "#070010";
  const pageColor = isPublicLegal ? "#1f1f23" : "#ffffff";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={isPublicLegal ? "youneon-legal youneon-signed-in" : undefined}
      style={{ background: pageBg, backgroundColor: pageBg, minHeight: "100%", height: "100%" }}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="YouNeon" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content={isPublicLegal ? "#F6F4F8" : "#070010"} />
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: PUBLIC_LEGAL_PATH_SCRIPT }} />
      </head>
      <body
        suppressHydrationWarning
        style={{
          background: pageBg,
          backgroundColor: pageBg,
          minHeight: "100%",
          height: "100%",
          margin: 0,
          color: pageColor,
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        {isPublicLegal ? null : <StaticPiLogin overlayId="youneon-static-login" />}
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: PI_BOOT_SCRIPT }} />
        <script type="text/javascript" src="/pi-boot.js?v=login-overlay-2"></script>
        <div
          id="youneon-app-tree"
          style={{
            position: "relative",
            zIndex: 0,
            isolation: "isolate",
            pointerEvents: isPublicLegal ? "auto" : "none",
          }}
        >
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
