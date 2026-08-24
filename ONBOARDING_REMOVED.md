Onboarding Flow Removed - Direct Login to Discover

CHANGES MADE:
1. Removed "onboarding" from AppState type (now: "loading" | "login" | "app" | "blocked")
2. Removed ProfileOnboarding import from app/page.tsx
3. Removed onboarding render condition
4. Updated initialization logic to skip onboarding and go directly to app
5. Updated login callback to create default profile and go directly to app

FLOW NOW:
Login Screen → Discover Screen (direct, no profile setup)

DEFAULT PROFILE:
- fullName: Pi username or "User"
- age: 18
- country: Worldwide
- languages: ["en"]
- interests: ["travel", "gaming"]
- bio: "YouNeon user"

Users can still edit their profile via "Edit Profile" button in the TopBar.

STATUS: Direct login to discover fully implemented
