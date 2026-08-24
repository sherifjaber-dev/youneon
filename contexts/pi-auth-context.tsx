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
  authenticatePi,
  handleIncompletePayment,
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
  const [piAvailable, setPiAvailable] = useState(true);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const sessionReadyRef = useRef(false);

  const applyVerifiedSession = useCallback((verified: PiAuthUser, token: string | null) => {
    sessionReadyRef.current = true;
    setUser(verified);
    setAccessToken(token);
    setIsAuthenticated(true);
    setHasError(false);
    setAuthMessage(`Signed in as ${verified.username || "Pi user"}`);
    if (token) setApiAuthToken(token);
    piAuthService.setVerifiedUser({
      username: verified.username,
      uid: verified.uid,
    });
  }, []);

  const authenticate = useCallback(async (force = false) => {
    const run = (async () => {
      setHasError(false);
      setAuthMessage("Connecting to Pi Network...");

      let token = "";
      try {
        const auth = await authenticatePi(PI_AUTH_SCOPES, handleIncompletePayment, force);
        setPiAvailable(true);
        token = typeof auth?.accessToken === "string" ? auth.accessToken : "";
        if (!token) {
          throw new Error("Pi did not return an access token");
        }
      } catch (error) {
        sessionReadyRef.current = false;
        setPiAvailable(isPiAvailable());
        clearLocalSession(setUser, setAccessToken, setIsAuthenticated);
        setHasError(true);
        setAuthMessage(messageForError(error));
        return;
      }

      setAuthMessage("Verifying your Pi account...");
      try {
        const { data } = await api.post<PiAuthUser>("/api/pi/auth", {
          accessToken: token,
        });
        if (!data?.uid) {
          throw new Error("Could not verify your Pi account. Please try again.");
        }
        applyVerifiedSession(
          {
            uid: data.uid,
            username: data.username || "",
          },
          token
        );
      } catch (error) {
        sessionReadyRef.current = false;
        clearLocalSession(setUser, setAccessToken, setIsAuthenticated);
        setHasError(true);
        setAuthMessage(messageForError(error));
      }
    })();

    inFlightRef.current = run;
    try {
      await run;
    } finally {
      if (inFlightRef.current === run) inFlightRef.current = null;
    }
  }, [applyVerifiedSession]);

  const login = useCallback(async () => {
    setIsInitializing(true);
    try {
      sessionReadyRef.current = false;
      await authenticate(true);
    } finally {
      setIsInitializing(false);
    }
  }, [authenticate]);

  const logout = useCallback(async () => {
    sessionReadyRef.current = false;
    piAuthService.logout();
    setUser(null);
    setAccessToken(null);
    setIsAuthenticated(false);
    setHasError(false);
    setAuthMessage("Signed out. Tap Sign in with Pi Network to sign in again.");
    setApiAuthToken(null);
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
    let cancelled = false;
    (async () => {
      try {
        await authenticate(false);
      } catch {
        /* vanilla boot script already logs [Pi] error */
      } finally {
        if (!cancelled) {
          setPiAvailable(isPiAvailable());
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authenticate]);

  const value = useMemo<PiAuthContextType>(
    () => ({
      user,
      accessToken,
      isAuthenticated,
      isInitializing,
      hasError,
      authMessage,
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
