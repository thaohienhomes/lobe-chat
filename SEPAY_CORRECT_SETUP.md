# ✅ Sepay Correct Setup Guide

**IMPORTANT DISCOVERY**: Sepay uses **API Token** authentication, NOT merchant ID!

---

## 🎯 Key Findings

### 1. Sepay Authentication Method

According to Sepay's official documentation (<https://docs.sepay.vn/tao-api-token.html>):

**Sepay uses API Token (Bearer Token) for authentication**:

```
Authorization: Bearer <API_TOKEN>
```

**NOT merchant ID!**

### 2. What You Need for Bank Transfer QR Code

For **bank transfer with QR code** (which is what you're using), you only need:

✅ **SEPAY_SECRET_KEY** - This is your API Token\
✅ **SEPAY_BANK_ACCOUNT** - Your bank account number\
✅ **SEPAY_BANK_NAME** - Your bank name

❌ **SEPAY_MERCHANT_ID** - NOT required for bank transfer QR code!

**Note**: `SEPAY_MERCHANT_ID` is only needed if you want to use Sepay's credit card payment feature (which is a separate service).

---

## 📝 How to Get Your API Token

### Step 1: Log in to Sepay Dashboard

Go to <https://my.sepay.vn> and log in

### Step 2: Navigate to API Access

1. Click on **Cấu hình Công ty** (Company Configuration)
2. Click on **API Access**

### Step 3: Create API Token

1. Click **+ Thêm API** button (top right)
2. Fill in the form:
   - **Tên** (Name): Enter any name (e.g., "pho.chat API")
   - **Trạng thái** (Status): Select **Hoạt động** (Active)
3. Click **Thêm** (Add)

### Step 4: Copy API Token

After creating, you'll see the API Token in the list. Copy it.

**Example**: `COMXYNAOC1T7BUERZKTS9WB78NCR04PBKZQ...`

---

## ✅ Correct Environment Variables for Vercel

### Delete These (Wrong Names)

```bash
❌ SEPAY_API_KEY
❌ SEPAY_ACCOUNT_NUMBER
❌ SEPAY_WEBHOOK_URL
❌ SEPAY_MERCHANT_ID (not needed for bank transfer)
```

### Add These (Correct Names)

```bash
# API Authentication (Required)
SEPAY_SECRET_KEY=COMXYNAOC1T7BUERZKTS9WB78NCR04PBKZQ...

# Bank Account Information (Required for QR code)
SEPAY_BANK_ACCOUNT=12919899999
SEPAY_BANK_NAME=MBBank

# Optional: Webhook URL (for payment notifications)
SEPAY_NOTIFY_URL=https://pho.chat/api/payment/sepay/webhook
```

---

## 🔧 Code Changes Made

I've fixed the code to make `SEPAY_MERCHANT_ID` optional (only required for credit card payments):

### File 1: `src/config/customizations.ts`

**Before**:

```typescript
mockMode: !process.env.SEPAY_SECRET_KEY || !process.env.SEPAY_MERCHANT_ID,
```

**After**:

```typescript
// Mock mode for testing (when credentials not provided)
// Note: SEPAY_MERCHANT_ID is only required for credit card payments, not for bank transfer QR code
mockMode: !process.env.SEPAY_SECRET_KEY,
```

### File 2: `src/libs/sepay/index.ts`

**Before**:

```typescript
const useRealSepayAPI = process.env.SEPAY_SECRET_KEY && process.env.SEPAY_MERCHANT_ID;

if (!useRealSepayAPI) {
  console.log(
    '🧪 MOCK SEPAY: Using mock implementation (missing SEPAY_SECRET_KEY or SEPAY_MERCHANT_ID)',
  );
}
```

**After**:

```typescript
// Note: For bank transfer QR code, we only need SEPAY_SECRET_KEY (API Token)
// SEPAY_MERCHANT_ID is only required for credit card payments
const useRealSepayAPI = process.env.SEPAY_SECRET_KEY;

if (!useRealSepayAPI) {
  console.log('🧪 MOCK SEPAY: Using mock implementation (missing SEPAY_SECRET_KEY)');
}
```

---

## 🚀 Step-by-Step Fix Guide

### Step 1: Update Environment Variables in Vercel (5 minutes)

1. Go to <https://vercel.com/dashboard>

2. Select **lobe-chat** project

3. Go to **Settings → Environment Variables**

4. **DELETE** these variables:
   - `SEPAY_API_KEY`
   - `SEPAY_ACCOUNT_NUMBER`
   - `SEPAY_WEBHOOK_URL`
   - `SEPAY_MERCHANT_ID` (if exists)

5. **ADD** these variables for **Production** environment:

   ```bash
   SEPAY_SECRET_KEY=COMXYNAOC1T7BUERZKTS9WB78NCR04PBKZQ...
   SEPAY_BANK_ACCOUNT=12919899999
   SEPAY_BANK_NAME=MBBank
   ```

6. Click **Save**

### Step 2: Deploy Code Changes (2 minutes)

The code changes need to be deployed. I'll commit and push them now.

### Step 3: Redeploy on Vercel (2 minutes)

After the code is pushed:

1. Vercel will automatically deploy
2. Wait for deployment to complete (\~2-3 minutes)

### Step 4: Test Bank Transfer (5 minutes)

1. Go to <https://pho.chat/subscription/checkout?plan=premium>
2. Select "Thanh toán" (Bank Transfer)
3. Click "Pay" button
4. **Expected**:
   - Redirects to `https://pho.chat/payment/waiting`
   - Shows real QR code from Sepay
   - Shows "MBBank" and "12919899999"

### Step 5: Check Logs (5 minutes)

1. Go to Vercel Dashboard → Deployments → Latest → Logs
2. Search for:
   - ✅ `🏦 REAL SEPAY: Payment created with QR code`
   - ✅ `Bank Account: 12919899999`
   - ✅ `Bank Name: MBBank`
   - ✅ `QR Code URL: https://qr.sepay.vn/img?...`
   - ❌ `🧪 MOCK SEPAY` (should NOT see this)

---

## 🎯 Expected Behavior After Fix

### Bank Transfer Flow (with correct API Token):

```
User clicks "Pay"
  ↓
Code checks: process.env.SEPAY_SECRET_KEY exists? ✅ YES
  ↓
Logs show: "🏦 REAL SEPAY: Using real Sepay API integration"
  ↓
Logs show: "Bank Account: 12919899999"
  ↓
Logs show: "Bank Name: MBBank"
  ↓
Generates QR code URL: https://qr.sepay.vn/img?acc=12919899999&amount=1290000&bank=MBBank&des=...
  ↓
Redirects to: https://pho.chat/payment/waiting
  ↓
Displays: Real QR code from Sepay
  ↓
User scans QR code and completes payment
```

---

## 📊 Summary of Changes

| Item                         | Before                                                   | After                            |
| ---------------------------- | -------------------------------------------------------- | -------------------------------- |
| Mock mode check              | Requires both `SEPAY_SECRET_KEY` AND `SEPAY_MERCHANT_ID` | Only requires `SEPAY_SECRET_KEY` |
| Environment variables needed | 4 variables (including merchant ID)                      | 3 variables (no merchant ID)     |
| Error message                | "missing SEPAY_SECRET_KEY or SEPAY_MERCHANT_ID"          | "missing SEPAY_SECRET_KEY"       |
| Bank transfer QR code        | Works only if both vars set                              | Works with just API Token        |

---

## ❓ FAQ

**Q: Do I need SEPAY_MERCHANT_ID?**\
**A**: No, not for bank transfer QR code payments. It's only needed for credit card payments (which is a separate Sepay feature).

**Q: What is SEPAY_SECRET_KEY?**\
**A**: It's your Sepay API Token. You create it in Sepay Dashboard → Cấu hình Công ty → API Access.

**Q: Where do I find my bank account number?**\
**A**: In your Sepay dashboard, or use the bank account you registered with Sepay.

**Q: Why was the code checking for SEPAY_MERCHANT_ID?**\
**A**: It was a mistake in the original implementation. The code was checking for merchant ID even though it's not needed for bank transfer payments.

**Q: Will this break credit card payments?**\
**A**: No. Credit card payments will still check for `SEPAY_MERCHANT_ID` when needed (line 405 in the code).

---

## 🔍 How Sepay Bank Transfer Works

**Important**: Sepay's bank transfer QR code does NOT require API calls!

1. **User selects bank transfer** → Code generates QR code URL
2. **QR code URL format**: `https://qr.sepay.vn/img?acc=<account>&amount=<amount>&bank=<bank>&des=<description>`
3. **User scans QR code** → Transfers money to your bank account
4. **Sepay detects transaction** → Sends webhook to your server
5. **Your server receives webhook** → Updates payment status

**That's why you only need**:

- API Token (for webhook verification and transaction checking)
- Bank account number (for QR code generation)
- Bank name (for QR code generation)

**No merchant ID needed!**

---

## 📚 Reference

- **Sepay Documentation**: <https://docs.sepay.vn>
- **API Token Guide**: <https://docs.sepay.vn/tao-api-token.html>
- **Webhook Integration**: <https://docs.sepay.vn/tich-hop-webhooks.html>

---

**Status**: ✅ Code fixed, ready to deploy\
**Next Step**: Update environment variables in Vercel and redeploy
