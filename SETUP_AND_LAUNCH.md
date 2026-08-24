# SETUP AND LAUNCH - COMPLETE CHECKLIST

Your step-by-step guide to go from code to live app with real video.

---

## PHASE 1: PRE-LAUNCH SETUP (30 minutes)

### Step 1: Create Daily.co Account (5 min)

[ ] Go to https://dashboard.daily.co
[ ] Sign up with email
[ ] Verify email
[ ] Dashboard opens
[ ] Generate API key in Settings
[ ] **Save API key:** `prk_...`

### Step 2: Setup Environment Variables (5 min)

[ ] Create `.env.local` in project root

\`\`\`
NEXT_PUBLIC_DAILY_API_KEY=prk_your_key_here
DAILY_API_KEY=prk_your_key_here
\`\`\`

[ ] Save file

### Step 3: Install Daily SDK (2 min)

\`\`\`bash
npm install @daily-co/daily-js @daily-co/daily-react
\`\`\`

[ ] Wait for install to complete

### Step 4: Add API Route (5 min)

[ ] Create file: `/app/api/daily-token/route.ts`
[ ] Copy code from **DAILY_VIDEO_INTEGRATION.md** (Step 5)
[ ] Save file

### Step 5: Update Video Chat Component (5 min)

[ ] Read `/components/video-chat-screen.tsx`
[ ] Replace with code from **DAILY_VIDEO_INTEGRATION.md** (Step 6)
[ ] Save file

### Step 6: Test Locally (5 min)

[ ] Run: `npm run dev`
[ ] Open: `http://localhost:3000`
[ ] Create profile
[ ] Click "Start Random Video Chat"
[ ] Verify video shows up
[ ] Test microphone button
[ ] Test camera button
[ ] Test "Next" button
[ ] Test "End" button

**All working?** Continue to Phase 2.

---

## PHASE 2: DEPLOYMENT (10 minutes)

### Step 1: Push to GitHub (3 min)

\`\`\`bash
git add .
git commit -m "Add Daily.co real video integration"
git push
\`\`\`

[ ] Pushed to GitHub

### Step 2: Deploy to Vercel (5 min)

[ ] Go to https://vercel.com
[ ] Click "New Project"
[ ] Select your GitHub repo
[ ] Click "Deploy"
[ ] Add environment variables:
  - `NEXT_PUBLIC_DAILY_API_KEY` = `prk_...`
  - `DAILY_API_KEY` = `prk_...`
[ ] Click "Deploy"
[ ] Wait 2-3 minutes

**Live URL:** `https://your-project.vercel.app`

### Step 3: Test Production (2 min)

[ ] Open your Vercel URL
[ ] Test all features:
  - [ ] Profile creation
  - [ ] Matching
  - [ ] Video works
  - [ ] Chat works
  - [ ] Shop works
  - [ ] Filters work

**Everything working?** Your app is live!

---

## PHASE 3: SHARE YOUR APP (instant)

### Share on Social Media

[ ] Twitter/X: "I just launched PiAzar - a random video chat app! Try it: [URL]"
[ ] TikTok: Record demo video, link in bio
[ ] Instagram: Post screenshots
[ ] Discord: Share in tech communities
[ ] Reddit: r/SideProject, r/Startup

### Share with Friends

[ ] Send direct links to 5-10 friends
[ ] Ask for feedback
[ ] Collect bug reports

### Monitor Usage

[ ] Check Vercel analytics
[ ] Watch error logs
[ ] Track user feedback

---

## OPTIONAL: CUSTOM DOMAIN (15 minutes)

### Option A: Free Vercel Domain

[ ] You already have: `https://your-project.vercel.app`
[ ] This is your free domain

### Option B: Buy Custom Domain ($10-15/year)

[ ] Go to Namecheap.com or GoDaddy.com
[ ] Buy domain: `mypizazr.com` (or your name)
[ ] In Vercel dashboard:
  - [ ] Select project
  - [ ] Go to "Domains"
  - [ ] Add custom domain
  - [ ] Follow DNS instructions
  - [ ] Wait 10 minutes for DNS update
[ ] Test: Visit your custom domain

---

## TROUBLESHOOTING CHECKLIST

**Problem: "No video showing"**
- [ ] Check Daily.co API key is correct
- [ ] Check env vars are added to Vercel
- [ ] Check Daily.co dashboard (account active?)
- [ ] Try incognito mode
- [ ] Check browser permissions (camera/mic)

**Problem: "Build failed on Vercel"**
- [ ] Check for TypeScript errors: `npm run build`
- [ ] Check all imports are correct
- [ ] Check environment variables added
- [ ] Review Vercel build logs

**Problem: "Matching not working"**
- [ ] Clear browser cache
- [ ] Try incognito mode
- [ ] Check browser console for errors
- [ ] Restart browser

**Problem: "Shop/Payment not working"**
- [ ] Check Pi Network keys are added
- [ ] Check you're in right network (testnet vs mainnet)
- [ ] Contact Pi support

---

## SUCCESS METRICS

Your app is successful when:

- [x] At least 5 people can use it simultaneously
- [x] Video and audio work for 95% of users
- [x] App loads in under 3 seconds
- [x] No errors in console
- [x] Mobile works on iOS and Android
- [x] Users can find matches within 2 seconds
- [x] Call duration stays stable (no disconnects)

---

## NEXT STEPS (OPTIONAL IMPROVEMENTS)

### Week 1:
- [ ] Collect user feedback
- [ ] Fix bugs
- [ ] Optimize performance

### Week 2:
- [ ] Add more features (screen share, recording)
- [ ] Improve matching algorithm
- [ ] Add moderation tools

### Week 3+:
- [ ] Scale to more users
- [ ] Add mobile app (React Native)
- [ ] Add payment/premium features
- [ ] Monetize (ads, premium)

---

## GETTING HELP

**For Daily.co issues:**
- https://docs.daily.co
- support@daily.co

**For Vercel issues:**
- https://vercel.com/support
- https://github.com/vercel/next.js/discussions

**For Pi Network issues:**
- https://developers.pi-network.org
- Discord: Pi Developers

**For App issues:**
- Check browser console (F12)
- Check Vercel logs
- Ask in v0 community

---

## FINAL CHECKLIST

Before announcing your app:

- [ ] All features tested
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Video works reliably
- [ ] Chat works
- [ ] Matching fast
- [ ] Domain is custom (optional)
- [ ] Analytics tracking (optional)
- [ ] Error logging setup (optional)
- [ ] Share buttons added (optional)

---

**You're ready to launch!** 🚀

Time from start to live with real video: **~50 minutes**

Enjoy your success! 🎉
