# 🔍 QR Code Display Troubleshooting Guide

**Date**: 2025-10-31\
**Issue**: Bank Transfer QR Code Not Displaying\
**Status**: Diagnostic & Fix Guide

---

## 🔴 Problem Summary

When users select "Bank Transfer" payment method and click "Pay", the QR code is not displaying on the payment waiting page.

**Expected Flow:**

```
User clicks "Pay" → API creates payment → Redirects to /payment/waiting
                                                    ↓
                                        QR code displays ✅
```

**Actual Flow:**

```
User clicks "Pay" → API creates payment → Redirects to /payment/waiting
                                                    ↓
                                        QR code NOT displaying ❌
```

---

## 🔍 Root Cause Analysis

### Potential Issues:

1. **QR Code URL Not Loading**
   - Sepay QR service (`https://qr.sepay.vn/img`) might be blocked
   - CORS issues preventing image load
   - URL parameters not properly encoded

2. **Payment Waiting Page Not Receiving Parameters**
   - URL parameters not being passed correctly
   - Query string encoding issues
   - Page not extracting parameters properly

3. **Environment Variables Missing**
   - `SEPAY_BANK_ACCOUNT` not set
   - `SEPAY_BANK_NAME` not set
   - `NEXT_PUBLIC_BASE_URL` not set

---

## 🛠️ Diagnostic Steps

### Step 1: Check Browser Console

1. Open <https://pho.chat/subscription/checkout>
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Select "Bank Transfer" payment method
5. Click "Pay" button
6. Look for error messages

**Expected Console Logs:**

```
🏦 Bank Transfer: Creating payment...
🏦 Bank Transfer Response: {success: true, paymentUrl: "..."}
✅ Redirecting to payment waiting page: ...
```

**If you see errors**, note them down.

### Step 2: Check Network Tab

1. In Developer Tools, go to **Network** tab
2. Click "Pay" button
3. Look for the API request to `/api/payment/sepay/create`
4. Click on it and check:
   - **Status**: Should be 200
   - **Response**: Should have `success: true` and `paymentUrl`

### Step 3: Check Payment Waiting Page

1. After redirect, check the URL
2. Should look like: `https://pho.chat/en-US__0__light/payment/waiting?orderId=...&amount=...&qrCodeUrl=...`
3. Open **Network** tab again
4. Look for image requests
5. Check if `qrCodeUrl` image is loading

### Step 4: Check Vercel Logs

1. Go to <https://vercel.com/dashboard>
2. Select **lobe-chat** project
3. Click **Deployments**
4. Select latest deployment
5. Click **Logs**
6. Search for "REAL SEPAY" or "Bank Transfer"
7. Look for error messages

---

## ✅ Fixes Applied

### Fix 1: Improved URL Encoding

**File**: `src/libs/sepay/index.ts`

Changed from:

```javascript
const paymentUrl = `${baseUrl}/en-US__0__light/payment/waiting?orderId=${request.orderId}&amount=${request.amount}&qrCodeUrl=${encodeURIComponent(qrCodeUrl)}&bankAccount=${bankInfo.accountNumber}&bankName=${encodeURIComponent(bankInfo.bankName)}`;
```

To:

```javascript
const paymentUrlParams = new URLSearchParams({
  amount: request.amount.toString(),
  bankAccount: bankInfo.accountNumber,
  bankName: bankInfo.bankName,
  orderId: request.orderId,
  qrCodeUrl: qrCodeUrl,
});
const paymentUrl = `${baseUrl}/en-US__0__light/payment/waiting?${paymentUrlParams.toString()}`;
```

**Why**: URLSearchParams properly encodes all parameters, preventing encoding issues.

### Fix 2: Enhanced Logging

**File**: `src/app/[variants]/(main)/subscription/checkout/Client.tsx`

Added detailed console logs to track:

- Payment creation request
- API response
- Redirect URL

**Why**: Makes debugging easier by showing exact flow.

---

## 🔧 Manual Testing

### Test 1: Local Testing

```bash
# Start local development server
bun run dev

# Navigate to checkout
# Open http://localhost:3010/subscription/checkout

# Select Bank Transfer
# Click Pay
# Check console for logs
```

### Test 2: Production Testing

```bash
# Check Vercel logs
# Go to https://vercel.com/dashboard
# Select lobe-chat project
# Click Deployments → Latest → Logs
# Search for "Bank Transfer" or "REAL SEPAY"
```

---

## 📋 Verification Checklist

- [ ] Environment variables set in Vercel:
  - [ ] SEPAY_MERCHANT_ID
  - [ ] SEPAY_SECRET_KEY
  - [ ] SEPAY_BANK_ACCOUNT
  - [ ] SEPAY_BANK_NAME
  - [ ] NEXT_PUBLIC_BASE_URL=<https://pho.chat>

- [ ] Payment waiting page exists:
  - [ ] File: `src/app/[variants]/(main)/payment/waiting/page.tsx`
  - [ ] Has QR code display logic
  - [ ] Extracts parameters from URL

- [ ] QR code URL generation:
  - [ ] Uses Sepay QR service: `https://qr.sepay.vn/img`
  - [ ] Parameters properly encoded
  - [ ] URL passed to payment waiting page

- [ ] Browser testing:
  - [ ] Console shows no errors
  - [ ] Network requests successful (200 status)
  - [ ] QR code image loads
  - [ ] Payment waiting page displays correctly

---

## 🚀 Next Steps

1. **Deploy fixes**:

   ```bash
   git add .
   git commit -m "fix: improve QR code URL encoding and add logging"
   git push origin main
   ```

2. **Test in production**:
   - Go to <https://pho.chat/subscription/checkout>
   - Select Bank Transfer
   - Click Pay
   - Verify QR code displays

3. **Monitor logs**:
   - Check Vercel logs for errors
   - Monitor webhook delivery
   - Track payment status

4. **If still not working**:
   - Check Sepay QR service status
   - Verify bank account configuration
   - Contact Sepay support

---

## 📞 Support

If QR code still not displaying after fixes:

1. Check Vercel logs for specific error
2. Verify all environment variables are set
3. Test with different browser/device
4. Contact Sepay support for QR service issues
