import { NextResponse } from "next/server";
import {
  clearPiSessionCookie,
  fetchPiMe,
  getPiAccessTokenFromCookie,
  normalizePiAccessToken,
  parseVerifiedPiUser,
  setPiSessionCookie,
} from "@/lib/pi-session";

async function verifyAccessToken(accessToken: string) {
  // Identity comes only from GET /v2/me. No Pi API key is used for this flow.
  const piRes = await fetchPiMe(accessToken);

  if (piRes.status === 401) {
    await clearPiSessionCookie();
    return NextResponse.json(
      { error: "Invalid or expired Pi access token" },
      { status: 401 }
    );
  }

  if (!piRes.ok) {
    return NextResponse.json(
      { error: "Pi Network verification failed" },
      { status: 502 }
    );
  }

  const user = await parseVerifiedPiUser(piRes);
  if (!user) {
    return NextResponse.json(
      { error: "Pi user identity missing" },
      { status: 502 }
    );
  }

  await setPiSessionCookie(accessToken);
  return NextResponse.json(user);
}

export async function POST(request: Request) {
  let body: { accessToken?: unknown; uid?: unknown; username?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only the access token is used. Client-supplied uid/username are ignored.
  const accessToken =
    typeof body?.accessToken === "string" ? normalizePiAccessToken(body.accessToken) : "";

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken is required" }, { status: 400 });
  }

  try {
    return await verifyAccessToken(accessToken);
  } catch {
    return NextResponse.json(
      { error: "Could not reach Pi Network" },
      { status: 502 }
    );
  }
}

export async function GET() {
  const accessToken = await getPiAccessTokenFromCookie();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    return await verifyAccessToken(accessToken);
  } catch {
    await clearPiSessionCookie();
    return NextResponse.json(
      { error: "Could not reach Pi Network" },
      { status: 502 }
    );
  }
}

export async function DELETE() {
  await clearPiSessionCookie();
  return NextResponse.json({ ok: true });
}
