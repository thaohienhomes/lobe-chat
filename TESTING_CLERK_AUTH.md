# Testing Clerk Authentication - Step-by-Step Guide

## Prerequisites

1. ✅ Development server is running on `http://localhost:3010`
2. ✅ Clerk webhook is configured in Clerk dashboard
3. ✅ Environment variables are set in `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET`
4. ✅ Database is migrated and running

## Test 1: New User Sign-Up with Google OAuth

### Steps:

1. **Open Incognito Window**
   - Open a new incognito/private browsing window
   - This ensures you're testing as a completely new user

2. **Navigate to Sign-Up Page**
   - Go to: `http://localhost:3010/signup`
   - You should see the Clerk sign-up form

3. **Click "Continue with Google"**
   - Click the Google OAuth button
   - You'll be redirected to Google's OAuth consent screen

4. **Complete Google OAuth**
   - Sign in with your Google account
   - Grant permissions to the application

5. **Expected Result: Redirect to Main App**
   - ✅ You should be redirected to `http://localhost:3010/` (home page)
   - ✅ You should see the main application interface
   - ❌ You should NOT be redirected back to `/login` or `/signup`

6. **Verify User Session**
   - Check that you're logged in (look for user avatar/profile)
   - Try navigating to protected routes (e.g., `/settings`)
   - You should have full access to the application

### What to Check in Logs:

Look for these log messages in the terminal:

```
Clerk middleware processing request: GET http://localhost:3010/
Clerk auth status: { isSignedIn: true, userId: 'user_...' }
creating user due to clerk webhook
```

### If It Fails:

If you're still redirected to login:

1. Check the browser console for errors
2. Check the terminal logs for middleware errors
3. Verify the Clerk webhook is receiving events (check Clerk dashboard)
4. Check the database to see if the user was created

## Test 2: Verify User Creation in Database

### Steps:

1. **Connect to Database**

   ```bash
   # Using psql
   psql postgresql://your-connection-string
   
   # Or using a GUI tool like pgAdmin, DBeaver, etc.
   ```

2. **Query Users Table**

   ```sql
   SELECT id, clerk_id, email, created_at
   FROM users
   ORDER BY created_at DESC
   LIMIT 5;
   ```

3. **Expected Result**
   - ✅ You should see the newly created user
   - ✅ The `clerk_id` should match the user ID from Clerk
   - ✅ The `email` should match your Google account email
   - ✅ The `created_at` timestamp should be recent

### If User Not Created:

1. Check Clerk webhook delivery in Clerk dashboard
2. Verify `CLERK_WEBHOOK_SECRET` matches
3. Check terminal logs for webhook errors
4. Manually trigger webhook from Clerk dashboard

## Test 3: Existing User Sign-In

### Steps:

1. **Sign Out**
   - Click on your profile/avatar
   - Click "Sign Out"
   - You should be redirected to `/login`

2. **Sign In Again**
   - Go to: `http://localhost:3010/login`
   - Click "Continue with Google"
   - Complete Google OAuth

3. **Expected Result**
   - ✅ You should be redirected to `http://localhost:3010/` (home page)
   - ✅ You should see your previous session data
   - ✅ No new user should be created in the database

## Test 4: Protected Routes

### Steps:

1. **While Logged Out**
   - Try to access: `http://localhost:3010/settings`
   - Expected: Redirected to `/login`

2. **While Logged In**
   - Access: `http://localhost:3010/settings`
   - Expected: Settings page loads successfully

## Test 5: Webhook Delivery

### Steps:

1. **Go to Clerk Dashboard**
   - Navigate to: <https://dashboard.clerk.com/>
   - Select your application
   - Go to "Webhooks" section

2. **Check Recent Deliveries**
   - Look for recent `user.created` events
   - Status should be "200 OK"
   - Response time should be < 1 second

3. **If Webhook Failed**
   - Check the error message
   - Verify webhook URL is correct
   - Verify webhook secret matches `.env.local`
   - Try resending the webhook

## Success Criteria

All tests should pass with these results:

- ✅ New users can sign up with Google OAuth
- ✅ Users are redirected to home page after sign-up
- ✅ Users are created in the database
- ✅ Existing users can sign in
- ✅ Protected routes are properly secured
- ✅ Webhooks are delivered successfully

## Troubleshooting

### Issue: Redirected to login after sign-up

**Solution:**

1. Check that `afterSignUpUrl="/"` is set in `ClerkProvider`
2. Check that `afterSignUpUrl="/"` is set in `<SignUp>` component
3. Restart the development server

### Issue: User not created in database

**Solution:**

1. Check Clerk webhook configuration
2. Verify `CLERK_WEBHOOK_SECRET` is correct
3. Check terminal logs for webhook errors
4. Manually trigger webhook from Clerk dashboard

### Issue: Middleware errors

**Solution:**

1. Check terminal logs for detailed error messages
2. Verify all environment variables are set
3. Restart the development server
4. Check that middleware changes are applied

## Next Steps

Once all tests pass:

1. ✅ Commit the changes
2. ✅ Push to repository
3. ✅ Deploy to production
4. ✅ Configure production webhook URL in Clerk dashboard
5. ✅ Test production deployment
