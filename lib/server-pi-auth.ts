import { NextRequest } from "next/server";
import { isAdminUsername } from "@/lib/admin";
import {
  fetchPiMe,
  getPiAccessTokenFromCookie,
  normalizePiAccessToken,
  parseVerifiedPiUser,
  type PiMeUser,
} from "@/lib/pi-session";

export async function resolvePiUser(request: NextRequest): Promise<PiMeUser | null> {
  const header = request.headers.get("authorization") || "";
  const fromHeader = header.toLowerCase().startsWith("bearer ")
    ? normalizePiAccessToken(header)
    : "";
  const token = fromHeader || (await getPiAccessTokenFromCookie()) || "";
  if (!token) return null;
  const piRes = await fetchPiMe(token);
  if (!piRes.ok) return null;
  return parseVerifiedPiUser(piRes);
}

export async function requirePiUser(request: NextRequest): Promise<
  { user: PiMeUser } | { error: string; status: number }
> {
  try {
    const user = await resolvePiUser(request);
    if (!user?.username) {
      return { error: "Sign in with Pi Network first.", status: 401 };
    }
    return { user };
  } catch {
    return { error: "Could not verify your Pi account.", status: 502 };
  }
}

export async function requireAdmin(request: NextRequest): Promise<
  { user: PiMeUser } | { error: string; status: number }
> {
  const result = await requirePiUser(request);
  if ("error" in result) return result;
  if (!isAdminUsername(result.user.username)) {
    return { error: "Admin only.", status: 403 };
  }
  return result;
}
