import { NextResponse } from "next/server";

export async function POST() {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing DAILY_API_KEY" }, { status: 500 });

  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      properties: {
        exp: Math.floor(Date.now() / 1000) + 60 * 30,
        eject_at_room_exp: true,
        enable_chat: false,
        enable_screenshare: false,
        max_participants: 2,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }
  const data = await res.json();
  return NextResponse.json({ url: data.url, name: data.name });
}