# DAILY.CO VIDEO INTEGRATION GUIDE

Complete step-by-step guide to add real live video streaming to PiAzar using Daily.co.

## Why Daily.co?

- **Easiest to integrate** - Pre-built React components
- **Fastest setup** - 30 minutes total
- **Free tier** - 100 meeting minutes/month
- **Works everywhere** - All browsers and devices
- **Handles complexity** - WebRTC, STUN/TURN servers included
- **Production ready** - Used by thousands of apps

---

## STEP 1: Create Daily.co Account (5 minutes)

1. Go to **https://dashboard.daily.co**
2. Click "Sign up" (or "Start free")
3. Create account with email
4. Verify email
5. **Dashboard opens automatically**

---

## STEP 2: Generate API Key (2 minutes)

1. In Daily.co dashboard, go to **Settings** (gear icon, top right)
2. Click **API Keys** in left sidebar
3. Click **Create new key**
4. Give it a name: `PiAzar`
5. Copy the key (save it somewhere safe)
6. **API Key example:** `prk_abcdef123456...`

---

## STEP 3: Add Environment Variables (2 minutes)

### Local Development (.env.local)

Create file `/app/.env.local`:

\`\`\`
NEXT_PUBLIC_DAILY_API_KEY=prk_your_api_key_here
DAILY_API_KEY=prk_your_api_key_here
\`\`\`

### Production (Vercel)

1. Go to Vercel dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Add two variables:
   - Name: `NEXT_PUBLIC_DAILY_API_KEY` → Value: `prk_...`
   - Name: `DAILY_API_KEY` → Value: `prk_...`
5. Click "Save"

---

## STEP 4: Install Daily.co SDK (2 minutes)

Run in your terminal:

\`\`\`bash
npm install @daily-co/daily-js @daily-co/daily-react
\`\`\`

---

## STEP 5: Create Daily Room Generator API Route (5 minutes)

Create new file: `/app/api/daily-token/route.ts`

\`\`\`typescript
import { NextRequest, NextResponse } from "next/server";

const DAILY_API_KEY = process.env.DAILY_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { roomName, userName } = await request.json();

    if (!DAILY_API_KEY) {
      return NextResponse.json(
        { error: "Missing DAILY_API_KEY" },
        { status: 500 }
      );
    }

    // Create or get room
    const roomResponse = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        privacy: "private",
        properties: {
          max_participants: 2,
        },
      }),
    });

    const roomData = await roomResponse.json();

    if (!roomResponse.ok) {
      // Room might already exist, try to fetch it
      const existingRoom = await fetch(
        `https://api.daily.co/v1/rooms/${roomName}`,
        {
          headers: {
            Authorization: `Bearer ${DAILY_API_KEY}`,
          },
        }
      );

      if (existingRoom.ok) {
        const room = await existingRoom.json();
        return NextResponse.json({ roomUrl: room.data.url });
      }

      return NextResponse.json(
        { error: "Failed to create room" },
        { status: 500 }
      );
    }

    // Generate token
    const tokenResponse = await fetch(
      `https://api.daily.co/v1/meeting-tokens`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            user_name: userName,
          },
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    return NextResponse.json({
      roomUrl: `${roomData.data.url}?t=${tokenData.token}`,
      token: tokenData.token,
    });
  } catch (error) {
    console.error("Daily API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
\`\`\`

---

## STEP 6: Update Video Chat Screen (10 minutes)

Replace `/components/video-chat-screen.tsx` with:

\`\`\`typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { useDaily, useLocalSessionId, useParticipants } from "@daily-co/daily-react";
import DailyIframe from "@daily-co/daily-js";
import {
  Mic,
  MicOff,
  Repeat2,
  Flag,
  MessageCircle,
  X,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "./chat-sidebar";

interface VideoUser {
  id: string;
  nickname: string;
  age: number;
  country: string;
  interests?: string[];
  profileImage?: string;
}

interface VideoChatScreenProps {
  matchedUser: VideoUser;
  roomUrl: string;
  onEndCall: () => void;
  onNext: () => void;
  onReport: () => void;
}

export function VideoChatScreen({
  matchedUser,
  roomUrl,
  onEndCall,
  onNext,
  onReport,
}: VideoChatScreenProps) {
  const daily = useDaily();
  const participants = useParticipants();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("none");
  const [callDuration, setCallDuration] = useState(0);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleMic = () => {
    if (daily) {
      daily.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (daily) {
      daily.setLocalVideo(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = () => {
    if (daily) {
      daily.leave();
    }
    onEndCall();
  };

  const BEAUTY_FILTERS = [
    { id: "none", name: "None", icon: "✨" },
    { id: "smooth", name: "Smooth", icon: "🧴" },
    { id: "glow", name: "Glow", icon: "💫" },
    { id: "warm", name: "Warm", icon: "🔥" },
    { id: "cool", name: "Cool", icon: "❄️" },
    { id: "vintage", name: "Vintage", icon: "📸" },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-black via-purple-950 to-black flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
            {matchedUser.nickname.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold">{matchedUser.nickname}</p>
            <p className="text-gray-300 text-xs">{matchedUser.age} • {matchedUser.country}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
            <p className="text-white font-mono font-bold text-lg">{formatTime(callDuration)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        <div style={{ width: "100%", height: "100%" }}>
          <DailyIframe
            url={roomUrl}
            config={{
              showLeaveButton: false,
              showFullscreenButton: false,
              iframeStyle: {
                width: "100%",
                height: "100%",
              },
            }}
            onLoaded={() => {
              console.log("Daily video loaded");
            }}
          />
        </div>
      </div>

      <div className="relative z-10 bg-gradient-to-t from-black via-black/80 to-transparent px-4 py-8 space-y-4">
        <div className="flex gap-4 justify-center items-center flex-wrap">
          <button
            onClick={toggleMic}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition transform hover:scale-110 shadow-lg ${
              isMuted
                ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
                : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
            }`}
          >
            {isMuted ? (
              <MicOff className="w-7 h-7" />
            ) : (
              <Mic className="w-7 h-7" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-full flex items-center justify-center transition transform hover:scale-110 shadow-lg"
          >
            <Repeat2 className="w-7 h-7" />
          </button>

          <button className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-full flex items-center justify-center transition transform hover:scale-110 shadow-lg">
            <Heart className="w-7 h-7 fill-white" />
          </button>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition transform hover:scale-110 shadow-lg ${
              chatOpen
                ? "bg-gradient-to-br from-cyan-500 to-cyan-600"
                : "bg-gradient-to-br from-cyan-500/50 to-cyan-600/50 text-white"
            }`}
          >
            <MessageCircle className="w-7 h-7 text-white" />
          </button>

          <button
            onClick={onReport}
            className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full flex items-center justify-center transition transform hover:scale-110 shadow-lg"
          >
            <Flag className="w-7 h-7" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto w-full">
          <button
            onClick={onNext}
            className="py-4 px-4 rounded-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white transition transform hover:scale-105 shadow-lg active:scale-95"
          >
            ↻ Next
          </button>
          <button
            onClick={handleEndCall}
            className="py-4 px-4 rounded-2xl font-bold bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white transition transform hover:scale-105 shadow-lg active:scale-95"
          >
            ✕ End
          </button>
        </div>
      </div>

      {chatOpen && (
        <ChatSidebar
          remoteName={matchedUser.nickname}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
\`\`\`

---

## STEP 7: Update Main Page to Pass Room URL (5 minutes)

Update `/app/page.tsx` - In the `handleStartVideoChat` function:

\`\`\`typescript
const handleStartVideoChat = async () => {
  if (!userProfile || !sdk) {
    alert("Please complete your profile first");
    return;
  }

  setCurrentScreen(AppScreen.MATCHING);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    // Generate Daily room
    const roomName = `piazar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tokenResponse = await fetch("/api/daily-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomName,
        userName: userProfile.nickname,
      }),
    });

    const { roomUrl } = await tokenResponse.json();

    const match = await findRandomMatch(userProfile.nickname, filters);
    setCurrentMatch(match);
    setCurrentMatchRoom(roomUrl); // Add this state
    setCallStartTime(Date.now());
    setCurrentScreen(AppScreen.VIDEO_CHAT);
  } catch (error) {
    console.error("Error finding match:", error);
    alert("Could not find a match. Please try again.");
    setCurrentScreen(AppScreen.HOME);
  }
};
\`\`\`

Also add state for room URL:

\`\`\`typescript
const [currentMatchRoom, setCurrentMatchRoom] = useState<string | null>(null);
\`\`\`

And pass it to VideoChatScreen:

\`\`\`typescript
{currentScreen === AppScreen.VIDEO_CHAT && currentMatch && currentMatchRoom && (
  <VideoChatScreen
    matchedUser={currentMatch.user}
    roomUrl={currentMatchRoom}
    onEndCall={handleEndCall}
    onNext={handleNextPerson}
    onReport={handleReportUser}
  />
)}
\`\`\`

---

## STEP 8: Test Locally (5 minutes)

1. In terminal: `npm run dev`
2. Go to `http://localhost:3000`
3. Complete profile
4. Click "Start Random Video Chat"
5. You should see Daily.co video interface
6. Test: microphone, camera, end call

---

## STEP 9: Deploy to Vercel (5 minutes)

1. Go to **https://vercel.com**
2. Click "New Project"
3. Select your GitHub repo
4. Click "Deploy"
5. Add environment variables (from Step 3)
6. Deploy complete!

---

## TROUBLESHOOTING

**Issue: "Missing DAILY_API_KEY"**
- Check environment variables in Vercel settings
- Make sure to redeploy after adding env vars

**Issue: "Room creation failed"**
- Check Daily.co API key is correct
- Verify API key has permissions

**Issue: "Video not showing"**
- Check microphone/camera permissions
- Try incognito mode
- Restart browser

**Issue: "Daily iframe not loading"**
- Check roomUrl is correct
- Verify Daily.co account is active
- Check no CORS issues

---

## NEXT STEPS

After video is working:
1. Add WebRTC for better performance (optional)
2. Add call recording (Daily.co feature)
3. Add screen sharing (Daily.co feature)
4. Scale to more users (backend changes)

---

## COST ESTIMATION

- **Free tier:** 100 meeting minutes/month
- **Standard tier:** $0.10/minute
- **Typical user:** 5-10 min calls/day
- **Monthly cost:** ~$50-100 for 1000 active users

Daily.co offers significant discounts at scale - contact their sales team for bulk pricing.

---

**That's it! Real video is now live.** Test it out and deploy. 🎉
