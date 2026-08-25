"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, setApiAuthToken } from "@/lib/api";
import { piAuthService } from "@/lib/pi-auth-service";
import {
  clearPiAuthOk,
  hideStaticLoginOverlays,
  identityFromAuthResult,
  markPiAuthOk,
  PI_AUTH_LOGOUT_EVENT,
  PI_AUTH_OK_EVENT,
  persistLiteSession,
  readLiteSession,
  type PiLiteSession,
} from "@/lib/pi-client-session";
import {
  authenticatePi,
  handleIncompletePayment,
  initPiSdk,
  isPiAvailable,
  PI_AUTH_SCOPES,
  PI_SDK_UNAVAILABLE,
  resetPiSdkInit,
} from "@/lib/pi-sdk";
import type { SDKLiteInstance, UserPurchaseBalance } from "@/lib/sdklite-types";

export type PiAuthUser = {
  uid: string;
  username: string;
};

export interface PiAuthContextType {
  user: PiAuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  hasError: boolean;
  authMessage: string;
  sessionUnverified: boolean;
  piAvailable: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  reinitialize: () => Promise<void>;
  sdk: SDKLiteInstance | null;
  products: any[];
  restoredPurchases: UserPurchaseBalance[];
}

const PI_BROWSER_MESSAGE =
  "Pi authentication only works inside the Pi Browser. Open YouNeon in Pi Browser, then tap Sign in with Pi Network.";

const PiAuthContext = createContext<PiAuthContextType | undefined>(undefined);

function messageForError(error: unknown): string {
  const err = error as { message?: string; status?: number; data?: { error?: string } };
  const raw = err?.message || (error instanceof Error ? error.message : String(error ?? ""));
  if (raw === PI_SDK_UNAVAILABLE || raw.includes(PI_SDK_UNAVAILABLE)) {
    return PI_BROWSER_MESSAGE;
  }
  if (/cancel/i.test(raw)) {
    return "Sign-in was cancelled. Tap Sign in with Pi Network to try again.";
  }
  if (err?.status === 401 || /401|invalid or expired/i.test(raw)) {
    return "Could not verify your Pi account. Please try again.";
  }
  return err?.data?.error || raw || "Could not sign in with Pi Network. Please try again.";
}

function clearLocalSession(
  setUser: (user: PiAuthUser | null) => void,
  setAccessToken: (token: string | null) => void,
  setIsAuthenticated: (value: boolean) => void
) {
  setUser(null);
  setAccessToken(null);
  setIsAuthenticated(false);
  setApiAuthToken(null);
}

export function PiAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiAuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [sessionUnverified, setSessionUnverified] = useState(false);
  const [piAvailable, setPiAvailable] = useState(true);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const sessionReadyRef = useRef(false);
  const accessTokenRef = useRef<string | null>(null);

  const applyVerifiedSession = useCallback(
    (verified: PiAuthUser, token: string | null, unverified = false) => {
      sessionReadyRef.current = true;
      setUser(verified);
      setAccessToken(token);
      accessTokenRef.current = token;
      setIsAuthenticated(true);
      setHasError(false);
      setSessionUnverified(unverified);
      setAuthMessage(
        unverified
          ? `Signed in as ${verified.username || "Pi user"}. Verification pending.`
          : `Signed in as ${verified.username || "Pi user"}`
      );
      if (token) setApiAuthToken(token);
      persistLiteSession(verified);
      piAuthService.setVerifiedUser({
        username: verified.username,
        uid: verified.uid,
      });
      markPiAuthOk(verified);
      hideStaticLoginOverlays();
    },
    []
  );

  const verifyTokenInBackground = useCallback(
    async (token: string, fallback: PiAuthUser) => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data } = await api.post<PiAuthUser>("/api/pi/auth", {
            accessToken: token,
          });
          if (data?.uid) {
            applyVerifiedSession(
              {
                uid: data.uid,
                username: data.username || fallback.username,
              },
              token,
              false
            );
            return;
          }
        } catch {
          /* retry */
        }
        await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
      }
      setSessionUnverified(true);
      setAuthMessage(
        `Signed in as ${fallback.username || "Pi user"}. Account verification is still pending.`
      );
    },
    [applyVerifiedSession]
  );

  const enterAppFromAuthResult = useCallback(
    (auth: unknown, token: string) => {
      const identity: PiLiteSession =
        identityFromAuthResult(auth) || {
          uid: "pi_user",
          username: "pi_user",
        };
      applyVerifiedSession(identity, token || null, false);
      markPiAuthOk(auth || identity);
      if (token) {
        void verifyTokenInBackground(token, identity);
      }
    },
    [applyVerifiedSession, verifyTokenInBackground]
  );

  const authenticate = useCallback(
    async (force = false, allowClearOnFailure = true) => {
      const run = (async () => {
        setHasError(false);
        setAuthMessage("Connecting to Pi Network...");

        let token = "";
        let auth: unknown = null;
        try {
          auth = await authenticatePi(PI_AUTH_SCOPES, handleIncompletePayment, force);
          setPiAvailable(true);
          token = typeof (auth as { accessToken?: unknown })?.accessToken === "string"
            ? ((auth as { accessToken: string }).accessToken)
            : "";
          const identity = identityFromAuthResult(auth);
          if (!token && !identity) {
            throw new Error("Pi did not return an access token");
          }
        } catch (error) {
          setPiAvailable(isPiAvailable());
          if (sessionReadyRef.current || (typeof window !== "undefined" && window.__PI_AUTH_OK)) {
            return;
          }
          if (allowClearOnFailure) {
            sessionReadyRef.current = false;
            clearLocalSession(setUser, setAccessToken, setIsAuthenticated);
            setHasError(true);
            setAuthMessage(messageForError(error));
          }
          return;
        }

        enterAppFromAuthResult(auth, token);
      })();

      inFlightRef.current = run;
      try {
        await run;
      } finally {
        if (inFlightRef.current === run) inFlightRef.current = null;
      }
    },
    [enterAppFromAuthResult]
  );

  const login = useCallback(async () => {
    setIsInitializing(true);
    try {
      await authenticate(true, true);
    } finally {
      setIsInitializing(false);
    }
  }, [authenticate]);

  const logout = useCallback(async () => {
    sessionReadyRef.current = false;
    accessTokenRef.current = null;
    piAuthService.logout();
    clearLocalSession(setUser, setAccessToken, setIsAuthenticated);
    setSessionUnverified(false);
    setHasError(false);
    setAuthMessage("Signed out. Tap Sign in with Pi Network to sign in again.");
    clearPiAuthOk();
    try {
      await api.delete("/api/pi/auth");
    } catch {
      // Cookie clear is best-effort; local session is already dropped.
    }
  }, []);

  const reinitialize = useCallback(async () => {
    sessionReadyRef.current = false;
    resetPiSdkInit();
    await login();
  }, [login]);

  useEffect(() => {
    const adoptThisSessionAuth = () => {
      if (typeof window === "undefined" || !window.__PI_AUTH_OK) return;
      const identity = readLiteSession() || { uid: "pi_user", username: "pi_user" };
      applyVerifiedSession(identity, accessTokenRef.current, false);
    };

    adoptThisSessionAuth();

    const onOk = (event: Event) => {
      const detail = "detail" in event ? (event as CustomEvent).detail : undefined;
      const identity = identityFromAuthResult(detail) || readLiteSession();
      if (!identity) return;
      applyVerifiedSession(identity, accessTokenRef.current, false);
    };
    const onLogout = () => {
      sessionReadyRef.current = false;
      accessTokenRef.current = null;
      clearLocalSession(setUser, setAccessToken, setIsAuthenticated);
      setSessionUnverified(false);
    };

    window.addEventListener(PI_AUTH_OK_EVENT, onOk);
    window.addEventListener(PI_AUTH_LOGOUT_EVENT, onLogout);

    let cancelled = false;
    void initPiSdk()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPiAvailable(isPiAvailable());
      });

    return () => {
      cancelled = true;
      window.removeEventListener(PI_AUTH_OK_EVENT, onOk);
      window.removeEventListener(PI_AUTH_LOGOUT_EVENT, onLogout);
    };
  }, [applyVerifiedSession]);

  const value = useMemo<PiAuthContextType>(
    () => ({
      user,
      accessToken,
      isAuthenticated,
      isInitializing,
      hasError,
      authMessage,
      sessionUnverified,
      piAvailable,
      login,
      logout,
      reinitialize,
      sdk: null,
      products: [],
      restoredPurchases: [],
    }),
    [
      user,
      accessToken,
      isAuthenticated,
      isInitializing,
      hasError,
      authMessage,
      sessionUnverified,
      piAvailable,
      login,
      logout,
      reinitialize,
    ]
  );

  return <PiAuthContext.Provider value={value}>{children}</PiAuthContext.Provider>;
}

const EMPTY_PI_AUTH: PiAuthContextType = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: false,
  hasError: false,
  authMessage: "",
  sessionUnverified: false,
  piAvailable: true,
  login: async () => {},
  logout: async () => {},
  reinitialize: async () => {},
  sdk: null,
  products: [],
  restoredPurchases: [],
};

export function usePiAuth() {
  const context = useContext(PiAuthContext);
  if (context === undefined) {
    return EMPTY_PI_AUTH;
  }
  return context;
}
