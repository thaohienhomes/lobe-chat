# Subscription Authorization Fix

## Problem Summary

**CRITICAL SECURITY ISSUE**: New users could access paid AI features (chat with AI models) without any subscription, causing unauthorized API usage and financial loss.

## Root Causes Identified

### 1. No Subscription Created for New Users

When users signed up, the system:

- ✅ Created user record in database
- ✅ Created inbox session
- ❌ **DID NOT create any subscription**

Result: Users had no subscription record, but could still access AI models.

### 2. No Subscription Validation Before AI Access

The AI chat endpoints had:

- ✅ Authentication checks (user must be logged in)
- ❌ **NO subscription validation** (didn't check if user has paid plan)

Result: Any authenticated user could make AI chat requests, regardless of subscription status.

### 3. Public Routes Allowed Unrestricted Access

In `src/middleware.ts`, the route `/webapi(.*)` was marked as public, meaning:

- All AI chat requests (`/webapi/chat/[provider]`) bypassed authentication
- Anyone could potentially make requests

## Solution Implemented

### 1. Created Subscription Service

**File**: `src/server/services/subscription/index.ts`

Features:

- `createFreeSubscription()` - Creates a free plan for new users
- `getActiveSubscription()` - Gets user's current subscription
- `canAccessAIModels()` - Checks if user can access AI (requires paid plan)
- `hasPaidSubscription()` - Checks if user has paid subscription

**Free Plan Restrictions**:

- Plan ID: `'free'`
- Status: `'active'`
- Duration: 100 years (effectively permanent)
- **AI Access**: ❌ DENIED (cannot chat with AI models)

**Paid Plans** (starter, premium, ultimate):

- **AI Access**: ✅ ALLOWED

### 2. Updated User Creation to Assign Free Plan

**File**: `src/server/services/user/index.ts`

Added automatic free subscription creation when new users sign up:

```typescript
// 4. Create a FREE subscription for the new user
const subscriptionService = new SubscriptionService(this.db);
await subscriptionService.createFreeSubscription(id);
```

### 3. Added Subscription Validation Middleware

**File**: `src/libs/trpc/middleware/subscriptionAuth.ts`

Created TRPC middleware that:

- Checks if user has active subscription
- Validates if user can access AI models
- Throws `FORBIDDEN` error if user is on free plan
- Provides upgrade URL in error message

### 4. Protected AI Chat Endpoints

#### TRPC Endpoint Protection

**File**: `src/server/routers/lambda/aiChat.ts`

Added subscription middleware to AI chat procedure:

```typescript
const aiChatProcedure = authedProcedure
  .use(serverDatabase)
  .use(subscriptionAuth) // ← NEW: Subscription validation
  .use(async (opts) => { ... });
```

#### WebAPI Endpoint Protection

**File**: `src/app/(backend)/middleware/auth/index.ts`

Added subscription validation in `checkAuth` middleware:

```typescript
// Check if user has a paid subscription
const subscriptionService = new SubscriptionService(db);
const canAccess = await subscriptionService.canAccessAIModels(userId);

if (!canAccess) {
  return createErrorResponse(ChatErrorType.Unauthorized, {
    error: 'AI model access requires a paid subscription',
    upgradeUrl: '/settings/subscription',
  });
}
```

### 5. Migration Script for Existing Users

**File**: `scripts/add-free-subscriptions.ts`

Created script to add free subscriptions to existing users who don't have one.

## Deployment Steps

### 1. Run Migration for Existing Users

```bash
# Add free subscriptions to all existing users without one
bun run scripts/add-free-subscriptions.ts
```

This will:

- Find all users without subscriptions
- Create free plan subscriptions for them
- Log the results

### 2. Deploy Code Changes

```bash
# Commit changes
git add .
git commit -m "fix: Add subscription validation for AI model access"
git push origin main
```

### 3. Verify on Production

After deployment:

1. Test with a new user account (should get free plan)
2. Try to chat with AI (should be blocked with upgrade message)
3. Upgrade to paid plan
4. Try to chat again (should work)

## Testing

### Test 1: New User Sign-Up

1. Create a new account
2. Check database for subscription:
   ```sql
   SELECT * FROM subscriptions WHERE user_id = 'USER_ID';
   ```
3. Expected: Free plan subscription exists

### Test 2: Free User Cannot Access AI

1. Sign in with free plan account
2. Try to send a chat message
3. Expected: Error message "AI model access requires a paid subscription"

### Test 3: Paid User Can Access AI

1. Upgrade to starter/premium/ultimate plan
2. Try to send a chat message
3. Expected: Chat works normally

## Monitoring

After deployment, monitor:

1. **Subscription Creation**
   - Check logs for "Free subscription created for new user"
   - Verify all new users get free subscriptions

2. **Access Denials**
   - Check logs for "User attempted to access AI models without paid subscription"
   - Monitor how many free users try to access AI

3. **Conversion Rate**
   - Track how many users upgrade from free to paid
   - Monitor upgrade page visits

## Rollback Plan

If issues occur:

1. **Immediate**: Revert deployment in Vercel
2. **Temporary Fix**: Set environment variable to disable subscription checks
3. **Investigate**: Check logs and error messages
4. **Fix**: Apply corrections and redeploy

## Security Notes

- Free plan users CANNOT access AI models
- Subscription validation happens on BOTH TRPC and WebAPI endpoints
- Database queries are optimized (uses indexes on userId)
- Error messages don't expose sensitive information

## Future Improvements

1. Add usage tracking per subscription tier
2. Implement rate limiting based on plan
3. Add subscription expiration checks
4. Send email notifications for subscription changes
5. Add admin dashboard for subscription management
