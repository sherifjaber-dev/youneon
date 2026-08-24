# YouNeon Profile Onboarding Feature

## Overview
A complete profile setup and onboarding system that appears when users first open YouNeon, making profile completion mandatory before accessing the video chat features.

## Key Features

### 1. Mandatory Profile Onboarding
- **Triggers on first app load** - Shows automatically if no profile exists
- **Multi-step form** - 4 organized steps with progress tracking
- **Profile persistence** - Stored in browser localStorage for future sessions

### 2. Profile Fields (Step-by-step)

#### Step 1: Basic Information
- Full Name (text input)
- Age (number input, minimum 18 years)

#### Step 2: Location
- Country (searchable dropdown with 40+ countries)

#### Step 3: Languages
- Multi-select: 20+ languages including English, Danish, Spanish, French, German, Arabic, etc.

#### Step 4: Interests
- Multi-select: 20+ interests including Music, Travel, Gaming, Sports, Movies, Food, Technology, Fitness, Art, Photography, Reading, Cooking, etc.

### 3. Design & UX
- **Dark modern theme** - Gray-950 to purple-950 gradient backgrounds
- **Neon accents** - Pink and violet gradients matching YouNeon branding
- **Progress bar** - Visual indicator showing completion status
- **Responsive layout** - Mobile-optimized with proper padding
- **Validation** - Each step must be completed before proceeding
- **Back/Next navigation** - Users can revise previous answers

### 4. User Profile Display
- **Discover screen** - Shows personalized greeting with user's name
- **Profile screen** - Displays complete profile information with stats
- **Edit profile** - Users can modify their profile from the Profile tab
- **Logout option** - Clear profile and restart onboarding

## Components Created

### `/components/profile-onboarding.tsx`
Main onboarding component featuring:
- 4-step form wizard
- Progress tracking
- Form validation
- Smooth transitions between steps

### `/hooks/use-user-profile.ts`
React hook for profile management:
- Load/save profile from localStorage
- Profile persistence across sessions
- Type-safe profile interface

### Updated Components
- **ProfileScreen** - Now displays user profile with edit capability
- **DiscoverScreen** - Shows personalized welcome message
- **page.tsx** - Integrated onboarding flow with profile checks

## Usage Flow

1. **First Load** → User sees onboarding (mandatory)
2. **Fill Profile** → Complete all 4 steps
3. **Save & Continue** → Profile saved, redirect to Discover
4. **Main App** → Full access to all tabs
5. **Edit Profile** → Click "Edit Profile" in Profile tab to update

## Technical Implementation

### Profile Storage
\`\`\`typescript
// Stored in localStorage as JSON
localStorage.setItem('youneon_user_profile', JSON.stringify(profile))
\`\`\`

### Profile Interface
\`\`\`typescript
interface UserProfile {
  fullName: string;
  age: number;
  country: string;
  languages: string[];
  interests: string[];
}
\`\`\`

### Loading State
- Shows spinner while checking for existing profile
- Prevents flash of content
- Professional user experience

## Styling Details
- Uses Tailwind CSS with semantic tokens
- Gradient accents: `from-pink-500 to-violet-500`
- Border colors: `border-gray-800` / `border-gray-700`
- Hover states with smooth transitions
- Active tab highlighting with gradient background

## Features for Future Enhancement
- Profile picture upload
- Age/gender privacy settings
- Edit individual sections without full re-entry
- Profile verification
- Social sharing preferences
- Video preferences (portrait/landscape mode)
