# Clerk Authentication Fix - Google OAuth Sign-Up Issue

## Problem Summary

New users signing up with Google OAuth through Clerk were being redirected to the login page instead of successfully accessing the application.

## Root Cause

The issue had TWO main problems:

### 1. Missing Redirect URLs in Clerk Configuration

**CRITICAL**: The `ClerkProvider` and sign-up/sign-in pages were missing `afterSignUpUrl` and `afterSignInUrl` props, so Clerk didn't know where to redirect users after successful authentication.

### 2. Middleware Order of Operations

The middleware was creating the response BEFORE getting the auth data, which could cause failures during OAuth callbacks.

### 3. Missing Public Routes

Clerk OAuth callback routes were not properly marked as public.

### 4. No Error Handling

The middleware had no try-catch block to handle errors gracefully.

## Changes Made

### 1. **CRITICAL FIX**: Added Redirect URLs to Clerk Configuration

#### ClerkProvider (`src/layout/AuthProvider/Clerk/index.tsx`)

```typescript
<ClerkProvider
  afterSignInUrl="/"
  afterSignUpUrl="/"
  appearance={updatedAppearance}
  localization={localization}
  signInUrl="/login"
  signUpUrl="/signup"
>
```

#### Sign-Up Page (`src/app/[variants]/(auth)/signup/[[...signup]]/page.tsx`)

```typescript
<SignUp
  afterSignUpUrl="/"
  fallbackRedirectUrl="/"
  path="/signup"
/>
```

#### Login Page (`src/app/[variants]/(auth)/login/[[...login]]/page.tsx`)

```typescript
<SignIn
  afterSignInUrl="/"
  fallbackRedirectUrl="/"
  path="/login"
  signUpUrl="/signup"
/>
```

### 2. Fixed Middleware Order of Operations (`src/middleware.ts`)

**Before:**

```typescript
if (isProtected) {
  await auth.protect();
}
const response = defaultMiddleware(req);
const data = await auth();
```

**After:**

```typescript
const data = await auth(); // Get auth data FIRST
if (isProtected) {
  await auth.protect();
}
const response = defaultMiddleware(req); // Create response AFTER auth checks
```

### 3. Added Clerk OAuth Callback Routes to Public Routes

Added the following routes to the public routes list:

- `/login(.*)`
- `/signup(.*)`
- `/sso-callback`
- `/sso-callback(.*)`

### 4. Added Comprehensive Error Handling

Wrapped the entire middleware logic in a try-catch block with detailed logging:

```typescript
try {
  // middleware logic
} catch (error) {
  logClerk('Clerk middleware error: %O', error);
  console.error('Clerk middleware error:', error);
  throw error; // Re-throw to let Clerk handle the error
}
```

## Clerk Webhook Configuration

For the authentication flow to work completely, you MUST configure the Clerk webhook:

### Step 1: Get Your Webhook URL

Your webhook URL should be:

- **Local Development**: `http://localhost:3010/api/webhooks/clerk`
- **Production**: `https://pho.chat/api/webhooks/clerk`

### Step 2: Configure in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Navigate to **Webhooks** in the left sidebar
4. Click **Add Endpoint**
5. Enter your webhook URL
6. Subscribe to these events:
   - `user.created` ✅ (Required)
   - `user.updated` ✅ (Required)
   - `user.deleted` ✅ (Required)
7. Copy the **Signing Secret**
8. Add it to your `.env.local` as `CLERK_WEBHOOK_SECRET`

### Step 3: Verify Environment Variables

Ensure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

## Testing the Fix

### 1. Start the Development Server

```bash
bun run dev
```

### 2. Test New User Sign-Up

1. Open `http://localhost:3010/signup` in an incognito window
2. Click "Continue with Google"
3. Complete the Google OAuth flow
4. You should be redirected to the main application (NOT back to login)

### 3. Verify User Creation

Check the database to ensure the user was created:

```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 1;
```

### 4. Check Logs

Look for these log messages:

- `Clerk middleware processing request`
- `Clerk auth status`
- `creating user due to clerk webhook`

## Troubleshooting

### Issue: Still redirected to login after sign-up

**Possible Causes:**

1. Webhook not configured in Clerk dashboard
2. Webhook secret is incorrect
3. Database connection issue

**Solution:**

1. Verify webhook configuration in Clerk dashboard
2. Check `CLERK_WEBHOOK_SECRET` in `.env.local`
3. Check database connection with `bun run db:migrate`

### Issue: "MIDDLEWARE_INVOCATION_FAILED" error

**Possible Causes:**

1. Middleware is still crashing
2. Environment variables not loaded

**Solution:**

1. Restart the development server
2. Check all Clerk environment variables are set
3. Check the console for detailed error messages

### Issue: User created in Clerk but not in database

**Possible Causes:**

1. Webhook not reaching the server
2. Webhook secret mismatch
3. Database migration not run

**Solution:**

1. Check webhook delivery in Clerk dashboard
2. Verify `CLERK_WEBHOOK_SECRET` matches
3. Run `bun run db:migrate`

## Next Steps

1. ✅ Middleware fixed
2. ⏳ Configure Clerk webhook in dashboard
3. ⏳ Test new user sign-up flow
4. ⏳ Deploy to production
5. ⏳ Configure production webhook URL

## Additional Notes

- The middleware now logs detailed information for debugging
- All Clerk OAuth callback routes are now public
- Error handling ensures the middleware doesn't crash silently
- The user creation flow is asynchronous (webhook-based)
