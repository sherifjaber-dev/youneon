/**
 * Debug utilities for diagnosing Pi Browser compatibility issues
 */

export const DEBUG = {
  log: (message: string, data?: any) => {
    if (typeof window !== "undefined") {
      console.log(`[v0] ${message}`, data ?? "");
    }
  },

  warn: (message: string, error?: any) => {
    if (typeof window !== "undefined") {
      console.warn(`[v0] ⚠️ ${message}`, error ?? "");
    }
  },

  error: (message: string, error?: any) => {
    if (typeof window !== "undefined") {
      console.error(`[v0] ❌ ${message}`, error ?? "");
    }
  },

  environment: () => {
    if (typeof window === "undefined") return "SSR";
    
    const userAgent = navigator.userAgent;
    if (userAgent.includes("PiApp")) return "Pi Browser";
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Safari")) return "Safari";
    return "Unknown";
  },

  sdkStatus: () => {
    if (typeof window === "undefined") return { status: "SSR" };

    return {
      piSdk: typeof (window as any).Pi !== "undefined",
      sdkLite: typeof (window as any).SDKLite !== "undefined",
      userAgent: navigator.userAgent.substring(0, 100),
      environment: DEBUG.environment(),
    };
  },

  info: () => {
    if (typeof window === "undefined") return;
    
    DEBUG.log("Environment Info:", DEBUG.sdkStatus());
    DEBUG.log("Document Ready:", document.readyState);
    DEBUG.log("Viewport:", {
      width: window.innerWidth,
      height: window.innerHeight,
      device: window.devicePixelRatio,
    });
  },
};

// Log environment info immediately on load
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      DEBUG.info();
    });
  } else {
    DEBUG.info();
  }
}
