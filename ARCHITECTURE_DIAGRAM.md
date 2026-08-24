# PiAzar Architecture Diagram

## Application Flow Diagram

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                     PiAzar Application                      │
│                   (Main: /app/page.tsx)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─ Pi Auth Provider
                            │  (usePiAuth hook)
                            │
                            └─ State Management
                               ├─ currentScreen
                               ├─ userProfile
                               ├─ filters
                               ├─ currentMatch
                               └─ callStartTime

                            ↓↓↓
        ┌───────────────────────────────────────┐
        │         Screen Selection Logic        │
        └───────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬──────────────┐
        ▼           ▼           ▼              ▼
    PROFILE_    MATCHING_    VIDEO_CHAT    HOME
    SETUP       LOADING      SCREEN        SCREEN
    
┌──────────────────┐  ┌────────────────┐  ┌─────────────────┐
│ ProfileSetup     │  │ Matching       │  │ VideoChatScreen │
│ (4 steps)        │  │ LoadingScreen  │  │ + ChatSidebar   │
│                  │  │                │  │                 │
│ ├─ Basic Info    │  │ ├─ Spinner     │  │ ├─ Remote video │
│ ├─ Location      │  │ ├─ Messages    │  │ ├─ Local PiP    │
│ ├─ Interests     │  │ ├─ Timer       │  │ ├─ Controls     │
│ └─ Photo         │  │ └─ Cancel btn  │  │ ├─ Beauty filt. │
└──────────────────┘  └────────────────┘  │ └─ Chat toggle  │
                                           └─────────────────┘
         │                    │                    │
         │                    │                    │
    onComplete()        3-sec delay          onEndCall()
         │                    │            onNext()
         │                    │            onReport()
         ▼                    ▼                    ▼
    Home Screen ────────────────────────────────────────────
    ├─ Filters Toggle
    ├─ Start Button
    ├─ Shop Button
    └─ Stats
\`\`\`

## Database Architecture

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    Database (Supabase)                   │
└─────────────────────────────────────────────────────────┘
         │
    ┌────┴────┬────────────┬──────────────┬──────────────┐
    │          │            │              │              │
    ▼          ▼            ▼              ▼              ▼
  USERS    MATCHES    MATCH_FILTERS  USER_STATUS  PRIVACY_SETTINGS
  
┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌────────────┐
│   USERS    │  │  MATCHES   │  │MATCH_FILTERS │  │USER_STATUS │
├────────────┤  ├────────────┤  ├──────────────┤  ├────────────┤
│ id (PK)    │  │ id (PK)    │  │ id (PK)      │  │ user_id(PK)│
│ pi_acct_id │  │ user1_id   │  │ user_id      │  │ is_online  │
│ nickname   │  │ user2_id   │  │ gender_pref  │  │last_seen   │
│ age        │  │ status     │  │ age_min      │  │curr_match  │
│ gender     │  │ started_at │  │ age_max      │  └────────────┘
│ country    │  │ ended_at   │  │ country_pref │
│ bio        │  │ duration   │  │ interests    │
│ profile_img│  └────────────┘  └──────────────┘
│ interests  │
└────────────┘

Foreign Keys:
  MATCHES.user1_id → USERS.id
  MATCHES.user2_id → USERS.id
  MATCH_FILTERS.user_id → USERS.id
  USER_STATUS.user_id → USERS.id
  PRIVACY_SETTINGS.user_id → USERS.id
\`\`\`

## API Endpoints Called

\`\`\`
Client                          Server
                  │
        POST /api/matches/find
        {userId, filters}  ─────────────────→ ✓ Find random user
                                              ✓ Create match
                                              ✓ Update user status
                  │                           │
                  ←────── {matchId, user}  ────
                  │
        POST /api/matches/end
        {matchId, duration} ─────────────────→ ✓ Record call time
                                              ✓ Update match status
                  │                           │
                  ←────────── {success} ──────
                  │
        POST /api/user/filters
        {userId, filters} ─────────────────→ ✓ Save filter prefs
                  │                           │
                  ←────────── {success} ──────
                  │
        GET /api/user/:id/filters ─────────────→ ✓ Retrieve filters
                  │                           │
                  ←────────── {filters} ──────
                  │
        POST /api/reports
        {reportedId, reason} ─────────────────→ ✓ Record report
                                               ✓ Flag user
                  │                           │
                  ←────────── {success} ──────
                  │
        POST /api/user/blocks
        {blockedUserId} ─────────────────→ ✓ Add to blocklist
                                          ✓ Prevent matching
                  │                           │
                  ←────────── {success} ──────
\`\`\`

## Component Hierarchy

\`\`\`
App (page.tsx)
│
├─ Header
│  ├─ Logo "PiAzar"
│  └─ CoinBalance
│
├─ Main Content (Screen Selection)
│  │
│  ├─ ProfileSetup [IF first_time]
│  │  ├─ Step 1: BasicInfo
│  │  ├─ Step 2: Location/Bio
│  │  ├─ Step 3: Interests
│  │  └─ Step 4: Photo
│  │
│  ├─ MatchingLoadingScreen [IF matching]
│  │  ├─ Spinner Animation
│  │  ├─ Status Messages
│  │  ├─ Timer
│  │  └─ Cancel Button
│  │
│  ├─ VideoChatScreen [IF in_call]
│  │  ├─ Remote Video Area
│  │  │  └─ User Info Overlay
│  │  │
│  │  ├─ Local Video (PiP)
│  │  │
│  │  ├─ Beauty Filters Panel
│  │  │
│  │  ├─ Control Buttons
│  │  │  ├─ Mute/Unmute
│  │  │  ├─ Flip Camera
│  │  │  ├─ Report
│  │  │  ├─ Chat Toggle
│  │  │  └─ End Call
│  │  │
│  │  ├─ Bottom Action Buttons
│  │  │  ├─ Next Person
│  │  │  └─ End Call
│  │  │
│  │  └─ ChatSidebar [IF chat_open]
│  │     ├─ Message List
│  │     ├─ Input Field
│  │     ├─ Send Button
│  │     └─ Close Button
│  │
│  └─ HomeScreen [DEFAULT]
│     ├─ Welcome Title
│     ├─ Action Card
│     │  ├─ Current Filters Display
│     │  ├─ Filter Button
│     │  ├─ Start Video Button
│     │  └─ Shop Button
│     ├─ Features Section
│     └─ Stats Section
│
└─ Modals (Conditional)
   ├─ FiltersScreen [IF filters_open]
   │  ├─ Gender Selection
   │  ├─ Age Range Slider
   │  ├─ Country Dropdown
   │  ├─ Interests Multi-Select
   │  └─ Apply/Cancel
   │
   └─ ReportModal [IF report_open]
      ├─ Report Reason Select
      ├─ Custom Reason Textarea
      ├─ Info Message
      └─ Submit/Cancel
\`\`\`

## User Journey Map

\`\`\`
┌─────────────┐
│  New User   │
└──────┬──────┘
       │
       ▼
  ┌─────────────────┐
  │ Profile Setup   │
  │ (4 steps)       │
  │ ✓ Complete      │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Home Screen     │
  │ See Buttons     │
  └────────┬────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐  ┌──────────┐
│Filter? │  │Start?    │
└────┬───┘  └─────┬────┘
     │            │
     ▼            │
┌───────────┐     │
│Adjust     │     │
│Filters    │     │
└──────┬────┘     │
       │          │
       └─────┬────┘
            │
            ▼
    ┌────────────────┐
    │ Matching...    │
    │ (3 seconds)    │
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │ Video Chat     │
    │ Matched!       │
    └────────┬───────┘
             │
       ┌─────┴─────┬────────┐
       │           │        │
       ▼           ▼        ▼
   ┌─────┐   ┌──────┐  ┌────────┐
   │Next?│   │Chat? │  │Report? │
   └──┬──┘   └──┬───┘  └───┬────┘
      │        │           │
      ▼        ▼           ▼
   ┌─────────────────────────────┐
   │ Back to Home or New Match   │
   └─────────────────────────────┘
\`\`\`

## Matching Algorithm Flow Chart

\`\`\`
                START
                 │
                 ▼
    ┌─────────────────────────┐
    │ User Clicks "Start"     │
    └────────────┬────────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │ Load Saved Filters      │
    │ (or use default)        │
    └────────────┬────────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │ Show Matching Screen    │
    │ (3 second animation)    │
    └────────────┬────────────┘
                 │
                 ▼
    ┌──────────────────────────────────────┐
    │ Query Database:                       │
    │  WHERE is_online = true              │
    │   AND age BETWEEN min AND max         │
    │   AND gender MATCHES preference       │
    │   AND country = preference            │
    │   AND NOT IN (blocked_users)          │
    │   AND NOT IN (recently_matched)       │
    │   AND NOT (self)                      │
    └────────────┬─────────────────────────┘
                 │
            ┌────┴────┐
            │          │
            ▼          ▼
        ┌────┐   ┌─────────┐
        │ 0  │   │ 1+      │
        │ Found│  │ Found   │
        └──┬──┘   └────┬────┘
           │           │
           │      ┌────┴────┐
           │      │          │
           │      ▼          ▼
           │   ┌─────────┐ ┌────────┐
           │   │Random   │ │Random  │
           │   │Select   │ │Pick    │
           │   └────┬────┘ └───┬────┘
           │        │          │
           │      ┌─┴──┐       │
           │      │    └───────┴──────┐
           │      │                   │
           ▼      ▼                   ▼
        ┌──────────────────────┐ ┌──────┐
        │ No match found       │ │Match │
        │ Error message        │ │Found │
        │ Back to home         │ └──┬───┘
        └──────────────────────┘    │
                                   ▼
                        ┌─────────────────────┐
                        │ Create Match Entry  │
                        │ (matchId, user1/2) │
                        └────────────┬────────┘
                                    │
                                    ▼
                        ┌─────────────────────┐
                        │ Update user_status  │
                        │ (is_online, match)  │
                        └────────────┬────────┘
                                    │
                                    ▼
                        ┌─────────────────────┐
                        │ Show Video Chat     │
                        │ Start Timer         │
                        └─────────────────────┘
\`\`\`

## Data Flow Diagram

\`\`\`
┌──────────────┐
│  User Input  │
└──────┬───────┘
       │
       ├─ Click "Start Video"
       ├─ Adjust Filters
       ├─ Send Message
       ├─ Click Controls
       └─ Report User
       │
       ▼
┌─────────────────────┐
│  Page State Update  │
│  (React useState)   │
└─────┬───────────────┘
      │
      ├─ currentScreen
      ├─ filters
      ├─ currentMatch
      ├─ userProfile
      └─ callStartTime
      │
      ▼
┌────────────────────────┐
│  Matching Service API  │
│  (/lib/matching-svc)   │
└─────┬──────────────────┘
      │
      ├─ findRandomMatch()
      ├─ endMatch()
      ├─ saveMatchFilters()
      ├─ reportUser()
      └─ blockUser()
      │
      ▼
┌──────────────────────┐
│  Backend Endpoints   │
│  (/api/...)          │
└─────┬────────────────┘
      │
      ├─ POST /api/matches/find
      ├─ POST /api/matches/end
      ├─ POST /api/user/filters
      ├─ GET /api/user/:id/filters
      ├─ POST /api/reports
      └─ POST /api/user/blocks
      │
      ▼
┌──────────────────────┐
│  Database Queries    │
│  (Supabase/SQL)      │
└─────┬────────────────┘
      │
      ├─ UPDATE user_status
      ├─ SELECT * FROM users
      ├─ INSERT matches
      ├─ INSERT reports
      ├─ INSERT blocks
      └─ UPDATE match_filters
      │
      ▼
┌─────────────────────┐
│  Response → UI      │
│  Re-render          │
└─────────────────────┘
\`\`\`

---

## Color Scheme

\`\`\`
Primary Gradient:     Blue (500) → Purple (500) → Pink (500)
  Used for: Buttons, active states, primary CTA

Secondary:            Gray (700) for controls, muted (300-900) for backgrounds

Status Colors:
  ├─ Success:         Green (500) - Matches, confirmations
  ├─ Error:           Red (500) - End call, report, cancel
  ├─ Warning:         Yellow (500) - Info messages
  └─ Info:            Blue (500) - Status messages

Text:
  ├─ Foreground:      White (#FFFFFF)
  ├─ Muted:           Gray (400)
  └─ Background:      Black/Dark (900-950)
\`\`\`

---

**Complete architecture ready for development, testing, and deployment!**
