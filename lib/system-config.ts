function resolvePiClientId(): string {
  return (process.env.NEXT_PUBLIC_PI_CLIENT_ID || "").trim();
}

function envPiSandboxFlag(): boolean | undefined {
  const raw = String(process.env.NEXT_PUBLIC_PI_SANDBOX ?? "").trim().toLowerCase();
  if (raw === "false" || raw === "0") return false;
  if (raw === "true" || raw === "1") return true;
  return undefined;
}

function pageHostname(hostname?: string): string {
  if (typeof hostname === "string" && hostname) return hostname;
  if (typeof window !== "undefined") {
    try {
      return window.location.hostname || "";
    } catch {
      return "";
    }
  }
  return "";
}

/**
 * Hostname helper only (Studio / local vs vercel.app / pinet.com).
 * Do not use this to set Pi.init sandbox:false — that is Mainnet, not "Open App".
 */
export function isPiStudioHost(hostname?: string): boolean {
  const host = pageHostname(hostname);
  return (
    host.includes("sandbox.minepi.com") ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

/**
 * Pi.init sandbox is Pi SDK Testnet access for this registered Testnet app.
 * Studio vs Ecosystem is NOT sandbox:false — sandbox:false creates Mainnet
 * payments that Testnet Server API Keys cannot see (404 payment_not_found).
 *
 * Default true on vercel.app, pinet.com, AND Studio/localhost until Mainnet.
 * Set NEXT_PUBLIC_PI_SANDBOX=false only when this app moves to Mainnet.
 */
export function resolvePiSandboxFromHost(_hostname?: string): boolean {
  const override = envPiSandboxFlag();
  if (override !== undefined) return override;
  // Hostname is diagnostic only; never force false on Open App / Ecosystem hosts.
  return true;
}

export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SDK_LITE_URL: "https://pi-apps.github.io/pi-sdk-lite/build/production/sdklite.js",
  /** Runtime Pi.init sandbox. Default true (Testnet). NEXT_PUBLIC_PI_SANDBOX=false for Mainnet. */
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
 * sandbox true = Testnet SDK access for this registered Testnet app.
 * Studio vs Ecosystem is NOT sandbox:false.
 */
export function getPiInitOptions(_includeClientId = false): PiInitOptions {
  return {
    version: "2.0",
    sandbox: resolvePiSandboxFromHost(),
  };
}
