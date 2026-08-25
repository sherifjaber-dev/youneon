import { NextRequest, NextResponse } from "next/server";

const DAILY_API = "https://api.daily.co/v1/rooms";

function dailyHost() {
  const raw = (process.env.NEXT_PUBLIC_DAILY_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!raw) return "";
  return raw.endsWith(".daily.co") ? raw : `${raw}.daily.co`;
}

function roomUrlFrom(data: { url?: string; name?: string }) {
  if (data.url) return data.url;
  const host = dailyHost();
  if (host && data.name) return `https://${host}/${data.name}`;
  return "";
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing DAILY_API_KEY. Set it on Vercel/host (never commit .env.local)." },
      { status: 500 }
    );
  }

  let body: { name?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const requestedName =
    typeof body.name === "string" ? body.name.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) : "";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const properties = {
    exp: Math.floor(Date.now() / 1000) + 60 * 30,
    eject_at_room_exp: true,
    enable_chat: false,
    enable_screenshare: false,
    max_participants: 2,
  };

  const createPayload: Record<string, unknown> = { properties };
  if (requestedName) createPayload.name = requestedName;

  const res = await fetch(DAILY_API, {
    method: "POST",
    headers,
    body: JSON.stringify(createPayload),
  });

  if (res.ok) {
    const data = await res.json();
    const url = roomUrlFrom(data);
    if (!url) return NextResponse.json({ error: "Daily did not return a room URL" }, { status: 500 });
    return NextResponse.json({ url, name: data.name });
  }

  const err = await res.text();
  const alreadyExists = requestedName && /already exists/i.test(err);

  if (alreadyExists) {
    const getRes = await fetch(`${DAILY_API}/${encodeURIComponent(requestedName)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (getRes.ok) {
      const existing = await getRes.json();
      const url = roomUrlFrom(existing);
      if (url) return NextResponse.json({ url, name: existing.name || requestedName });
    }
  }

  return NextResponse.json({ error: err.slice(0, 500) }, { status: 500 });
}
