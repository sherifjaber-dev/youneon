import type React from "react";
import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/app-providers";
import { StaticPiLogin } from "@/components/static-pi-login";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://youneonwtce7005.pinet.com";

const CRITICAL_CSS =
  "html,body{background:#0f0117 !important;background-color:#0f0117 !important;color:#fff !important;margin:0;min-height:100%;height:100%;font-family:system-ui,-apple-system,Segoe UI,sans-serif}" +
  "#youneon-static-login,.youneon-static-login,#youneon-static-login *,.youneon-static-login *{user-select:none !important;-webkit-user-select:none !important;-moz-user-select:none !important;-ms-user-select:none !important;-webkit-touch-callout:none !important;caret-color:transparent !important;cursor:pointer !important}" +
  "#youneon-static-login,.youneon-static-login{background:#0f0117;pointer-events:auto !important;z-index:2147483647 !important;position:fixed !important;top:0;right:0;bottom:0;left:0;cursor:pointer !important;touch-action:manipulation !important;-webkit-tap-highlight-color:rgba(168,85,247,0.5) !important}" +
  "#youneon-static-login h1,.youneon-static-login h1,#youneon-static-login p,.youneon-static-login p{pointer-events:none !important}" +
  "#youneon-signin-btn,.youneon-signin-btn,button[data-youneon-signin],input[data-youneon-signin]{pointer-events:auto !important;position:relative !important;z-index:2147483647 !important;cursor:pointer !important;touch-action:manipulation !important;-webkit-tap-highlight-color:rgba(168,85,247,0.5) !important}" +
  "#youneon-app-tree{pointer-events:none;position:relative;z-index:0}";

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
  "function callAuthenticate() {" +
  "var P = findPi();" +
  "if (!P || typeof P.authenticate !== 'function') { setLast('Last: window.Pi missing'); console.log('[Pi] error: no window.Pi'); return; }" +
  "console.log('[Pi] authenticate start');" +
  "setLast('Last: authenticate called');" +
  "try { P.authenticate(['username'], function (payment) {}); } catch (classicErr) { console.log('[Pi] error: ' + errMsg(classicErr)); setLast('Last: ' + errMsg(classicErr)); }" +
  "try { P.authenticate({ scopes: ['username'] }); } catch (objectErr) { console.log('[Pi] error: ' + errMsg(objectErr)); }" +
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
  "return !!(t.closest('.youneon-static-login') || t.closest('#youneon-static-login') || t.closest('[data-youneon-login-host]') || t.closest('[data-youneon-signin]') || t.closest('.youneon-signin-btn'));" +
  "}" +
  "function onLoginHit(ev) {" +
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
  "var authCalled = false;" +
  "function doAuth() { if (authCalled) return; authCalled = true; callAuthenticate(); }" +
  "try {" +
  "if (P.init) {" +
  "console.log('[Pi] init start');" +
  "var r = P.init({ version: '2.0', sandbox: true });" +
  "if (r && typeof r.then === 'function') {" +
  "r.then(function () { console.log('[Pi] init success'); doAuth(); }, function (e) { console.log('[Pi] error: ' + errMsg(e)); doAuth(); });" +
  "} else { console.log('[Pi] init success'); doAuth(); }" +
  "} else { doAuth(); }" +
  "} catch (e) { console.log('[Pi] error: ' + errMsg(e)); doAuth(); }" +
  "setTimeout(function () { doAuth(); }, 500);" +
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
  themeColor: "#0f0117"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{ background: "#0f0117", backgroundColor: "#0f0117", minHeight: "100%", height: "100%" }}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="YouNeon" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f0117" />
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
      </head>
      <body
        suppressHydrationWarning
        style={{
          background: "#0f0117",
          backgroundColor: "#0f0117",
          minHeight: "100%",
          height: "100%",
          margin: 0,
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <StaticPiLogin overlayId="youneon-static-login" />
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: PI_BOOT_SCRIPT }} />
        <script type="text/javascript" src="/pi-boot.js?v=studio-auth-2"></script>
        <div
          id="youneon-app-tree"
          style={{ position: "relative", zIndex: 0, isolation: "isolate", pointerEvents: "none" }}
        >
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
