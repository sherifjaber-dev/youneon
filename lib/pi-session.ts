import { cookies } from "next/headers";

export const PI_SESSION_COOKIE = "youneon_pi_session";
export const PI_ME_URL = "https://api.minepi.com/v2/me";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export type PiMeUser = {
  uid: string;
  username: string;
};

export function normalizePiAccessToken(accessToken: string): string {
  return accessToken.replace(/^Bearer\s+/i, "").trim();
}

export async function fetchPiMe(accessToken: string): Promise<Response> {
  const token = normalizePiAccessToken(accessToken);
  return fetch(PI_ME_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
}

export async function parseVerifiedPiUser(response: Response): Promise<PiMeUser | null> {
  const me = await response.json().catch(() => null);
  if (!me || typeof me !== "object") return null;

  // Platform API UserDTO is top-level { uid, username? }. Some docs show { user: { uid, username } }.
  const nested =
    "user" in me && me.user && typeof me.user === "object"
      ? (me.user as { uid?: unknown; username?: unknown })
      : null;
  const source = nested ?? (me as { uid?: unknown; username?: unknown });
  const uid = typeof source.uid === "string" ? source.uid.trim() : "";
  if (!uid) return null;

  return {
    uid,
    username: typeof source.username === "string" ? source.username.trim() : "",
  };
}

export async function getPiAccessTokenFromCookie(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(PI_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function setPiSessionCookie(accessToken: string): Promise<void> {
  const store = await cookies();
  const token = normalizePiAccessToken(accessToken);
  store.set(PI_SESSION_COOKIE, encodeURIComponent(token), {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearPiSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(PI_SESSION_COOKIE);
}
