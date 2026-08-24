import type React from "react";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { LanguageProvider } from "@/contexts/language-context";
import { PiAuthProvider } from "@/contexts/pi-auth-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://youneonwtce7005.pinet.com";

const PI_SANDBOX = PI_NETWORK_CONFIG.SANDBOX;

/**
 * Non-blocking Pi boot: logs SDK load, wires the first-paint Sign in button,
 * and starts auto-auth after paint. Does not use beforeInteractive (that delays
 * hydration if sdk.minepi.com is slow/blocked and produces a blank preview).
 */
const PI_BOOT_SCRIPT = `
(function youneonPiBoot() {
  var SANDBOX = ${PI_SANDBOX};
  function errMsg(e) {
    if (!e) return "unknown";
    if (typeof e === "string") return e;
    if (e.message) return e.message;
    try { return JSON.stringify(e); } catch (x) { return String(e); }
  }
  function logSdkLoaded() {
    if (window.__YOUNEON_PI_SDK_LOGGED__ || !window.Pi) return;
    window.__YOUNEON_PI_SDK_LOGGED__ = true;
    console.log("[Pi] SDK loaded");
  }
  window.__youneonWaitForPi = function (timeoutMs) {
    return new Promise(function (resolve) {
      if (window.Pi) { logSdkLoaded(); resolve(true); return; }
      var started = Date.now();
      var timer = setInterval(function () {
        if (window.Pi) { clearInterval(timer); logSdkLoaded(); resolve(true); }
        else if (Date.now() - started >= timeoutMs) { clearInterval(timer); resolve(!!window.Pi); }
      }, 50);
    });
  };
  window.__youneonPiAuth = function (force) {
    if (window.__YOUNEON_PI_AUTH_PENDING__ && window.__YOUNEON_PI_AUTH_PROMISE__) {
      return window.__YOUNEON_PI_AUTH_PROMISE__;
    }
    if (!force && window.__YOUNEON_PI_AUTH_PROMISE__) return window.__YOUNEON_PI_AUTH_PROMISE__;
    window.__YOUNEON_PI_AUTH_PENDING__ = true;
    var p = (async function () {
      try {
        var found = await window.__youneonWaitForPi(2000);
        if (!found || !window.Pi) throw new Error("PI_SDK_UNAVAILABLE");
        logSdkLoaded();
        if (!window.__YOUNEON_PI_INIT_PROMISE__) {
          window.__YOUNEON_PI_INIT_PROMISE__ = (async function () {
            console.log("[Pi] init start");
            await window.Pi.init({ version: "2.0", sandbox: SANDBOX });
            console.log("[Pi] init success");
          })().catch(function (e) {
            window.__YOUNEON_PI_INIT_PROMISE__ = undefined;
            throw e;
          });
        }
        await window.__YOUNEON_PI_INIT_PROMISE__;
        console.log("[Pi] authenticate start");
        var result;
        try {
          result = await window.Pi.authenticate({ scopes: ['username'] });
        } catch (objectFormError) {
          result = await window.Pi.authenticate(['username'], function () {});
        }
        console.log("[Pi] authenticate success");
        return result;
      } catch (e) {
        console.log("[Pi] error: " + errMsg(e));
        throw e;
      }
    })();
    window.__YOUNEON_PI_AUTH_PROMISE__ = p;
    p.finally(function () { window.__YOUNEON_PI_AUTH_PENDING__ = false; });
    p.catch(function () {
      if (window.__YOUNEON_PI_AUTH_PROMISE__ === p) window.__YOUNEON_PI_AUTH_PROMISE__ = undefined;
    });
    return p;
  };
  function bindBtn() {
    var btn = document.getElementById("youneon-signin-btn");
    if (!btn || btn.getAttribute("data-bound") === "1") return;
    btn.setAttribute("data-bound", "1");
    btn.addEventListener("click", function () {
      window.__youneonPiAuth(true);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindBtn);
  else bindBtn();
  setTimeout(function () { window.__youneonPiAuth(false).catch(function () {}); }, 0);
})();
`;

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
  themeColor: "#a855f7"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#1a0533]" style={{ backgroundColor: "#1a0533", minHeight: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="YouNeon" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#a855f7" />
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <script src={PI_NETWORK_CONFIG.SDK_URL} async />
      </head>
      <body
        className={`${GeistSans.className} text-white`}
        style={{
          backgroundColor: "#1a0533",
          backgroundImage: "linear-gradient(to bottom right, #2e1065, #000000)",
          minHeight: "100dvh",
          margin: 0,
          color: "#ffffff",
        }}
      >
        <div
          id="youneon-static-login"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(to bottom right, #2e1065, #000000)",
            color: "#ffffff",
            padding: 16,
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              margin: "0 0 1.25rem",
              color: "#e9d5ff",
            }}
          >
            YouNeon
          </h1>
          <button
            id="youneon-signin-btn"
            type="button"
            style={{
              padding: "16px 32px",
              fontSize: "1.125rem",
              fontWeight: 700,
              border: 0,
              borderRadius: 16,
              color: "#ffffff",
              background: "linear-gradient(to right, #a855f7, #ec4899)",
              cursor: "pointer",
              width: "100%",
              maxWidth: 320,
            }}
          >
            Sign in with Pi Network
          </button>
        </div>
        <script dangerouslySetInnerHTML={{ __html: PI_BOOT_SCRIPT }} />
        <ErrorBoundary>
          <LanguageProvider>
            <PiAuthProvider>
              {children}
            </PiAuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
