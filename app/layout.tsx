import type React from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { LanguageProvider } from "@/contexts/language-context";
import { PiAuthProvider } from "@/contexts/pi-auth-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://youneonwtce7005.pinet.com";

const PI_SANDBOX = PI_NETWORK_CONFIG.SANDBOX;

/**
 * Inline auto-auth so Pi App Studio sees a real Pi.authenticate call in the HTML
 * and at runtime — without waiting for React hydration or a button click.
 * Polls for window.Pi, awaits Pi.init, then calls the object-form authenticate.
 */
const PI_AUTO_AUTH_SCRIPT = `
(function youneonPiAutoAuth() {
  function log(event, detail) {
    try {
      if (detail !== undefined) console.log("[Pi] " + event, detail);
      else console.log("[Pi] " + event);
    } catch (e) {}
  }
  function waitForPi(timeoutMs) {
    return new Promise(function (resolve) {
      if (window.Pi) { resolve(true); return; }
      var started = Date.now();
      var timer = setInterval(function () {
        if (window.Pi) { clearInterval(timer); resolve(true); }
        else if (Date.now() - started >= timeoutMs) { clearInterval(timer); resolve(!!window.Pi); }
      }, 50);
    });
  }
  function onIncompletePaymentFound(payment) {
    log("incomplete payment found", payment && payment.identifier);
  }
  if (window.__YOUNEON_PI_AUTH_PROMISE__) return;
  window.__YOUNEON_PI_AUTH_PROMISE__ = (async function () {
    log("waiting for window.Pi");
    var found = await waitForPi(20000);
    if (!found || !window.Pi) {
      log("missing window.Pi");
      throw new Error("PI_SDK_UNAVAILABLE");
    }
    var Pi = window.Pi;
    log("init start", { version: "2.0", sandbox: ${PI_SANDBOX} });
    await Pi.init({ version: "2.0", sandbox: ${PI_SANDBOX} });
    log("init success");
    log("authenticate start");
    var result;
    try {
      result = await Pi.authenticate({ scopes: ['username'] });
    } catch (objectFormError) {
      log("authenticate object form failed, using array form", objectFormError);
      result = await Pi.authenticate(['username'], onIncompletePaymentFound);
    }
    log("authenticate success", result && result.user);
    return result;
  })().catch(function (error) {
    log("authenticate fail", error);
    throw error;
  });
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
    <html lang="en" className="bg-gradient-to-br from-purple-950 to-black">
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
        <Script id="pi-sdk" src={PI_NETWORK_CONFIG.SDK_URL} strategy="beforeInteractive" />
        <Script id="pi-auto-auth-boot" strategy="beforeInteractive">
          {PI_AUTO_AUTH_SCRIPT}
        </Script>
        <script id="pi-auto-auth" dangerouslySetInnerHTML={{ __html: PI_AUTO_AUTH_SCRIPT }} />
      </head>
      <body className={`${GeistSans.className} bg-gradient-to-br from-purple-950 to-black text-white`}>
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
