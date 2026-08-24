# DEPLOYMENT GUIDE - HOW TO LAUNCH PIAZAR

Complete step-by-step guide to deploy PiAzar to production so others can use it.

## DEPLOYMENT OPTIONS

1. **Vercel (RECOMMENDED)** - Easiest, free tier available
2. **Netlify** - Also easy, free tier available  
3. **AWS** - More complex, but powerful

This guide uses **Vercel** (what most people use).

---

## OPTION 1: VERCEL DEPLOYMENT (RECOMMENDED)

### Step 1: Prepare Your Code (2 minutes)

1. Make sure all code is committed to GitHub
2. Run locally to verify: `npm run dev`
3. Everything working? Good!

### Step 2: Connect to Vercel (3 minutes)

1. Go to **https://vercel.com**
2. Click "Sign Up" or "Log In"
3. Connect your GitHub account (follow prompts)
4. Select your PiAzar repository
5. Click "Import"

### Step 3: Configure Environment Variables (3 minutes)

In the deployment settings, add these:

\`\`\`
NEXT_PUBLIC_DAILY_API_KEY = prk_your_api_key
DAILY_API_KEY = prk_your_api_key
\`\`\`

You can also add Pi Network keys if needed:

\`\`\`
NEXT_PUBLIC_PI_NETWORK_API_KEY = your_pi_key
\`\`\`

### Step 4: Deploy (1 minute)

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. You get a live URL: `https://your-project.vercel.app`

### Step 5: Share Your App (instantly)

Your app is now live! Share the URL with:
- Friends
- Social media
- Your community

---

## CUSTOM DOMAIN (OPTIONAL - 5 minutes)

Want your own domain instead of `vercel.app`?

### Option A: Use Free Domain

Vercel gives free `.vercel.app` subdomain automatically.

### Option B: Buy Custom Domain

1. Buy domain from:
   - Namecheap ($1-10/year)
   - GoDaddy ($5-15/year)
   - Google Domains ($12/year)

2. In Vercel dashboard:
   - Select project
   - Go to "Domains"
   - Add your domain name
   - Follow DNS setup instructions

3. Wait 5-10 minutes for DNS to update

**Done!** Your app is now at `yourdomain.com`

---

## OPTION 2: NETLIFY DEPLOYMENT

### Step 1: Prepare Code

Same as Vercel Step 1.

### Step 2: Connect to Netlify

1. Go to **https://netlify.com**
2. Click "Sign Up"
3. Connect GitHub
4. Select PiAzar repo
5. Click "Deploy"

### Step 3: Add Environment Variables

1. In Netlify dashboard, select project
2. Go to "Build & Deploy" → "Environment"
3. Add:
   - `NEXT_PUBLIC_DAILY_API_KEY`
   - `DAILY_API_KEY`

4. Redeploy (click "Trigger deploy")

### Step 4: Done!

URL: `https://your-project.netlify.app`

---

## POST-DEPLOYMENT CHECKLIST

- [ ] App loads without errors
- [ ] Can create profile
- [ ] Matching finds users quickly
- [ ] Video works (if Daily.co integrated)
- [ ] Chat works
- [ ] Shop/payment works
- [ ] Mobile responsive
- [ ] Share URL with others

---

## MONITORING & UPDATES

### View Logs

**Vercel:**
1. Dashboard → Select project
2. Click "Deployments"
3. Select latest deployment
4. Click "Logs"

**Netlify:**
1. Dashboard → Select project
2. Click "Deploys"
3. Select latest deploy
4. Click "Deploy log"

### Make Updates

1. Make changes locally
2. Test with `npm run dev`
3. Commit to GitHub
4. Vercel/Netlify auto-deploys
5. Done!

### Rollback (if something breaks)

**Vercel:**
1. Go to "Deployments"
2. Find previous working version
3. Click "Redeploy"

**Netlify:**
1. Go to "Deploys"
2. Find previous version
3. Click "Restore"

---

## PERFORMANCE OPTIMIZATION

After deployment, consider:

### 1. Enable Edge Functions

Vercel: Automatic for Next.js  
Netlify: Not available for Next.js

### 2. Use CDN

Both Vercel and Netlify use global CDNs automatically.

### 3. Monitor Performance

**Vercel Analytics:**
- Real-time user metrics
- Core Web Vitals
- Error tracking

**Netlify Analytics:**
- Basic analytics included
- Track page views

### 4. Optimize Images

All images should be optimized:
\`\`\`typescript
import Image from 'next/image';

<Image src="/logo.png" width={100} height={100} />
\`\`\`

---

## SCALING TO MORE USERS

As your app grows:

### Database

Currently: Mock users  
Upgrade to: Supabase PostgreSQL

### Video

Currently: Daily.co (free tier)  
Upgrade to: Paid Daily.co plan ($0.10/min)

### Backend

Currently: Next.js API routes  
Upgrade to: Dedicated backend (Node.js, Python)

### Storage

Currently: Browser localStorage  
Upgrade to: Database + S3 for images

---

## TROUBLESHOOTING DEPLOYMENT

**Issue: "Build failed"**
- Check for TypeScript errors: `npm run build`
- Check environment variables added
- Review build logs

**Issue: "Blank page"**
- Check browser console for errors
- Clear cache and reload
- Check environment variables

**Issue: "Videos not working after deployment"**
- Verify Daily.co API key is correct
- Check it's in environment variables
- Redeploy after adding env vars

**Issue: "Payment not working"**
- Verify Pi Network API key
- Check it's in environment variables
- Test in sandbox mode first

---

## ANALYTICS & MONITORING

### Track User Activity

Add Google Analytics:

\`\`\`typescript
// In layout.tsx
import { Analytics } from "@vercel/analytics/react";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
\`\`\`

### Monitor Errors

Add Sentry (error tracking):

\`\`\`bash
npm install @sentry/react
\`\`\`

---

## COST BREAKDOWN

### Monthly Costs

| Service | Free Tier | Paid | Notes |
|---------|-----------|------|-------|
| **Vercel** | Yes | $20/mo | Includes functions |
| **Netlify** | Yes | $19/mo | Good for static sites |
| **Daily.co** | 100 min | $0.10/min | Pay as you go |
| **Supabase** | 500MB | $25/mo | Database |
| **Domain** | - | $10/yr | Custom domain |
| **Total** | ~$100/mo | ~$200-300/mo | For 1000 active users |

---

## SUPPORT

If something breaks:

1. Check browser console (F12)
2. Check deployment logs
3. Check Daily.co dashboard
4. Ask in v0 community
5. Contact Vercel support

---

**Your app is live! Share it with the world.** 🚀
