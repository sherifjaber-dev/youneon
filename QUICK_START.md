# Quick Start Guide - PiAzar Development

## 🏃 How to Get Started

### 1. Test the App in Preview
- Click "Preview" in v0 UI
- You'll see Profile Setup screen first
- Complete the 4-step setup
- Click "Start Random Video Chat"
- See the matching animation
- View the video chat interface

### 2. File Structure
\`\`\`
app/
├── page.tsx                    # Main app with all screen logic
└── layout.tsx                  # Layout with providers

components/
├── profile-setup.tsx           # 4-step user onboarding
├── filters-screen.tsx          # Filter modal
├── matching-loading-screen.tsx # Search animation
├── video-chat-screen.tsx       # Main video interface
├── chat-sidebar.tsx            # Text messaging during call
├── gift-shop-button.tsx        # Pi payment button (exists)
├── coin-balance.tsx            # Coin indicator (exists)
└── ui/                         # shadcn components

lib/
├── matching-service.ts         # Random matching logic
├── api.ts                      # HTTP client
├── pi-payment.ts              # Pi SDK helpers
├── product-config.ts          # Payment products
└── system-config.ts           # Environment config

scripts/
└── 01-init-db.sql             # Database schema
\`\`\`

---

## 🎮 Testing the App Flow

### Full Test Scenario:
1. **Profile Setup** (4 steps)
   - Enter nickname: "TestUser"
   - Age: 25
   - Gender: Any
   - Country: USA
   - Bio: Optional
   - Interests: Select 3+
   - Photo: Optional

2. **Home Screen**
   - See "Start Random Video Chat" button
   - See "Shop" button
   - See coin balance (top right)
   - See current filters
   - Click "Filters" to modify

3. **Filters**
   - Adjust gender, age range, country, interests
   - Click "Apply Filters"
   - Back to home

4. **Start Matching**
   - Click "Start Random Video Chat"
   - See 3-second matching animation
   - Auto-navigates to video call

5. **Video Chat**
   - See matched user info
   - Try mute button
   - Try flip camera
   - Try chat sidebar
   - Try beauty filters
   - Click "Next Person" to get new match
   - Click "End Call" to return home

---

## 🔧 Key Components & Usage

### ProfileSetup
\`\`\`typescript
<ProfileSetup onComplete={(profile) => setUserProfile(profile)} />
\`\`\`
Returns: `UserProfileData` with nickname, age, gender, country, bio, interests

### FiltersScreen
\`\`\`typescript
<FiltersScreen
  onClose={() => setShowFilters(false)}
  onApply={(filters) => handleApplyFilters(filters)}
  initialFilters={currentFilters}
/>
\`\`\`
Returns: `MatchFilters` with gender, ageMin, ageMax, country, interests

### VideoChatScreen
\`\`\`typescript
<VideoChatScreen
  matchedUser={currentMatch.user}
  onEndCall={handleEndCall}
  onNext={handleNextPerson}
  onReport={handleReportUser}
/>
\`\`\`
User interface for active video call

---

## 🌐 API Integration Points

### Matching Service Functions:

**Find a random match:**
\`\`\`typescript
import { findRandomMatch } from '@/lib/matching-service';

const match = await findRandomMatch(userId, filters);
// Returns: { matchId, user, startedAt }
\`\`\`

**End a match:**
\`\`\`typescript
import { endMatch } from '@/lib/matching-service';

await endMatch(matchId, durationSeconds);
\`\`\`

**Save filters:**
\`\`\`typescript
import { saveMatchFilters } from '@/lib/matching-service';

await saveMatchFilters(userId, filters);
\`\`\`

**Report a user:**
\`\`\`typescript
import { reportUser } from '@/lib/matching-service';

await reportUser(reportedUserId, reason);
\`\`\`

**Block a user:**
\`\`\`typescript
import { blockUser } from '@/lib/matching-service';

await blockUser(blockedUserId);
\`\`\`

---

## 🎨 Styling & Customization

### Colors Used:
- **Primary Gradient**: Blue → Purple → Pink
- **Secondary**: Neutral grays
- **Accent**: Red (for end call), Green (for success)

### Modifying Colors:
Colors are defined in Tailwind classes throughout. To change:
1. Open component file
2. Find color classes (e.g., `bg-gradient-to-r from-blue-500 to-purple-500`)
3. Replace with desired colors
4. Test in preview

### Key Color Tokens:
- `from-blue-500 to-purple-500` - Primary action
- `from-pink-500 to-purple-500` - Secondary accent
- `bg-gradient-to-br from-background` - Card backgrounds
- `border-border` - Border color
- `text-muted-foreground` - Secondary text

---

## 🔌 Adding Real Video (Quick Reference)

### If using Agora SDK:

1. **Install:**
   \`\`\`bash
   npm install agora-rtc-sdk-ng
   \`\`\`

2. **Create token endpoint:**
   \`\`\`typescript
   // /api/agora/token
   POST body: { channelName, uid }
   Returns: { token }
   \`\`\`

3. **Replace video placeholder:**
   \`\`\`typescript
   import AgoraRTC from 'agora-rtc-sdk-ng';

   // In VideoChatScreen.tsx
   const handleJoinCall = async () => {
     const agoraClient = AgoraRTC.createClient({
       mode: 'rtc',
       codec: 'vp8'
     });
     
     await agoraClient.join(APP_ID, CHANNEL, TOKEN, UID);
     const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
     await agoraClient.publish([audioTrack, videoTrack]);
   };
   \`\`\`

4. **Show video in container:**
   \`\`\`typescript
   <div ref={localVideoRef} id="local-player" />
   \`\`\`

---

## 🐛 Debugging Tips

### Check component state:
\`\`\`typescript
console.log("[v0] Current screen:", currentScreen);
console.log("[v0] Filters:", filters);
console.log("[v0] Matched user:", currentMatch);
\`\`\`

### Test matching service:
\`\`\`typescript
// In browser console
const result = await findRandomMatch('user123', {
  gender: 'all',
  ageMin: 18,
  ageMax: 65,
  country: 'All',
  interests: []
});
console.log(result);
\`\`\`

### Check payments:
\`\`\`typescript
// In browser console
const { usePiAuth } = await import('@/contexts/pi-auth-context');
const auth = usePiAuth();
console.log("Products:", auth.products);
console.log("Purchases:", auth.restoredPurchases);
\`\`\`

---

## 📱 Mobile Optimization

All screens are mobile-first:
- Touch-friendly buttons (min 48px)
- Full-screen modals on small screens
- Responsive grid layouts
- Vertical stacking on mobile
- Side-by-side on tablets/desktop

Test on mobile by:
1. Open preview
2. Press F12 (dev tools)
3. Toggle device toolbar
4. Test on different screen sizes

---

## 🚀 Deployment Checklist

Before deploying to Vercel:

- [ ] Test full user flow on mobile
- [ ] Verify Pi payment flow works
- [ ] Test matching with multiple users
- [ ] Check text chat functionality
- [ ] Verify beauty filters toggle
- [ ] Test report/block features
- [ ] Check all buttons are clickable
- [ ] Verify gradients render correctly
- [ ] Test on real 4G connection
- [ ] Add real video integration (or note as future)

---

## 📞 Support

If something isn't working:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Check console logs** (F12 → Console)
3. **Verify Pi SDK loaded** (`window.Pi` should exist)
4. **Test with mock data** (matching service has fallback)
5. **Check environment variables** (in Settings → Vars)

---

## 🎯 What's Next?

1. **Immediate**: Add Agora SDK for real video (1-2 hours)
2. **Short-term**: Deploy to Vercel + test with users
3. **Medium-term**: Browse Lounge (scrollable user list)
4. **Long-term**: Group video, screen sharing, recording
