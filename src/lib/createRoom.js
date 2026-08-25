const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY;
const rawDomain = (process.env.NEXT_PUBLIC_DAILY_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
const DAILY_DOMAIN = rawDomain.replace(/\.daily\.co$/i, "") || "youneon";

export async function createVideoRoom(roomName = "pi-azar-" + Date.now()) {
  try {
    if (!DAILY_API_KEY) {
      throw new Error("VITE_DAILY_API_KEY not configured in .env.local");
    }

    // Create room via Daily API
    const createRoomResponse = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: "private",
        max_participants: 2,
      }),
    });

    if (!createRoomResponse.ok) {
      const error = await createRoomResponse.json();
      throw new Error(error.error?.message || "Failed to create room");
    }

    const roomData = await createRoomResponse.json();

    // Generate token for the room
    const tokenResponse = await fetch("https://api.daily.co/v1/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomData.name,
          enable_recording: false,
          enable_chat: true,
          enable_screenshare: false,
        },
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      throw new Error(error.error?.message || "Failed to generate token");
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.token;

    const roomUrl = `https://${DAILY_DOMAIN}.daily.co/${roomData.name}?t=${token}`;

    return {
      success: true,
      roomUrl: roomUrl,
      roomName: roomData.name,
      token: token,
    };
  } catch (error) {
    console.error("Create room error:", error);
    return { success: false, error: error.message };
  }
}
