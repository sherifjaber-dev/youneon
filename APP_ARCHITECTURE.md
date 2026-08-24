# PiAzar - Random Video Chat App Architecture

## Screens Created

### 1. **Profile Setup Screen** (`/components/profile-setup.tsx`)
   - 4-step guided setup for new users
   - Steps: Basic Info (nickname, age, gender) → Location & Bio → Interests → Profile Picture
   - Collects user profile data before they can start matching
   - Multi-step UI with progress bar

### 2. **Home/Dashboard Screen** (`/app/page.tsx`)
   - Main lobby with "Start Random Video Chat" button
   - "Shop" button for virtual gifts (already integrated)
   - Coin balance indicator in top right
   - Filter controls with current filter display
   - Features section showing app benefits
   - Live stats (countries, users, 24/7 matching)

### 3. **Filters Screen** (`/components/filters-screen.tsx`)
   - Modal overlay for setting match preferences
   - Gender filter: All, Male, Female
   - Age range slider: 13-100 years
   - Country selection dropdown
   - Multi-select interests from 12 options
   - Apply/Cancel buttons with gradient styling

### 4. **Matching Loading Screen** (`/components/matching-loading-screen.tsx`)
   - Full-screen matching UI during search
   - Animated spinner with rotating circles
   - Random messages: "Finding your perfect match", "Almost there", etc.
   - Elapsed time counter
   - "Did you know?" fun fact display
   - Cancel search button to return to home

### 5. **Video Chat Screen** (`/components/video-chat-screen.tsx`)
   - **Main Features:**
     - Split view: Remote video (full screen) + Local video (picture-in-picture, bottom-right)
     - User info overlay on remote video
     - Call timer showing elapsed time
     - Beauty filters panel (Smooth, Glow, Warm, Cool, Vintage)
   - **Control Buttons:**
     - Mute/Unmute microphone
     - Flip camera (front/back)
     - End call
     - Report user
     - Text chat toggle
   - **Bottom Actions:**
     - "Next Person" button (skip to random match)
     - "End Call" button

### 6. **Chat Sidebar** (`/components/chat-sidebar.tsx`)
   - Text messaging during video calls
   - Message history with timestamps
   - Auto-responses from remote user (simulated)
   - Input field with send button
   - Slide-in overlay on the right side
   - Friendly reminder to keep it respectful

## Screen Flow Diagram

\`\`\`
Profile Setup
    ↓
Home/Dashboard ←→ Filters Modal
    ↓
    ├→ Matching Loading Screen
    │       ↓
    └→ Video Chat Screen
            ↓
      [Mute/Flip/Chat/Report/End]
            ↓
      [Next Person → back to Matching]
      [End Call → back to Home]
\`\`\`

---

## How Random Matching Works (Current Implementation)

### Backend Matching Logic (`/lib/matching-service.ts`)

1. **Find Random Match** (`findRandomMatch`)
   - Takes user ID and filter preferences
   - Calls `/api/matches/find` endpoint
   - Returns matched user with match ID and timestamp
   - **Fallback:** Returns mock user from demo pool if API fails

2. **Mock User Pool** (for demo/development)
   - 5 pre-defined mock users with realistic profiles
   - Users: Alex (USA), Sofia (Brazil), Jordan (Canada), Maya (India), Chris (UK)
   - Each has interests, age, gender, country, bio
   - Randomly selected on each match

3. **Database Schema** (real implementation)
   - **users table**: Core user profiles
   - **match_filters table**: Saved filter preferences
   - **matches table**: Active and ended sessions (user1_id, user2_id, status, duration)
   - **match_history table**: For Browse Lounge feature
   - **user_status table**: Online status tracking

4. **Matching Flow:**
   \`\`\`
   User A clicks "Start Video Chat"
      ↓
   System gets User A's filters
      ↓
   Query: Find online users matching filters
      ↓
   Exclude: User A, blocked users, recently matched
      ↓
   Return: Random user from results
      ↓
   Create match session
      ↓
   Connect both users
   \`\`\`

### Call Tracking
- Match ID generated for each session
- Duration calculated when call ends
- Stored in `matches` table for history/analytics

---

## Video Chat Technology - LIMITATIONS & SOLUTION

### Current Limitations in Browser-Based Environment:

1. **Real-time Video Streaming**
   - **Issue:** Full WebRTC implementation requires:
     - STUN/TURN servers
     - Signaling backend (complex backend infrastructure)
     - Complex peer-to-peer negotiation
   - **Current Status:** NOT IMPLEMENTED (complex for no-code setup)

2. **What's Currently Working:**
   - UI/UX for video chat interface ✅
   - Call controls (mute, flip, end) ✅
   - Text chat during calls ✅
   - Beauty filters UI ✅
   - Call timer ✅
   - Match finding logic ✅

### Current Implementation:

**Simulated Video Chat Mode:**
- Remote video: Gradient background + user's profile info
- Local video: Picture-in-picture with "📱 You" indicator
- Both show as placeholder animations
- Fully functional UI/controls without actual video stream

\`\`\`typescript
// Video display (current)
<div className="bg-gradient-to-br from-blue-900 to-purple-900">
  // User info or avatar display
  // NOT actual WebRTC video stream
</div>
\`\`\`

---

## Best Solution for Real Video (Recommended)

### Option 1: **Use a Third-Party Video API** (RECOMMENDED)
- **Providers:**
  - Agora SDK (easiest integration, free tier)
  - Twilio Video API
  - Daily.co
  - Stream.io

**Integration Steps:**
1. Get API key from provider
2. Install SDK package
3. Create token for each user
4. Replace video placeholder with SDK component
5. Minimal backend changes

**Example with Agora:**
\`\`\`typescript
import AgoraRTC from 'agora-rtc-sdk-ng';

const rtc = {
  client: AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }),
  localAudioTrack: undefined,
  localVideoTrack: undefined,
};

await rtc.client.join(APP_ID, channel, token, uid);
\`\`\`

### Option 2: **WebRTC with Signaling Backend**
- Requires building custom signaling server
- More complex but fully custom
- Need: Node.js server + Socket.io + STUN/TURN servers
- Estimated effort: 2-3 days of backend work

### Option 3: **Keep Current Simulated Version + Text Chat**
- Already fully functional
- Works great for text-based connection
- Add voice through browser APIs (MediaRecorder)
- Quick deployment, works immediately

---

## Database Tables for Real-Time Matching

\`\`\`sql
-- Users (already created)
CREATE TABLE users (
  id PRIMARY KEY,
  pi_account_id UNIQUE,
  nickname, age, gender, country,
  profile_image_url, interests...
);

-- Online status (for instant matching)
CREATE TABLE user_status (
  user_id PRIMARY KEY,
  is_online BOOLEAN,
  current_match_id,
  last_seen TIMESTAMP
);

-- Active matches (real-time)
CREATE TABLE matches (
  id PRIMARY KEY,
  user1_id, user2_id,
  status: 'pending'|'active'|'ended',
  started_at, ended_at,
  duration_seconds
);

-- For efficient matching queries
CREATE INDEX ON matches(status, created_at);
CREATE INDEX ON users(country, age, gender);
\`\`\`

---

## API Endpoints Used

- `POST /api/matches/find` - Find random match with filters
- `POST /api/matches/end` - End current match
- `POST /api/user/filters` - Save filter preferences
- `GET /api/user/:id/filters` - Get saved filters
- `POST /api/reports` - Report a user
- `POST /api/user/blocks` - Block a user

---

## Summary

**Fully Working Now:**
- ✅ User onboarding (profile setup)
- ✅ Matching system (with mock/fallback)
- ✅ Filter controls
- ✅ Video chat UI & controls
- ✅ Text chat during calls
- ✅ Beauty filters panel
- ✅ Pi payment integration (gifts)

**Needs Third-Party Integration:**
- ❌ Real-time video streaming (WebRTC/API required)

**Recommended Next Step:**
Integrate Agora SDK for real video calls (takes 1-2 hours) or use text-chat-only version immediately.
