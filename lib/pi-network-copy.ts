/** User-facing copy when Pi Platform rejects the Server API Key for this network. */

export const WRONG_PI_API_KEY_TESTNET =
  "Wrong Pi API key for this network. Use the Develop Testnet / Sandbox Server API Key for the Connected App Wallet (not old App Studio keys, not a Production Mainnet key).";

export const WRONG_PI_API_KEY_MAINNET =
  "Wrong Pi API key for this network. Use Production Server API Key on Mainnet.";

export const WRONG_PI_API_KEY_OPEN_APP =
  "Wrong Pi API key for Open App. Set PI_API_KEY_PRODUCTION on Vercel to the Develop Testnet Server API Key of the SAME Pi app that Open App uses (not Studio, not Stripe, not a sandbox-only key).";

export function wrongPiApiKeyMessage(sandbox?: boolean): string {
  if (sandbox === false) return WRONG_PI_API_KEY_OPEN_APP;
  return WRONG_PI_API_KEY_TESTNET;
}

export function isPiAuthFailureStatus(status: number | undefined): boolean {
  return status === 401 || status === 403;
}
