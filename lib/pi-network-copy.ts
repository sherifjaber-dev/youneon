/** User-facing copy when Pi Platform rejects the Server API Key for this network. */

export const WRONG_PI_API_KEY_TESTNET =
  "Wrong Pi API key for this network. Use Sandbox Server API Key on Testnet.";

export const WRONG_PI_API_KEY_MAINNET =
  "Wrong Pi API key for this network. Use Production Server API Key on Mainnet.";

export function wrongPiApiKeyMessage(sandbox: boolean): string {
  return sandbox ? WRONG_PI_API_KEY_TESTNET : WRONG_PI_API_KEY_MAINNET;
}

export function isPiAuthFailureStatus(status: number | undefined): boolean {
  return status === 401 || status === 403;
}
