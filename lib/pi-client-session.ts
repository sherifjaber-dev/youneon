"use client";

import { isRealPiUsername } from "./real-pi-user";

export const PI_AUTH_OK_EVENT = "youneon:pi-auth-ok";
export const PI_AUTH_LOGOUT_EVENT = "youneon:pi-auth-logout";
export const LITE_SESSION_KEY = "youneon_pi_session_lite";
export const AUTH_FLAG_KEY = "youneon_authenticated";
export const LEGACY_USER_KEY = "youneon_pi_current_user";

export type PiLiteSession = {
  uid: string;
  username: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function identityFromAuthResult(result: unknown): PiLiteSession | null {
  const rec = asRecord(result);
  if (!rec) return null;

  const nested = asRecord(rec.user);
  const source = nested || rec;
  const uid = typeof source.uid === "string" ? source.uid.trim() : "";
  const username = typeof source.username === "string" ? source.username.trim() : "";

  if (!uid && !username) return null;

  const identity = {
    uid: uid || username,
    username: username || uid,
  };
  if (!isRealPiUsername(identity.username) && !isRealPiUsername(identity.uid)) return null;
  return identity;
}

export function readLiteSession(): PiLiteSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LITE_SESSION_KEY);
    if (raw) {
      const data = JSON.parse(raw) as { uid?: unknown; username?: unknown };
      const uid = typeof data?.uid === "string" ? data.uid : "";
      const username = typeof data?.username === "string" ? data.username : "";
      if (uid || username) {
        const session = { uid: uid || username, username: username || uid };
        if (!isRealPiUsername(session.username) && !isRealPiUsername(session.uid)) return null;
        return session;
      }
    }
    const legacy = localStorage.getItem(LEGACY_USER_KEY);
    if (legacy) {
      const data = JSON.parse(legacy) as { uid?: unknown; username?: unknown };
      const uid = typeof data?.uid === "string" ? data.uid : "";
      const username = typeof data?.username === "string" ? data.username : "";
      if (uid || username) {
        const session = { uid: uid || username, username: username || uid };
        if (!isRealPiUsername(session.username) && !isRealPiUsername(session.uid)) return null;
        return session;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function persistLiteSession(user: PiLiteSession): void {
  if (typeof window === "undefined") return;
  if (!isRealPiUsername(user.username) && !isRealPiUsername(user.uid)) return;
  try {
    localStorage.setItem(
      LITE_SESSION_KEY,
      JSON.stringify({ uid: user.uid, username: user.username })
    );
    localStorage.setItem(AUTH_FLAG_KEY, "1");
    localStorage.setItem(
      LEGACY_USER_KEY,
      JSON.stringify({ uid: user.uid, username: user.username })
    );
  } catch {
    /* ignore */
  }
}

export function clearLiteSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LITE_SESSION_KEY);
    localStorage.removeItem(AUTH_FLAG_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch {
    /* ignore */
  }
}

export function hideStaticLoginOverlays(): void {
  if (typeof document === "undefined") return;
  try {
    document.documentElement.classList.add("youneon-signed-in");
    const nodes = document.querySelectorAll(
      ".youneon-static-login, #youneon-static-login, [data-youneon-login-host]"
    );
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i] as HTMLElement;
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("visibility", "hidden", "important");
      el.style.setProperty("pointer-events", "none", "important");
      el.setAttribute("data-youneon-login-hidden", "1");
    }
    const tree = document.getElementById("youneon-app-tree");
    if (tree) tree.style.pointerEvents = "auto";
  } catch {
    /* ignore */
  }
}

export function showStaticLoginOverlays(): void {
  if (typeof document === "undefined") return;
  try {
    document.documentElement.classList.remove("youneon-signed-in");
    const nodes = document.querySelectorAll(
      ".youneon-static-login, #youneon-static-login, [data-youneon-login-host]"
    );
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i] as HTMLElement;
      el.style.removeProperty("display");
      el.style.removeProperty("visibility");
      el.style.removeProperty("pointer-events");
      el.style.display = "flex";
      el.removeAttribute("data-youneon-login-hidden");
    }
    const tree = document.getElementById("youneon-app-tree");
    if (tree) tree.style.pointerEvents = "none";
  } catch {
    /* ignore */
  }
}

/** True only after this browsing session’s successful Pi.authenticate. */
export function isPiAuthOk(): boolean {
  if (typeof window === "undefined") return false;
  return window.__PI_AUTH_OK === true;
}

function dispatchAuthEvent(name: string, detail?: PiLiteSession): void {
  try {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  } catch {
    try {
      window.dispatchEvent(new Event(name));
    } catch {
      /* ignore */
    }
  }
}

/** Treat Pi.authenticate success (user and/or accessToken) as signed in for the UI. */
export function markPiAuthOk(result?: unknown): PiLiteSession | null {
  if (typeof window === "undefined") return null;

  const identity =
    identityFromAuthResult(result) ||
    (window.__PI_AUTH_OK === true ? readLiteSession() : null);

  if (!identity) return null;

  if (window.__PI_AUTH_OK) {
    persistLiteSession(identity);
    hideStaticLoginOverlays();
    return identity;
  }

  persistLiteSession(identity);
  hideStaticLoginOverlays();

  if (typeof window.__youneonMarkPiAuthOk === "function") {
    try {
      window.__youneonMarkPiAuthOk(result || identity);
    } catch {
      window.__PI_AUTH_OK = true;
      dispatchAuthEvent(PI_AUTH_OK_EVENT, identity);
    }
  } else {
    window.__PI_AUTH_OK = true;
    dispatchAuthEvent(PI_AUTH_OK_EVENT, identity);
  }

  window.__PI_AUTH_OK = true;
  return identity;
}

export function clearPiAuthOk(): void {
  if (typeof window === "undefined") return;
  const wasSignedIn = window.__PI_AUTH_OK === true;
  window.__PI_AUTH_OK = false;
  clearLiteSession();
  showStaticLoginOverlays();
  if (typeof window.__youneonClearPiAuth === "function") {
    try {
      window.__youneonClearPiAuth();
    } catch {
      /* ignore */
    }
  }
  if (wasSignedIn) {
    dispatchAuthEvent(PI_AUTH_LOGOUT_EVENT);
  }
}
