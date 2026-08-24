import type React from "react";
import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/app-providers";
import { StaticPiLogin } from "@/components/static-pi-login";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://youneonwtce7005.pinet.com";

const CRITICAL_CSS =
  "html,body{background:#0f0117 !important;background-color:#0f0117 !important;color:#fff !important;margin:0;min-height:100%;height:100%;font-family:system-ui,-apple-system,Segoe UI,sans-serif}" +
  "#youneon-static-login,.youneon-static-login{background:#0f0117;pointer-events:auto !important;z-index:2147483647 !important;position:fixed !important;top:0;right:0;bottom:0;left:0}" +
  "#youneon-signin-btn,.youneon-signin-btn,button[data-youneon-signin]{pointer-events:auto !important;position:relative !important;z-index:2147483647 !important;cursor:pointer !important}";

/**
 * Vanilla ES5 boot script. No async/await, no arrow functions, no template
 * literals in the output — old Pi App Studio webviews throw on those.
 * Polls for window.Pi every 200ms, then calls Pi.authenticate so App Studio
 * can detect the call (it does not require login success).
 */
const PI_BOOT_SCRIPT =
  "(function youneonPiBoot() {" +
  "function errMsg(e) {" +
  "if (!e) return 'unknown';" +
  "if (typeof e === 'string') return e;" +
  "if (e.message) return e.message;" +
  "try { return JSON.stringify(e); } catch (x) { return String(e); }" +
  "}" +
  "function logSdkLoaded() {" +
  "if (window.__YOUNEON_PI_SDK_LOGGED__ || !window.Pi) return;" +
  "window.__YOUNEON_PI_SDK_LOGGED__ = true;" +
  "console.log('[Pi] SDK loaded');" +
  "}" +
  "function callAuthenticate() {" +
  "console.log('[Pi] authenticate start');" +
  "var P = window.Pi;" +
  "if (!P) { console.log('[Pi] error: no window.Pi'); return; }" +
  "try { return P.authenticate({ scopes: ['username'] }); }" +
  "catch (objectFormError) {" +
  "try { return P.authenticate(['username'], function () {}); }" +
  "catch (arrayFormError) { console.log('[Pi] error: ' + errMsg(arrayFormError)); }" +
  "}" +
  "}" +
  "window.__youneonCallPiAuthenticate = callAuthenticate;" +
  "window.__youneonPiAuth = function () {" +
  "var P = window.Pi;" +
  "if (!P) { console.log('[Pi] error: no window.Pi'); return; }" +
  "try { if (P.init) P.init({ version: '2.0', sandbox: true }); } catch (ie) {}" +
  "return callAuthenticate();" +
  "};" +
  "function runInitThenAuth() {" +
  "if (window.__YOUNEON_PI_AUTO_AUTH_STARTED__) return;" +
  "window.__YOUNEON_PI_AUTO_AUTH_STARTED__ = true;" +
  "var P = window.Pi;" +
  "if (!P) { console.log('[Pi] error: no window.Pi'); return; }" +
  "logSdkLoaded();" +
  "var authCalled = false;" +
  "function doAuth() {" +
  "if (authCalled) return;" +
  "authCalled = true;" +
  "callAuthenticate();" +
  "}" +
  "try {" +
  "if (P.init) {" +
  "console.log('[Pi] init start');" +
  "var r = P.init({ version: '2.0', sandbox: true });" +
  "if (r && typeof r.then === 'function') {" +
  "r.then(function () { console.log('[Pi] init success'); doAuth(); }, function (e) { console.log('[Pi] error: ' + errMsg(e)); doAuth(); });" +
  "} else { console.log('[Pi] init success'); doAuth(); }" +
  "} else { doAuth(); }" +
  "} catch (e) { console.log('[Pi] error: ' + errMsg(e)); doAuth(); }" +
  "setTimeout(function () { doAuth(); }, 1000);" +
  "}" +
  "var piPoll = setInterval(function () {" +
  "if (!window.Pi) return;" +
  "clearInterval(piPoll);" +
  "runInitThenAuth();" +
  "}, 200);" +
  "if (window.Pi) { clearInterval(piPoll); runInitThenAuth(); }" +
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
        <script type="text/javascript" src="https://sdk.minepi.com/pi-sdk.js"></script>
        <script type="text/javascript" src="/pi-boot.js"></script>
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: PI_BOOT_SCRIPT }} />
        <div style={{ position: "relative", zIndex: 0, isolation: "isolate" }}>
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
