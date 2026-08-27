function resolvePiSandbox(): boolean {
  // This app is published on Pi Testnet. Only disable sandbox when explicitly set.
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
  // Not a payment API key. Redirect URIs must still be set in Pi Develop
  // (e.g. https://youneonwtce7005.pinet.com and https://youneon-app.vercel.app).
  CLIENT_ID: resolvePiClientId(),
};

export type PiInitOptions = {
  version: "2.0";
  sandbox: boolean;
  clientId?: string;
};

/** Official Pi.init payload. Login stays Pi.authenticate; clientId is Sign-In config only. */
export function getPiInitOptions(): PiInitOptions {
  const opts: PiInitOptions = {
    version: "2.0",
    sandbox: PI_NETWORK_CONFIG.SANDBOX,
  };
  if (PI_NETWORK_CONFIG.CLIENT_ID) {
    opts.clientId = PI_NETWORK_CONFIG.CLIENT_ID;
  }
  return opts;
}
