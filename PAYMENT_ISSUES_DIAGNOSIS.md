# 🔍 Payment Issues Diagnosis

**Date**: 2025-11-01\
**Status**: ❌ CRITICAL - Environment Variables Misconfigured\
**Deployment**: Preview (not production)

---

## 🚨 Critical Issues Identified

### Issue 1: Wrong Environment Variable Names ❌

**Problem**: The environment variables in Vercel don't match what the code expects.

**What you added in Vercel**:

```bash
SEPAY_API_KEY=COMXYNAOC1T7BUERZKTS9WB78NCR04PBKZQ...
SEPAY_ACCOUNT_NUMBER=12919899999
SEPAY_BANK_NAME=MBBank
SEPAY_WEBHOOK_URL=https://pho.chat/api/sepay/webhook
```

**What the code expects** (from `src/config/customizations.ts`):

```bash
SEPAY_SECRET_KEY=<your-api-key>          # NOT SEPAY_API_KEY
SEPAY_MERCHANT_ID=<your-merchant-id>     # MISSING
SEPAY_BANK_ACCOUNT=<your-account>        # NOT SEPAY_ACCOUNT_NUMBER
SEPAY_BANK_NAME=<your-bank-name>         # ✅ CORRECT
```

**Mock Mode Check** (line 136 in `src/config/customizations.ts`):

```typescript
mockMode: !process.env.SEPAY_SECRET_KEY || !process.env.SEPAY_MERCHANT_ID;
```

This is why the log shows:

```
🧪 MOCK SEPAY: Using mock implementation (missing SEPAY_SECRET_KEY or SEPAY_MERCHANT_ID)
```

---

### Issue 2: Database Schema Mismatch ❌

**Problem**: The code is trying to insert `masked_card_number` column, but it doesn't exist in production database.

**Error from logs**:

```
column "masked_card_number" of relation "sepay_payments" does not exist
```

**Why this happens**:

1. Migration `0037_add_masked_card.sql` exists in codebase
2. But it was never run on production database
3. The schema in `packages/database/src/schemas/billing.ts` includes `maskedCardNumber` field
4. When code tries to insert, it fails because column doesn't exist

**Schema in code** (line 29 in `packages/database/src/schemas/billing.ts`):

```typescript
maskedCardNumber: text('masked_card_number'), // e.g., '****-****-****-0366'
```

**Migration needed** (`packages/database/src/migrations/0037_add_masked_card.sql`):

```sql
ALTER TABLE "sepay_payments" ADD COLUMN "masked_card_number" TEXT;
```

---

### Issue 3: Using Preview Deployment URL ⚠️

**Problem**: The payment flow is using a preview deployment URL instead of production.

**Current URL**:

```
https://lobe-chat-9f5lh41ad-thaohienhomes.vercel.app/...
```

**Expected URL**:

```
https://pho.chat/...
```

**Why this happens**:

1. You're testing on a preview deployment (not production)
2. The code correctly uses `VERCEL_URL` for preview deployments
3. To use `pho.chat`, you need to test on the production deployment

---

## ✅ Solutions

### Solution 1: Fix Environment Variable Names (5 minutes)

**Action Required**: Rename environment variables in Vercel Dashboard

1. Go to <https://vercel.com/dashboard>

2. Select **lobe-chat** project

3. Go to **Settings → Environment Variables**

4. **Delete** these variables:
   - `SEPAY_API_KEY`
   - `SEPAY_ACCOUNT_NUMBER`
   - `SEPAY_WEBHOOK_URL` (not used for API calls)

5. **Add** these variables for **Production** environment:

   ```bash
   SEPAY_SECRET_KEY=COMXYNAOC1T7BUERZKTS9WB78NCR04PBKZQ...
   SEPAY_BANK_ACCOUNT=12919899999
   SEPAY_BANK_NAME=MBBank
   SEPAY_MERCHANT_ID=<your-merchant-id>
   ```

6. Click **Save**

**Note**: You need to find your `SEPAY_MERCHANT_ID`. Check:

- Sepay dashboard
- Sepay API documentation
- Sepay account settings
- Email from Sepay when you signed up

---

### Solution 2: Run Database Migration (10 minutes)

**Option A: Run migration manually on production database**

1. Connect to your production PostgreSQL database
2. Run this SQL:
   ```sql
   ALTER TABLE "sepay_payments" ADD COLUMN "masked_card_number" TEXT;
   CREATE INDEX IF NOT EXISTS "idx_sepay_payments_masked_card" ON "sepay_payments"("masked_card_number");
   ```

**Option B: Use Drizzle migration tool**

1. Set `MIGRATE_ON_BUILD=1` in Vercel environment variables
2. Redeploy the application
3. Migration will run automatically on build

**Option C: Remove masked_card_number from code (temporary fix)**

If you don't need credit card support right now, we can remove the `masked_card_number` field from the insert statement.

---

### Solution 3: Test on Production Deployment (2 minutes)

**Current**: Testing on preview deployment\
**Needed**: Test on production deployment

**How to access production**:

1. Go to <https://pho.chat/subscription/checkout?plan=premium>
2. Make sure you're on the production domain (not `lobe-chat-*.vercel.app`)
3. Test the payment flow

**Or**: Wait for the preview deployment to be promoted to production

---

## 📋 Step-by-Step Fix Guide

### Step 1: Fix Environment Variables (5 minutes)

1. **Delete wrong variables**:
   - ❌ `SEPAY_API_KEY`
   - ❌ `SEPAY_ACCOUNT_NUMBER`
   - ❌ `SEPAY_WEBHOOK_URL`

2. **Add correct variables**:
   - ✅ `SEPAY_SECRET_KEY=COMXYNAOC1T7BUERZKTS9WB78NCR04PBKZQ...`
   - ✅ `SEPAY_BANK_ACCOUNT=12919899999`
   - ✅ `SEPAY_BANK_NAME=MBBank`
   - ⚠️ `SEPAY_MERCHANT_ID=<find-this-value>`

### Step 2: Find SEPAY_MERCHANT_ID (10 minutes)

**Where to find it**:

1. Log in to Sepay dashboard
2. Go to **Settings** or **API Settings**
3. Look for "Merchant ID" or "Account ID"
4. Copy the value

**If you can't find it**:

- Contact Sepay support
- Check Sepay API documentation
- Check your Sepay signup email

### Step 3: Run Database Migration (10 minutes)

**Recommended**: Run SQL manually on production database

```sql
-- Add masked_card_number column
ALTER TABLE "sepay_payments" ADD COLUMN "masked_card_number" TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_sepay_payments_masked_card"
ON "sepay_payments"("masked_card_number");

-- Verify column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sepay_payments';
```

### Step 4: Redeploy (2 minutes)

1. Go to Vercel Dashboard
2. Select latest deployment
3. Click **Redeploy** button
4. Wait for deployment to complete

### Step 5: Test on Production (5 minutes)

1. Go to <https://pho.chat/subscription/checkout?plan=premium>
2. Select "Thanh toán" (Bank Transfer)
3. Click "Pay" button
4. **Expected**: Redirects to `https://pho.chat/payment/waiting`
5. **Expected**: Shows real QR code from Sepay
6. **Expected**: Shows real bank account: "12919899999" and "MBBank"

### Step 6: Check Logs (5 minutes)

1. Go to Vercel Dashboard → Deployments → Latest → Logs
2. Search for:
   - `🏦 REAL SEPAY` - Should see this (not MOCK SEPAY)
   - `Bank Account: 12919899999` - Should see this
   - `Bank Name: MBBank` - Should see this
   - `QR Code URL: https://qr.sepay.vn/img?...` - Should see this

---

## 🎯 Expected Behavior After Fix

### Bank Transfer (with correct environment variables):

```
User clicks "Pay"
  ↓
Logs show: "🏦 REAL SEPAY: Payment created with QR code"
  ↓
Logs show: "Bank Account: 12919899999"
  ↓
Logs show: "Bank Name: MBBank"
  ↓
Logs show: "QR Code URL: https://qr.sepay.vn/img?acc=12919899999&amount=1290000&bank=MBBank&des=..."
  ↓
Redirects to: https://pho.chat/payment/waiting
  ↓
Displays: Real QR code from Sepay
  ↓
User scans QR code and completes payment
```

---

## 📊 Summary

| Issue                     | Status      | Fix Required       |
| ------------------------- | ----------- | ------------------ |
| Wrong env var names       | ❌ CRITICAL | Rename in Vercel   |
| Missing SEPAY_MERCHANT_ID | ❌ CRITICAL | Find and add       |
| Database schema mismatch  | ❌ CRITICAL | Run migration      |
| Preview deployment URL    | ⚠️ EXPECTED | Test on production |
| Sepay still in mock mode  | ❌ BLOCKED  | Fix env vars first |

**Total Time**: 35-40 minutes

---

## 🔑 Key Takeaways

1. **Environment variable names MUST match exactly** what the code expects
2. **SEPAY_MERCHANT_ID is required** - find this value from Sepay dashboard
3. **Database migrations must be run** on production database
4. **Preview deployments use preview URLs** - test on production for final verification
5. **Check logs after each change** to verify the fix worked

---

## ❓ FAQ

**Q: Why is it still using mock mode after I added environment variables?**\
A: The variable names don't match. You added `SEPAY_API_KEY` but the code expects `SEPAY_SECRET_KEY`.

**Q: Where do I find SEPAY_MERCHANT_ID?**\
A: Check Sepay dashboard → Settings → API Settings, or contact Sepay support.

**Q: Why is the URL showing `lobe-chat-*.vercel.app` instead of `pho.chat`?**\
A: You're testing on a preview deployment. Test on <https://pho.chat> for production URL.

**Q: Do I need to run the database migration?**\
A: Yes, otherwise the code will fail when trying to insert payment records.

**Q: Can I skip SEPAY_MERCHANT_ID?**\
A: No, it's required. The code checks for both `SEPAY_SECRET_KEY` and `SEPAY_MERCHANT_ID`.

---

**Next Steps**: Follow the Step-by-Step Fix Guide above to resolve all issues.
