# Browser Troubleshooting Guide

## Problem: App Shows Blank Screen in Browser

### What Was Fixed:
1. **Added hydration check** - App now checks `isClient` before initializing to prevent client/server mismatch
2. **Fixed blocked screen theme** - Changed from white to dark neon theme
3. **Consistent color scheme** - All screens now use consistent dark purple/black/pink theme
4. **Proper loading state** - Loading animation displays correctly

### If App Still Shows Blank:

1. **Check Browser Console (F12)**
   - Open DevTools → Console tab
   - Look for red error messages
   - Take a screenshot and describe any errors

2. **Clear Cache**
   ```bash
   # In browser:
   - Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Clear all data for "localhost"
   - Refresh page (Ctrl+R or Cmd+R)
   ```

3. **Restart Dev Server**
   ```bash
   - Stop current server (Ctrl+C)
   - Run: npm run dev
   - Wait for "ready - started server" message
   - Refresh browser
   ```

4. **Check Network Tab**
   - Open DevTools → Network tab
   - Refresh page
   - Look for red requests (failed downloads)
   - Check if CSS/JS files are loading

### Recent Changes Made:

**app/page.tsx:**
- Added `isClient` state to prevent hydration mismatch
- Fixed blocked screen colors to match neon theme
- Added dependency array for useEffect

**Components Fixed:**
- `bottom-nav.tsx` - Dark theme
- `discover-screen.tsx` - Dark theme with purple accents
- `messages-screen.tsx` - Dark theme
- `history-screen.tsx` - Dark theme

### Testing Checklist:

1. ✓ Loading screen appears (animated "YouNeon" logo)
2. ✓ After ~2 seconds, login screen appears
3. ✓ Click "Log in with Pi Network" button
4. ✓ Fill profile info (name, age, country, interests, languages)
5. ✓ See main app with Discover tab active
6. ✓ Three tabs at bottom (Discover, Messages, History)
7. ✓ All text is white/purple/pink (not gray on white)

### If Still Broken:

1. Check that you ran `npm install` after copying files
2. Verify `package.json` has all dependencies (check for errors)
3. Check that all component imports use `@/components/...` syntax
4. Verify layout.tsx has Geist fonts imported
5. Make sure globals.css is imported in layout.tsx

## Quick Reset:

```bash
# Stop server
Ctrl+C

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Start fresh
npm run dev

# Open browser
http://localhost:3000
```

If issue persists, share exact error messages from browser console.
