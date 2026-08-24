function resolvePiSandbox(): boolean {
  // This app is published on Pi Testnet. Only disable sandbox when explicitly set.
  return process.env.NEXT_PUBLIC_PI_SANDBOX !== "false";
}

export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SDK_LITE_URL: "https://pi-apps.github.io/pi-sdk-lite/build/production/sdklite.js",
  SANDBOX: resolvePiSandbox(),
};
