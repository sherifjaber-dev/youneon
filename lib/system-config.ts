function resolvePiClientId(): string {
  return (process.env.NEXT_PUBLIC_PI_CLIENT_ID || "").trim();
}

/**
 * Pi.init sandbox from the page hostname — not Testnet vs Mainnet.
 * Testnet is the Developer Portal registration; this flag only selects Studio
 * vs Pi Browser / Ecosystem.
 *
 * sandbox: true  → sandbox.minepi.com, localhost, 127.0.0.1
 * sandbox: false → youneon-app.vercel.app, *.pinet.com, Pi Browser Open App
 */
export function resolvePiSandboxFromHost(hostname?: string): boolean {
  let host = typeof hostname === "string" ? hostname : "";
  if (!host && typeof window !== "undefined") {
    try {
      host = window.location.hostname || "";
    } catch {
      host = "";
    }
  }
  return (
    host.includes("sandbox.minepi.com") ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SDK_LITE_URL: "https://pi-apps.github.io/pi-sdk-lite/build/production/sdklite.js",
  /** @deprecated Use resolvePiSandboxFromHost() at runtime. Build-time env does not control Pi.init. */
  get SANDBOX(): boolean {
    return resolvePiSandboxFromHost();
  },
  // Public Pi Sign-In OAuth client_id (implicit flow, no client_secret).
  // Not passed to Pi.init — unofficial clientId breaks Pi Browser.
  // Redirect URIs must still be set in Pi Develop
  // (e.g. https://youneonwtce7005.pinet.com and https://youneon-app.vercel.app).
  CLIENT_ID: resolvePiClientId(),
};

export type PiInitOptions = {
  version: "2.0";
  sandbox: boolean;
};

/**
 * Official Pi.init payload only: { version: "2.0", sandbox }.
 * Never pass clientId — it is unofficial and can break Pi Browser (Studio ignores it).
 * sandbox is hostname-based (Studio vs Ecosystem). It does not switch Testnet/Mainnet.
 */
export function getPiInitOptions(_includeClientId = false): PiInitOptions {
  return {
    version: "2.0",
    sandbox: resolvePiSandboxFromHost(),
  };
}
