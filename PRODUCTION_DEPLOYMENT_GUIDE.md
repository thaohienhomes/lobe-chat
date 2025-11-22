# 🚀 Production Deployment Guide - pho.chat

## ✅ **Production Readiness Status**

### **1. TypeScript Errors** ✅

- **Status**: PASSED
- **Command**: `bun run type-check`
- **Result**: Zero TypeScript errors

### **2. Database Configuration** ✅

- **Status**: CONFIGURED
- **Provider**: Neon PostgreSQL (ap-southeast-1)
- **Connection**: Pooled connection configured
- **Environment Variables**:
  - ✅ `DATABASE_URL`: Configured
  - ✅ `DATABASE_DRIVER`: `node` (correct for Vercel)
  - ✅ `KEY_VAULTS_SECRET`: Configured
  - ✅ `NEXT_PUBLIC_SERVICE_MODE`: `server`

### **3. Subscription Feature** ✅

- **Status**: FULLY IMPLEMENTED
- **Features**:
  - ✅ Subscription upgrade/downgrade API (`/api/subscription/upgrade`)
  - ✅ Prorated billing calculation
  - ✅ Sepay payment integration
  - ✅ Webhook handling for payment confirmation
  - ✅ Database schema for subscriptions
  - ✅ UI for plan selection and upgrade
  - ✅ 3 plans: Starter (39k VND), Premium (129k VND), Ultimate (349k VND)

### **4. Monitoring** ✅

- **Status**: OPERATIONAL
- **Provider**: Sentry
- **Test Endpoint**: `https://pho.chat/api/test-sentry`
- **Configuration**:
  - ✅ Sentry client config
  - ✅ Sentry server config
  - ✅ Error boundary
  - ✅ Environment variables configured

### **5. Authentication** ✅

- **Status**: CONFIGURED
- **Provider**: Clerk (sole provider)
- **Environment Variables**:
  - ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - ✅ `CLERK_SECRET_KEY`
  - ✅ `CLERK_WEBHOOK_SECRET`
  - ✅ `NEXT_PUBLIC_ENABLE_NEXT_AUTH`: `0` (NextAuth disabled)

---

## ⚠️ **CRITICAL: Fix OpenRouter API Configuration**

### **Current Issue**

OpenRouter API is misconfigured. User is getting **401 "No auth credentials found"** errors.

### **Root Cause**

User configured OpenRouter API key as `OPENAI_API_KEY` instead of `OPENROUTER_API_KEY`.

### **Fix Steps**

#### **Step 1: Access Vercel Dashboard**

1. Go to <https://vercel.com/thaohienhomes/lobe-chat/settings/environment-variables>
2. Login if needed

#### **Step 2: Remove Incorrect Variables**

Delete these 3 variables:

- ❌ `OPENAI_API_KEY`
- ❌ `OPENAI_PROXY_URL`
- ❌ `OPENAI_MODEL_LIST`

#### **Step 3: Add Correct Variable**

Add new variable:

- **Name**: `OPENROUTER_API_KEY`
- **Value**: `sk-or-v1-a47441f9b2fc691a80f2...` (your OpenRouter API key)
- **Environment**: Select all (Production, Preview, Development)

#### **Step 4: Redeploy**

Vercel will automatically trigger a new deployment after env var changes.

#### **Step 5: Test in UI**

1. Go to Settings → Language Model
2. Select **OpenRouter** provider (not OpenAI)
3. Choose models:
   - `openai/gpt-3.5-turbo`
   - `openai/gpt-4o-mini`
   - `anthropic/claude-3-5-sonnet`
   - `google/gemini-pro-1.5`
4. Send test messages

---

## 📋 **Pre-Deployment Checklist**

- [x] Zero TypeScript errors
- [x] Database configured and tested
- [x] Subscription feature implemented
- [x] Sentry monitoring operational
- [x] Clerk authentication configured
- [ ] **OpenRouter API configured** (PENDING - needs manual fix)
- [ ] Test coverage >80% (PENDING - need to run tests)

---

## 🔧 **Manual Steps Required**

### **1. Fix OpenRouter Configuration** (CRITICAL)

Follow steps in "Fix OpenRouter API Configuration" section above.

**Estimated Time**: 5 minutes

### **2. Verify Test Coverage** (RECOMMENDED)

```bash
# Run all tests
bunx vitest run --silent='passed-only'

# Check coverage
bunx vitest run --coverage
```

**Expected**: >80% coverage, all tests passing

**Estimated Time**: 10-15 minutes

---

## 🎯 **Post-Deployment Verification**

After deployment completes, verify these endpoints:

### **1. Health Check**

```bash
curl https://pho.chat/api/healthcheck
```

Expected: `200 OK`

### **2. Sentry Integration**

```bash
curl https://pho.chat/api/test-sentry
```

Expected: Error logged to Sentry

### **3. Subscription Page**

Visit: <https://pho.chat/settings/subscription>
Expected: Plans displayed correctly

### **4. OpenRouter Models**

1. Go to <https://pho.chat>
2. Select OpenRouter provider
3. Choose a model (e.g., `openai/gpt-4o-mini`)
4. Send a test message
   Expected: Response from AI model

---

## 📊 **Production Metrics to Monitor**

### **Sentry Dashboard**

- Error rate
- Performance metrics
- User sessions

### **Vercel Dashboard**

- Build success rate
- Deployment time
- Function execution time
- Bandwidth usage

### **Database (Neon)**

- Connection pool usage
- Query performance
- Storage usage

---

## 🆘 **Troubleshooting**

### **Issue: OpenRouter still returns 401**

**Solution**:

1. Check Vercel env vars are saved correctly
2. Verify deployment completed successfully
3. Check OpenRouter API key is valid at <https://openrouter.ai/keys>
4. Verify credit balance on OpenRouter account

### **Issue: Database connection errors**

**Solution**:

1. Check `DATABASE_URL` is correct in Vercel
2. Verify Neon database is running
3. Check connection pool limits
4. Review Neon dashboard for errors

### **Issue: Sentry not logging errors**

**Solution**:

1. Check `SENTRY_DSN` is configured
2. Verify Sentry project exists
3. Check Sentry quota limits
4. Review Sentry dashboard for blocked events

---

## 📞 **Support**

If you encounter issues:

1. Check Vercel deployment logs
2. Check Sentry error dashboard
3. Review Neon database logs
4. Contact support if needed

---

**Last Updated**: 2025-11-19
**Deployment Target**: THIS WEEK (ASAP)
**Status**: READY FOR PRODUCTION (pending OpenRouter fix)
