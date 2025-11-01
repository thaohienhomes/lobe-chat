# ✅ Correct Vercel Environment Variables

**Quick Reference Guide for pho.chat Production Deployment**

---

## 🔴 WRONG Variables (Currently in Vercel - DELETE THESE)

```bash
❌ SEPAY_API_KEY=COMXYNAOC1T7BUERZKTS9WB78NCR04PBKZQ...
❌ SEPAY_ACCOUNT_NUMBER=12919899999
❌ SEPAY_WEBHOOK_URL=https://pho.chat/api/sepay/webhook
```

---

## ✅ CORRECT Variables (Add These to Vercel)

### Sepay Configuration (Required for Bank Transfer)

```bash
# API Authentication
SEPAY_SECRET_KEY=COMXYNAOC1T7BUERZKTS9WB78NCR04PBKZQ...
SEPAY_MERCHANT_ID=<find-this-in-sepay-dashboard>

# Bank Account Information (for QR code generation)
SEPAY_BANK_ACCOUNT=12919899999
SEPAY_BANK_NAME=MBBank

# Optional: Webhook URL (if you want to receive payment notifications)
SEPAY_NOTIFY_URL=https://pho.chat/api/payment/sepay/webhook
```

### Polar Configuration (Already Correct ✅)

```bash
# API Authentication
POLAR_ACCESS_TOKEN=polar_oat_u5ZMYmqOdeH4KqUIXJ4Kfo_...
POLAR_SERVER=production
POLAR_WEBHOOK_SECRET=polar_whs_m8dutv7Pek0lqmuMkaa8FaM_...

# Product IDs (6 total - 3 plans × 2 billing cycles)
POLAR_PRODUCT_STARTER_MONTHLY_ID=7472c98c-2388-4e99-8bce-1b559f7b1_...
POLAR_PRODUCT_STARTER_YEARLY_ID=55bd12e8-1722-4e45-9d58-d588628c8_...
POLAR_PRODUCT_PREMIUM_MONTHLY_ID=9da4fe59-3662-42ad-91a9-526db1f38_...
POLAR_PRODUCT_PREMIUM_YEARLY_ID=4f4e559c-17b3-45ec-9d2a-5b0466681_...
POLAR_PRODUCT_ULTIMATE_MONTHLY_ID=2d6038cb-ff62-48f1-ae23-7e20fc112_...
POLAR_PRODUCT_ULTIMATE_YEARLY_ID=1ff24621-01d4-4f46-bdc6-b82c42508_...
```

### Base URL (Optional but Recommended)

```bash
# Production URL
NEXT_PUBLIC_BASE_URL=https://pho.chat
```

---

## 📝 How to Update in Vercel

### Step 1: Delete Wrong Variables

1. Go to <https://vercel.com/dashboard>
2. Select **lobe-chat** project
3. Go to **Settings → Environment Variables**
4. Find and delete:
   - `SEPAY_API_KEY`
   - `SEPAY_ACCOUNT_NUMBER`
   - `SEPAY_WEBHOOK_URL`

### Step 2: Add Correct Variables

1. Click **Add New** button
2. For each variable:
   - **Name**: Copy from the list above (e.g., `SEPAY_SECRET_KEY`)
   - **Value**: Paste your actual value
   - **Environment**: Select **Production** (and optionally Preview/Development)
3. Click **Save**

### Step 3: Find SEPAY_MERCHANT_ID

**Where to find it**:

1. Log in to <https://my.sepay.vn> (or your Sepay dashboard URL)
2. Go to **Settings** → **API Settings** or **Account Settings**
3. Look for:
   - "Merchant ID"
   - "Account ID"
   - "Partner ID"
   - "Shop ID"
4. Copy the value

**If you can't find it**:

- Contact Sepay support: <support@sepay.vn>
- Check your Sepay signup email
- Check Sepay API documentation

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **Redeploy** button
4. Wait for deployment to complete (\~2-3 minutes)

---

## 🔍 How to Verify

### Check Environment Variables

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Search for "SEPAY"
3. You should see:
   - ✅ `SEPAY_SECRET_KEY` (Production)
   - ✅ `SEPAY_MERCHANT_ID` (Production)
   - ✅ `SEPAY_BANK_ACCOUNT` (Production)
   - ✅ `SEPAY_BANK_NAME` (Production)

### Check Logs After Deployment

1. Go to Vercel Dashboard → Deployments → Latest → Logs
2. Make a test payment (bank transfer)
3. Search for:
   - ✅ `🏦 REAL SEPAY: Payment created with QR code`
   - ❌ `🧪 MOCK SEPAY` (should NOT see this)

### Test Payment Flow

1. Go to <https://pho.chat/subscription/checkout?plan=premium>
2. Select "Thanh toán" (Bank Transfer)
3. Click "Pay" button
4. **Expected**:
   - Redirects to `https://pho.chat/payment/waiting`
   - Shows real QR code (not 1x1 pixel placeholder)
   - Shows "MBBank" and "12919899999"

---

## 🚨 Common Mistakes

### Mistake 1: Wrong Variable Names

```bash
❌ SEPAY_API_KEY    # Wrong
✅ SEPAY_SECRET_KEY # Correct

❌ SEPAY_ACCOUNT_NUMBER # Wrong
✅ SEPAY_BANK_ACCOUNT   # Correct
```

### Mistake 2: Missing SEPAY_MERCHANT_ID

```bash
# This will cause mock mode:
SEPAY_SECRET_KEY=xxx
# Missing: SEPAY_MERCHANT_ID

# Correct:
SEPAY_SECRET_KEY=xxx
SEPAY_MERCHANT_ID=xxx
```

### Mistake 3: Not Redeploying After Changes

- Environment variables are only loaded during build
- You MUST redeploy after adding/changing variables

### Mistake 4: Testing on Preview Deployment

- Preview deployments use preview URLs
- Test on <https://pho.chat> for production behavior

---

## 📊 Environment Variable Checklist

### Sepay (Bank Transfer)

- [ ] `SEPAY_SECRET_KEY` - Added with correct value
- [ ] `SEPAY_MERCHANT_ID` - Added with correct value
- [ ] `SEPAY_BANK_ACCOUNT` - Added with correct value
- [ ] `SEPAY_BANK_NAME` - Added with correct value
- [ ] Deleted `SEPAY_API_KEY` (wrong name)
- [ ] Deleted `SEPAY_ACCOUNT_NUMBER` (wrong name)

### Polar (Credit Card)

- [x] `POLAR_ACCESS_TOKEN` - Already correct
- [x] `POLAR_SERVER` - Already correct
- [x] `POLAR_WEBHOOK_SECRET` - Already correct
- [x] All 6 product IDs - Already correct

### Base URL

- [ ] `NEXT_PUBLIC_BASE_URL=https://pho.chat` - Optional but recommended

### Deployment

- [ ] Redeployed after adding variables
- [ ] Checked logs for "REAL SEPAY" message
- [ ] Tested payment flow on production

---

## 🎯 Expected Result

After fixing all environment variables and redeploying:

```
✅ Sepay runs in REAL mode (not mock)
✅ QR code displays correctly
✅ Bank account shows "MBBank" and "12919899999"
✅ Payment URL uses https://pho.chat
✅ Logs show "🏦 REAL SEPAY: Payment created with QR code"
```

---

## 📞 Need Help?

**If you can't find SEPAY_MERCHANT_ID**:

- Contact Sepay support: <support@sepay.vn>
- Check Sepay documentation: <https://docs.sepay.vn>

**If payment still doesn't work after fixing**:

- Check Vercel logs for error messages
- Verify all environment variables are set correctly
- Make sure you redeployed after adding variables
- Test on production URL (<https://pho.chat>), not preview

---

**Last Updated**: 2025-11-01\
**Status**: Ready to implement
