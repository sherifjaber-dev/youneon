export type PiScope = "username" | "payments" | "wallet_address";

export type PiAuthenticateOptions = {
  scopes: PiScope[];
};

export type PiAuthResult = {
  accessToken: string;
  user: {
    uid: string;
    username: string;
  };
};

export type PiDirection = "user_to_app" | "app_to_user";

export type PiAppNetwork = "Pi Network" | "Pi Testnet";

export type PiPaymentDTO = {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
  from_address: string;
  to_address: string;
  direction: PiDirection;
  created_at: string;
  network: PiAppNetwork;
  status: {
    developer_approved: boolean;
    transaction_verified: boolean;
    developer_completed: boolean;
    cancelled: boolean;
    user_cancelled: boolean;
  };
  transaction: null | {
    txid: string;
    verified: boolean;
    _link: string;
  };
};

export type PiPaymentData = {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
};

export type PiPaymentCallbacks = {
  onReadyForServerApproval: (paymentId: string) => void | Promise<void>;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void | Promise<void>;
  onCancel: (paymentId: string) => void | Promise<void>;
  onError: (error: Error, payment?: PiPaymentDTO) => void;
};

export type PiNativeFeature = "inline_media" | "request_permission" | "ad_network";

export type PiAdType = "interstitial" | "rewarded";

export type PiSDK = {
  init: (options: { version: string; sandbox?: boolean }) => Promise<void> | void;
  authenticate: {
    (options: PiAuthenticateOptions): Promise<PiAuthResult>;
    (
      scopes: PiScope[],
      onIncompletePaymentFound?: (payment: PiPaymentDTO) => void
    ): Promise<PiAuthResult>;
  };
  createPayment: (
    paymentData: PiPaymentData,
    callbacks: PiPaymentCallbacks
  ) => void | Promise<unknown>;
  nativeFeaturesList?: () => Promise<PiNativeFeature[]>;
  openShareDialog?: (title: string, message: string) => void;
  openUrlInSystemBrowser?: (url: string) => Promise<void>;
  Ads?: {
    showAd: (adType: PiAdType) => Promise<unknown>;
    isAdReady: (adType: PiAdType) => Promise<{ type: PiAdType; ready: boolean }>;
    requestAd: (adType: PiAdType) => Promise<unknown>;
  };
};

declare global {
  interface Window {
    Pi?: PiSDK;
    __YOUNEON_PI_AUTH_PROMISE__?: Promise<PiAuthResult>;
    __YOUNEON_PI_INIT_PROMISE__?: Promise<void>;
    __YOUNEON_PI_SDK_LOGGED__?: boolean;
    __YOUNEON_PI_AUTH_PENDING__?: boolean;
    __YOUNEON_PI_AUTO_AUTH_STARTED__?: boolean;
    __YOUNEON_PI_LAST__?: string;
    __YOUNEON_PI_SDK_LOAD_SCHEDULED__?: boolean;
    __YOUNEON_LOGIN_HIT_BOUND__?: boolean;
    __YOUNEON_RESTORING_SIGNIN__?: boolean;
    __PI_AUTH_OK?: boolean;
    __youneonWaitForPi?: (timeoutMs: number) => Promise<boolean>;
    __youneonFindPi?: () => PiSDK | null | undefined;
    __youneonCallPiAuthenticate?: () => unknown;
    __youneonPiAuth?: (force?: boolean) => Promise<PiAuthResult> | unknown;
  }
}

export {};
