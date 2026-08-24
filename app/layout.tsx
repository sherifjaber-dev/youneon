import type React from "react";
import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/app-providers";
import { StaticPiLogin } from "@/components/static-pi-login";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://youneonwtce7005.pinet.com";

const CRITICAL_CSS =
  "html,body{background:#0f0117 !important;background-color:#0f0117 !important;color:#fff !important;margin:0;min-height:100%;height:100%;font-family:system-ui,-apple-system,Segoe UI,sans-serif}#youneon-static-login,.youneon-static-login{background:#0f0117}";

/**
 * Vanilla ES5 boot script. No async/await, no arrow functions, no template
 * literals in the output — old Pi App Studio webviews throw on those and can
 * white-screen the document. Literal Pi.authenticate(...) must appear here
 * so App Studio can detect the call.
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
  "function waitForPi(timeoutMs, cb) {" +
  "if (window.Pi) { logSdkLoaded(); cb(true); return; }" +
  "var started = Date.now();" +
  "var timer = setInterval(function () {" +
  "if (window.Pi) { clearInterval(timer); logSdkLoaded(); cb(true); }" +
  "else if (Date.now() - started >= timeoutMs) { clearInterval(timer); cb(!!window.Pi); }" +
  "}, 50);" +
  "}" +
  "window.__youneonWaitForPi = function (timeoutMs) {" +
  "return new Promise(function (resolve) { waitForPi(timeoutMs, resolve); });" +
  "};" +
  "function runAuthenticate() {" +
  "console.log('[Pi] authenticate start');" +
  "var result;" +
  "try { result = window.Pi.authenticate({ scopes: ['username'] }); }" +
  "catch (objectFormError) { result = window.Pi.authenticate(['username'], function () {}); }" +
  "return Promise.resolve(result);" +
  "}" +
  "window.__youneonPiAuth = function (force) {" +
  "if (window.__YOUNEON_PI_AUTH_PENDING__ && window.__YOUNEON_PI_AUTH_PROMISE__) {" +
  "return window.__YOUNEON_PI_AUTH_PROMISE__;" +
  "}" +
  "if (!force && window.__YOUNEON_PI_AUTH_PROMISE__) return window.__YOUNEON_PI_AUTH_PROMISE__;" +
  "window.__YOUNEON_PI_AUTH_PENDING__ = true;" +
  "var p = new Promise(function (resolve, reject) {" +
  "waitForPi(15000, function (found) {" +
  "if (!found || !window.Pi) {" +
  "var missing = new Error('PI_SDK_UNAVAILABLE');" +
  "console.log('[Pi] error: ' + errMsg(missing));" +
  "reject(missing);" +
  "return;" +
  "}" +
  "logSdkLoaded();" +
  "function afterInit() {" +
  "runAuthenticate().then(function (authResult) {" +
  "console.log('[Pi] authenticate success');" +
  "window.__PI_AUTH_OK = true;" +
  "try { document.dispatchEvent(new Event('youneon-pi-auth')); } catch (ev) {}" +
  "resolve(authResult);" +
  "}, function (e) {" +
  "console.log('[Pi] error: ' + errMsg(e));" +
  "reject(e);" +
  "});" +
  "}" +
  "if (!window.__YOUNEON_PI_INIT_PROMISE__) {" +
  "console.log('[Pi] init start');" +
  "window.__YOUNEON_PI_INIT_PROMISE__ = Promise.resolve(window.Pi.init({ version: '2.0', sandbox: true })).then(function () {" +
  "console.log('[Pi] init success');" +
  "}).catch(function (e) {" +
  "window.__YOUNEON_PI_INIT_PROMISE__ = undefined;" +
  "throw e;" +
  "});" +
  "}" +
  "Promise.resolve(window.__YOUNEON_PI_INIT_PROMISE__).then(afterInit, function (e) {" +
  "console.log('[Pi] error: ' + errMsg(e));" +
  "reject(e);" +
  "});" +
  "});" +
  "});" +
  "window.__YOUNEON_PI_AUTH_PROMISE__ = p;" +
  "p.then(function () { window.__YOUNEON_PI_AUTH_PENDING__ = false; }, function () {" +
  "window.__YOUNEON_PI_AUTH_PENDING__ = false;" +
  "if (window.__YOUNEON_PI_AUTH_PROMISE__ === p) window.__YOUNEON_PI_AUTH_PROMISE__ = undefined;" +
  "});" +
  "return p;" +
  "};" +
  "function onSignInClick(e) {" +
  "var t = e.target;" +
  "while (t && t !== document) {" +
  "if (t.getAttribute && t.getAttribute('data-youneon-signin')) {" +
  "window.__youneonPiAuth(true);" +
  "return;" +
  "}" +
  "t = t.parentNode;" +
  "}" +
  "}" +
  "document.addEventListener('click', onSignInClick, true);" +
  "function startAuth() {" +
  "if (window.Pi) logSdkLoaded();" +
  "window.__youneonPiAuth(false).then(function () {}, function () {});" +
  "}" +
  "if (document.readyState === 'loading') {" +
  "document.addEventListener('DOMContentLoaded', startAuth);" +
  "} else {" +
  "startAuth();" +
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
        <script src="https://sdk.minepi.com/pi-sdk.js" defer></script>
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
        <script dangerouslySetInnerHTML={{ __html: PI_BOOT_SCRIPT }} />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
