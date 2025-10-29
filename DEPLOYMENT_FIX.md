# 🚨 Production Deployment Fix for pho.chat

## Issue Summary

Your site is stuck on "Initializing user status..." because Clerk authentication is not properly configured in Vercel production environment.

## Root Cause

1. **Missing Environment Variables**: Clerk keys are not set in Vercel Production
2. **Configuration Logic**: The code was only checking for `NEXT_PUBLIC_ENABLE_CLERK_AUTH === 'true'` but now also auto-enables when publishable key exists

## ✅ Fix Applied

Updated `src/config/customizations.ts` to auto-enable Clerk when the publishable key is present:

```typescript
clerk: {
  enabled: process.env.NEXT_PUBLIC_ENABLE_CLERK_AUTH === 'true' ||
           process.env.NEXT_PUBLIC_ENABLE_CLERK_AUTH === '1' ||
           !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, // Auto-enable if publishable key exists
  // ...
}
```

## 🔧 Required Actions

### Step 1: Set Clerk Environment Variables in Vercel

1. Go to <https://vercel.com/dashboard>
2. Select your `lobe-chat` project
3. Navigate to **Settings** → **Environment Variables**
4. Add these variables for **Production** environment:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxx
```

**Where to get these values:**

- Go to <https://dashboard.clerk.com>
- Select your application
- Navigate to **API Keys**
- Copy the **Production** keys (NOT Development/Test keys)

### Step 2: Configure Clerk Dashboard

1. In Clerk Dashboard, go to **Domains**
2. Add your production domain: `pho.chat`
3. If using preview deployments, also add: `*.vercel.app`
4. Save changes

### Step 3: Configure Webhook (Required for Database Sync)

1. In Clerk Dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. Enter URL: `https://pho.chat/api/webhooks/clerk`
4. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Add this as `CLERK_WEBHOOK_SECRET` in Vercel

### Step 4: Verify Database Configuration

Make sure these are also set in Vercel Production:

```bash
DATABASE_URL=postgres://username:password@host:port/database
DATABASE_DRIVER=node
NEXT_PUBLIC_SERVICE_MODE=server
KEY_VAULTS_SECRET=xxxxx/xxxxxxxxxxxxxx=
```

### Step 5: Commit and Deploy

```bash
# Commit the configuration fix
git add src/config/customizations.ts
git commit -m "🔧 fix(auth): auto-enable Clerk when publishable key exists"
git push origin main

# Or if you're on a branch:
git push origin thaohienhomes/fix/subscription-checkout-prerender
```

### Step 6: Redeploy in Vercel

After setting environment variables:

1. Go to **Deployments** tab in Vercel
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

## 🔍 Verification

### Check Deployment Logs

After redeployment, check the logs for:

```
Middleware configuration: {
  enableClerk: true,  // ✅ Should be true
  enableNextAuth: false
}
```

### Test the Site

1. Visit <https://pho.chat>
2. You should see the login page (not stuck on "Initializing...")
3. Try logging in with Clerk
4. Verify user authentication works

### Run Diagnostic Script (Optional)

Locally, you can run:

```bash
bun run node scripts/check-clerk-config.js
```

## 🐛 Common Issues

### Issue: Still stuck on "Initializing user status..."

**Possible Causes:**

1. Environment variables not set in Production environment
2. Using test keys (`pk_test_`) instead of live keys (`pk_live_`)
3. Domain not configured in Clerk Dashboard
4. Cache issue - try hard refresh (Ctrl+Shift+R)

**Solution:**

1. Double-check all environment variables are set for **Production**
2. Verify keys start with `pk_live_` and `sk_live_`
3. Add `pho.chat` to Clerk allowed domains
4. Clear browser cache and try again

### Issue: "Invalid publishable key" error

**Cause:** Wrong key format or using development keys

**Solution:**

1. Go to Clerk Dashboard → API Keys
2. Copy from **Production** section (not Development)
3. Update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in Vercel
4. Redeploy

### Issue: Database connection errors

**Cause:** Missing or incorrect DATABASE_URL

**Solution:**

1. Verify `DATABASE_URL` is set correctly
2. Ensure `DATABASE_DRIVER=node` for Vercel
3. Check `NEXT_PUBLIC_SERVICE_MODE=server`
4. Test connection string format: `postgres://user:password@host:port/database`

### Issue: Webhook errors in logs

**Cause:** Webhook secret mismatch

**Solution:**

1. Get webhook signing secret from Clerk Dashboard → Webhooks
2. Update `CLERK_WEBHOOK_SECRET` in Vercel
3. Ensure webhook URL is `https://pho.chat/api/webhooks/clerk`
4. Redeploy

## 📚 Additional Resources

- **Clerk Documentation**: <https://clerk.com/docs/quickstarts/nextjs>
- **Vercel Environment Variables**: <https://vercel.com/docs/projects/environment-variables>
- **Troubleshooting Guide**: See `VERCEL_ENV_CHECKLIST.md`

## 🎯 Expected Result

After completing all steps:

- ✅ Site loads without "Initializing..." spinner
- ✅ Clerk login page appears
- ✅ Users can sign in/sign up
- ✅ User data syncs to database
- ✅ Authentication works across all pages

## 📞 Need Help?

If you're still experiencing issues after following these steps:

1. Check browser console for JavaScript errors (F12 → Console)
2. Check Vercel deployment logs for server errors
3. Verify all environment variables are set for **Production** (not Preview/Development)
4. Try a fresh deployment after clearing Vercel cache

---

**Last Updated**: 2025-10-29
**Status**: Ready to deploy
