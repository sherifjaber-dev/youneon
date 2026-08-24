# PiAzar - Complete Testing Guide

## 🧪 Manual Testing Checklist

### Phase 1: Profile Setup (First Time)
- [ ] App loads and shows Profile Setup modal
- [ ] Step 1 - Basic Info:
  - [ ] Can enter nickname
  - [ ] Age slider works (13-100)
  - [ ] Gender buttons toggle
  - [ ] "Continue" button enables after nickname entered
- [ ] Step 2 - Location & Bio:
  - [ ] Country dropdown shows all countries
  - [ ] Bio textarea allows text input
  - [ ] Character counter shows 0-150
  - [ ] "Continue" button works
- [ ] Step 3 - Interests:
  - [ ] All 12 interest tags clickable
  - [ ] Selected interests show highlighted
  - [ ] Can select/deselect multiple
  - [ ] "Continue" button works (requires 1+ selected)
- [ ] Step 4 - Profile Photo:
  - [ ] File upload button works
  - [ ] Image preview appears after selection
  - [ ] "Complete Setup" button works
- [ ] Redirects to Home screen after completion

### Phase 2: Home Screen
- [ ] Header shows:
  - [ ] "🔥 PiAzar" logo
  - [ ] Coin balance in top right (with gem icon)
- [ ] Main section shows:
  - [ ] Welcome title
  - [ ] Subtitle about global connections
- [ ] Action card displays:
  - [ ] Current filter settings preview
  - [ ] "Filters" button
  - [ ] "Start Random Video Chat" button (blue-purple gradient)
  - [ ] "Shop" button (adjacent to video button)
- [ ] Features section shows:
  - [ ] HD Video (🎬)
  - [ ] Beauty Filters (✨)
  - [ ] Global Connect (🌍)
- [ ] Stats section shows:
  - [ ] 150+ Countries
  - [ ] 1M+ Active Users
  - [ ] 24/7 Live Matching
- [ ] Mobile responsiveness:
  - [ ] Buttons stack vertically on small screens
  - [ ] Text is readable
  - [ ] No overflow or clipping

### Phase 3: Filters Screen
- [ ] Opens modal when clicking "Filters"
- [ ] Shows all filter options:
  - [ ] Gender: All, Male, Female (can select one)
  - [ ] Age Range: Min and Max sliders work
  - [ ] Country: Dropdown with 13 options
  - [ ] Interests: Grid of 12 tags (multi-select)
- [ ] Filter selections persist when reopening
- [ ] "Apply Filters" button updates home screen
- [ ] "Cancel" button closes modal without saving
- [ ] X button closes modal
- [ ] Modal appearance:
  - [ ] Backdrop blur effect visible
  - [ ] Bottom sheet slides up on mobile

### Phase 4: Matching Flow
- [ ] Click "Start Random Video Chat"
- [ ] Redirects to Matching Loading Screen
- [ ] Screen shows:
  - [ ] Animated spinner (rotating circles)
  - [ ] Random message: "Finding your perfect match..."
  - [ ] Elapsed time counter (1s, 2s, 3s...)
  - [ ] Fun fact in blue box
  - [ ] "Cancel Search" button
- [ ] After 3 seconds:
  - [ ] Transitions to Video Chat Screen
  - [ ] Matched user displayed
  - [ ] Call timer starts at 0:00
- [ ] "Cancel Search" button:
  - [ ] Returns to Home screen
  - [ ] Stops loading animation

### Phase 5: Video Chat Screen
#### Layout & Display
- [ ] Remote video area:
  - [ ] Shows matched user's avatar (initials)
  - [ ] Shows user name, age, country
  - [ ] Gradient background visible
  - [ ] Full screen except for local video
- [ ] Local video (PiP):
  - [ ] Small window (bottom-right)
  - [ ] Shows "📱 You" indicator
  - [ ] Can be flipped (mirrored)
  - [ ] Has border and shadow
- [ ] Call timer:
  - [ ] Shows M:SS format
  - [ ] Increments every second
  - [ ] Visible at top of screen

#### Control Buttons
- [ ] Mute button:
  - [ ] Toggles mic icon (full/crossed out)
  - [ ] Changes color on toggle
  - [ ] Stays muted/unmuted across actions
- [ ] Flip camera button:
  - [ ] Local video flips horizontally
  - [ ] Can flip back
  - [ ] Icon rotates
- [ ] Report button:
  - [ ] Opens report modal
  - [ ] Shows user name in modal
  - [ ] Can select reason from list
- [ ] Chat button:
  - [ ] Toggles chat sidebar visibility
  - [ ] Button changes color when chat open
  - [ ] Sidebar appears on right side
- [ ] End Call button:
  - [ ] Large red button at bottom
  - [ ] Ends call immediately
  - [ ] Returns to Home screen
- [ ] Next Person button:
  - [ ] Shows matching animation
  - [ ] Loads new random user
  - [ ] Resets call timer
  - [ ] Call duration recorded

#### Beauty Filters Panel
- [ ] Filters panel appears at top-left
- [ ] Shows 6 filter options:
  - [ ] None (✨)
  - [ ] Smooth (🧴)
  - [ ] Glow (💫)
  - [ ] Warm (🔥)
  - [ ] Cool (❄️)
  - [ ] Vintage (📸)
- [ ] Can click each filter
- [ ] Selected filter shows with pink highlight
- [ ] Default is "None"

#### Text Chat Sidebar
- [ ] Appears when Chat button clicked
- [ ] Shows message history with timestamps
- [ ] Messages alternate left/right (local/remote)
- [ ] Input field at bottom
- [ ] "Send" button works
- [ ] After sending, message appears with timestamp
- [ ] Auto-response appears after 1 second
- [ ] Close button (X) hides sidebar
- [ ] Message scroll auto-moves to bottom

### Phase 6: Report Modal
- [ ] Opens when clicking Report button
- [ ] Shows:
  - [ ] Alert icon
  - [ ] "Report [UserName]" title
  - [ ] Help text
  - [ ] 7 reason options as buttons
  - [ ] Blue info box about anonymity
- [ ] Reason selection:
  - [ ] Can click each reason
  - [ ] Selected shows with red highlight
  - [ ] If "Other" selected, textarea appears
- [ ] Submission:
  - [ ] "Submit Report" button works
  - [ ] Alert message shows "User reported"
  - [ ] Returns to Home screen
  - [ ] Current call ends
- [ ] Cancel button:
  - [ ] Closes modal
  - [ ] Keeps call active

### Phase 7: Shop/Payment Button
- [ ] "Shop" button visible on Home screen
- [ ] Click opens purchase dialog
- [ ] Shows:
  - [ ] Product: "Virtual gifts, coins, or premium features"
  - [ ] Price: "1.0 Pi"
  - [ ] Purchase button
  - [ ] Confirmation dialog
- [ ] On successful purchase:
  - [ ] Success message shows
  - [ ] Coin balance updates (if implemented)
- [ ] On cancelled purchase:
  - [ ] Dialog closes
  - [ ] Returns to home

### Phase 8: Coin Balance
- [ ] Top-right indicator shows:
  - [ ] Gem icon (💎)
  - [ ] Current balance number
  - [ ] Updates after purchase

---

## 🔧 Integration Testing

### Pi Network Authentication
- [ ] Pi SDK loads successfully
- [ ] User can login with Pi account
- [ ] User info retrieves correctly
- [ ] Products list loads
- [ ] Purchase flow completes
- [ ] Error handling shows appropriate messages

### Database Integration (When Connected)
- [ ] User profile saves to database
- [ ] Filters save to database
- [ ] Match records created
- [ ] Call duration recorded
- [ ] Reports stored correctly
- [ ] Blocks prevent future matches

### Performance Testing
- [ ] Modals open/close smoothly
- [ ] Button clicks are responsive
- [ ] No lag when scrolling chat
- [ ] Animations run at 60fps
- [ ] Page load time < 3 seconds
- [ ] No memory leaks on long sessions

---

## 📱 Mobile Testing (Critical!)

### Screen Sizes Tested
- [ ] iPhone SE (375px)
- [ ] iPhone 12 (390px)
- [ ] iPhone 14 Pro (393px)
- [ ] Pixel 4 (412px)
- [ ] Pixel 6 (412px)
- [ ] Tablet (768px)
- [ ] iPad (1024px)

### Mobile-Specific Checks
- [ ] Touch targets are 48px minimum
- [ ] Buttons don't overlap
- [ ] Text is readable (not too small)
- [ ] Modals don't exceed screen height
- [ ] Scroll works smoothly
- [ ] No horizontal scroll
- [ ] Keyboard doesn't hide inputs
- [ ] Chat sidebar works on mobile

---

## 🎨 Visual Testing

### Color & Design
- [ ] Gradient backgrounds render correctly
- [ ] Text contrast is adequate (WCAG AA)
- [ ] Hover states visible on desktop
- [ ] Active states clear
- [ ] Disabled buttons look disabled
- [ ] Icons are crisp and clear
- [ ] Spacing is consistent

### Animation & Motion
- [ ] Loading spinner rotates smoothly
- [ ] Modal slides in/out smoothly
- [ ] Transitions are not jerky
- [ ] No animation flicker
- [ ] Motion respects prefers-reduced-motion

---

## ♿ Accessibility Testing

- [ ] All buttons have clear labels
- [ ] Form inputs have associated labels
- [ ] Color isn't only way to convey info
- [ ] Keyboard navigation works (Tab through buttons)
- [ ] Focus states visible
- [ ] Alt text on images
- [ ] Screen reader friendly (test with NVDA/JAWS)
- [ ] No color contrast issues

---

## 🔒 Security Testing

- [ ] User data doesn't expose in console
- [ ] API calls over HTTPS only
- [ ] No sensitive data in localStorage
- [ ] Session data secure
- [ ] Report submission doesn't expose user identity
- [ ] Block list prevents matching
- [ ] No SQL injection vectors
- [ ] CORS headers correct

---

## 🐛 Bug Check

### Common Issues to Test
- [ ] Rapid button clicks don't break app
- [ ] Back button behavior correct
- [ ] Refresh page keeps user logged in
- [ ] Opening filters doesn't reset state
- [ ] Chat messages persist correctly
- [ ] No console errors
- [ ] Network errors handled gracefully
- [ ] Timeout scenarios handled
- [ ] Race conditions handled (multiple clicks)

---

## 📊 Regression Testing

After any changes, verify:
- [ ] Profile setup still works end-to-end
- [ ] Home screen displays correctly
- [ ] Filters apply and persist
- [ ] Matching animation works
- [ ] Video chat screen loads
- [ ] All controls functional
- [ ] Chat messages send/receive
- [ ] Report modal opens/submits
- [ ] Shop button works
- [ ] Mobile responsive

---

## ✅ Pre-Deployment Checklist

### Functionality
- [ ] All 6 screens working
- [ ] Navigation flows properly
- [ ] No broken links
- [ ] No console errors
- [ ] All buttons clickable
- [ ] Forms submit correctly
- [ ] Data persists appropriately

### Performance
- [ ] Page loads in < 3 seconds
- [ ] No layout shifts
- [ ] Animations are smooth
- [ ] No memory leaks
- [ ] Responsive to all screen sizes

### Security
- [ ] Secrets not exposed
- [ ] HTTPS only
- [ ] Input validated
- [ ] SQL injection prevented
- [ ] XSS prevention

### UX
- [ ] Loading states show
- [ ] Error messages clear
- [ ] Success messages visible
- [ ] Touch-friendly (48px buttons)
- [ ] Intuitive flow

### Documentation
- [ ] README updated
- [ ] API docs complete
- [ ] Component props documented
- [ ] Deployment instructions clear

---

## 🎯 Success Criteria

✅ **App is ready for production when:**
- All screens render without errors
- All buttons and forms functional
- Mobile experience smooth
- No console warnings/errors
- Performance acceptable
- User flow logical and intuitive
- Data persists correctly
- Error handling works
- Payment flow complete
- Documentation complete

**Ready to add real video streaming via Agora/Twilio/Daily.co for final feature parity!**
