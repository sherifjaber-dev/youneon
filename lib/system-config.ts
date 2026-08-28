function resolvePiSandbox(): boolean {
  // This app is published on Pi Testnet. Only disable sandbox when explicitly set.
  // Never auto-switch from hostname (Develop vs Ecosystem listing).
  return process.env.NEXT_PUBLIC_PI_SANDBOX !== "false";
}

function resolvePiClientId(): string {
  return (process.env.NEXT_PUBLIC_PI_CLIENT_ID || "").trim();
}

export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SDK_LITE_URL: "https://pi-apps.github.io/pi-sdk-lite/build/production/sdklite.js",
  SANDBOX: resolvePiSandbox(),
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
 * sandbox: true is required for Testnet. Mainnet Pi Browser + sandbox:true will hang auth.
 */
export function getPiInitOptions(_includeClientId = false): PiInitOptions {
  return {
    version: "2.0",
    sandbox: PI_NETWORK_CONFIG.SANDBOX,
  };
}
