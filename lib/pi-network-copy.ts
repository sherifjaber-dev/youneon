/** User-facing copy when Pi Platform rejects the Server API Key for this network. */

export const WRONG_PI_API_KEY_TESTNET =
  "Wrong Pi API key for this network. Use the Develop Testnet / Sandbox Server API Key for the Connected App Wallet (not old App Studio keys, not a Production Mainnet key).";

export const WRONG_PI_API_KEY_MAINNET =
  "Wrong Pi API key for this network. Use Production Server API Key on Mainnet.";

export const WRONG_PI_API_KEY_OPEN_APP =
  "Wrong Pi API key for Open App. Set PI_API_KEY_PRODUCTION on Vercel to the Develop Testnet Server API Key of the SAME Pi app that Open App uses (not Studio, not Stripe, not a sandbox-only key).";

/**
 * 404 payment_not_found with a valid Server API Key (xjae8e) means the payment was
 * created on a different Pi app host than Develop. Do not ask for a new API key.
 * Pi Apps pinet wrapper (youneonbq9219.pinet.com) ≠ Vercel Develop URL;
 * createPayment is scoped to the app that wrapped Open App.
 */
export const WRONG_PI_APP_PAYMENT =
  "This payment was created on a different Pi app host than the Develop app. Link the Pi Apps listing to the Develop app, or set the Pi Apps listing URL to the same app as Develop (youneon-app.vercel.app), so Open App and the Server API Key (xjae8e) are the same app. Linked App in Develop is currently None.";

export function wrongPiApiKeyMessage(sandbox?: boolean): string {
  if (sandbox === false) return WRONG_PI_API_KEY_OPEN_APP;
  return WRONG_PI_API_KEY_TESTNET;
}

export function isPiAuthFailureStatus(status: number | undefined): boolean {
  return status === 401 || status === 403;
}
