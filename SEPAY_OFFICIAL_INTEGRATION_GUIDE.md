# ✅ Sepay Official Integration Guide

**Source**: <https://developer.sepay.vn/en/cong-thanh-toan/bat-dau>

---

## 🎯 IMPORTANT CORRECTION

**I was WRONG in my previous analysis!** After reading the official Sepay developer documentation, I discovered:

### ✅ **Merchant ID IS Required!**

The official documentation clearly states:

> "You will receive integration information (copy your **MERCHANT ID** and **SECRET KEY** to use in later steps)"

**Your Credentials (from screenshot)**:

- **Merchant ID**: `SP-TEST-TNA49849`
- **Secret Key**: `spsk_test_qXChyoyhNsgWkZg4F7VCH6x7j6u7pWqa`

---

## 📝 What is IPN?

**IPN (Instant Payment Notification)** is an endpoint on your server that receives real-time transaction notifications from Sepay.

### How IPN Works:

1. **User completes payment** → Sepay processes transaction
2. **Sepay sends JSON payload** → Your IPN endpoint (`https://pho.chat/api/payment/sepay/webhook`)
3. **Your server processes notification** → Updates payment status in database
4. **Your server returns HTTP 200** → Acknowledges receipt

### IPN Payload Example:

```json
{
  "notification_type": "ORDER_PAID",
  "order": {
    "id": "e2c195be-c721-47eb-b323-99ab24e52d85",
    "order_id": "NQD-68DA43D73C1A5",
    "order_status": "CAPTURED",
    "order_currency": "VND",
    "order_amount": "100000.00",
    "order_invoice_number": "INV-1759134677",
    "order_description": "Test payment"
  },
  "timestamp": 1759134682,
  "transaction": {
    "id": "384c66dd-41e6-4316-a544-b4141682595c",
    "payment_method": "BANK_TRANSFER",
    "transaction_id": "68da43da2d9de",
    "transaction_date": "2025-09-29 15:31:22",
    "transaction_status": "APPROVED",
    "transaction_amount": "100000",
    "transaction_currency": "VND"
  }
}
```

---

## 🔧 Correct Environment Variables

### For Sandbox (Testing):

```bash
# Merchant Credentials
SEPAY_MERCHANT_ID=SP-TEST-TNA49849
SEPAY_SECRET_KEY=spsk_test_qXChyoyhNsgWkZg4F7VCH6x7j6u7pWqa

# Bank Account (for QR code generation)
SEPAY_BANK_ACCOUNT=12919899999
SEPAY_BANK_NAME=MBBank

# API Endpoint
SEPAY_API_URL=https://pay-sandbox.sepay.vn/v1/checkout/init

# Webhook/IPN URL
SEPAY_NOTIFY_URL=https://pho.chat/api/payment/sepay/webhook

# Callback URLs
SEPAY_SUCCESS_URL=https://pho.chat/payment/success
SEPAY_ERROR_URL=https://pho.chat/payment/error
SEPAY_CANCEL_URL=https://pho.chat/payment/cancel
```

### For Production:

After completing sandbox testing and switching to production in Sepay dashboard:

```bash
# Merchant Credentials (will be different from sandbox)
SEPAY_MERCHANT_ID=<production-merchant-id>
SEPAY_SECRET_KEY=<production-secret-key>

# Bank Account (your real bank account)
SEPAY_BANK_ACCOUNT=<your-real-bank-account>
SEPAY_BANK_NAME=<your-bank-name>

# API Endpoint
SEPAY_API_URL=https://pay.sepay.vn/v1/checkout/init

# Webhook/IPN URL
SEPAY_NOTIFY_URL=https://pho.chat/api/payment/sepay/webhook

# Callback URLs
SEPAY_SUCCESS_URL=https://pho.chat/payment/success
SEPAY_ERROR_URL=https://pho.chat/payment/error
SEPAY_CANCEL_URL=https://pho.chat/payment/cancel
```

---

## 🔄 Payment Flow

### Complete Flow:

```
1. User clicks "Pay" on pho.chat
   ↓
2. Your server creates payment form with signature
   ↓
3. User submits form → Redirects to Sepay payment page
   ↓
4. User completes payment (scans QR code, transfers money)
   ↓
5. Sepay processes transaction
   ↓
6. Sepay sends IPN notification to your webhook
   ↓
7. Your server updates payment status in database
   ↓
8. Sepay redirects user to success_url/error_url/cancel_url
```

---

## 🛠️ Code Changes Needed

### 1. Revert Mock Mode Check

I need to **REVERT** my previous change and restore the merchant ID check:

**File**: `src/config/customizations.ts`

```typescript
// CORRECT (as per official documentation):
mockMode: !process.env.SEPAY_SECRET_KEY || !process.env.SEPAY_MERCHANT_ID,
```

### 2. Update Sepay Integration

**File**: `src/libs/sepay/index.ts`

The code should check for BOTH `SEPAY_SECRET_KEY` AND `SEPAY_MERCHANT_ID`:

```typescript
const useRealSepayAPI = process.env.SEPAY_SECRET_KEY && process.env.SEPAY_MERCHANT_ID;
```

### 3. Implement Signature Generation

According to the documentation, we need to generate HMAC-SHA256 signature for payment forms.

**Signed Fields** (in this order):

- `merchant`
- `operation`
- `payment_method`
- `order_amount`
- `currency`
- `order_invoice_number`
- `order_description`
- `customer_id`
- `success_url`
- `error_url`
- `cancel_url`

**Signature Algorithm**:

```typescript
const signedFields = [
  `merchant=${merchantId}`,
  `operation=PURCHASE`,
  `payment_method=BANK_TRANSFER`,
  `order_amount=${amount}`,
  `currency=VND`,
  `order_invoice_number=${invoiceNumber}`,
  `order_description=${description}`,
  `customer_id=${customerId}`,
  `success_url=${successUrl}`,
  `error_url=${errorUrl}`,
  `cancel_url=${cancelUrl}`,
];

const signString = signedFields.join(',');
const signature = crypto.createHmac('sha256', secretKey).update(signString).digest('base64');
```

### 4. Update IPN Webhook Handler

**File**: `src/app/api/payment/sepay/webhook/route.ts`

The webhook should:

1. Receive JSON payload from Sepay
2. Validate the notification
3. Update payment status in database
4. Return HTTP 200 to acknowledge receipt

---

## ✅ Action Plan

### Step 1: Revert Previous Changes (5 minutes)

I need to revert my incorrect changes that removed the merchant ID requirement.

### Step 2: Update Environment Variables in Vercel (5 minutes)

Add these variables for **Production** environment:

```bash
SEPAY_MERCHANT_ID=SP-TEST-TNA49849
SEPAY_SECRET_KEY=spsk_test_qXChyoyhNsgWkZg4F7VCH6x7j6u7pWqa
SEPAY_BANK_ACCOUNT=12919899999
SEPAY_BANK_NAME=MBBank
SEPAY_API_URL=https://pay-sandbox.sepay.vn/v1/checkout/init
SEPAY_NOTIFY_URL=https://pho.chat/api/payment/sepay/webhook
```

### Step 3: Implement Proper Sepay Integration (30 minutes)

Based on the official documentation, I need to:

1. Implement signature generation
2. Create payment form submission to Sepay
3. Handle IPN webhook properly
4. Handle callback URLs (success/error/cancel)

### Step 4: Test Integration (15 minutes)

1. Test payment form creation
2. Test redirect to Sepay payment page
3. Test IPN webhook reception
4. Test callback URL redirects

---

## 📊 Comparison: Old vs New Understanding

| Aspect         | My Previous Understanding    | Official Documentation       |
| -------------- | ---------------------------- | ---------------------------- |
| Merchant ID    | ❌ Not required              | ✅ Required                  |
| Secret Key     | ✅ Required (API Token)      | ✅ Required                  |
| Authentication | Bearer token                 | HMAC-SHA256 signature        |
| Payment Method | Direct QR code generation    | Form submission to Sepay     |
| IPN            | ✅ Webhook for notifications | ✅ Webhook for notifications |

---

## 🚨 Critical Realizations

1. **I was wrong about merchant ID** - It IS required for the payment gateway integration
2. **The integration is different** - It's not just QR code generation, it's a full payment gateway with form submission
3. **Signature is required** - All payment forms must be signed with HMAC-SHA256
4. **IPN is critical** - This is how we get real-time payment status updates

---

## 📚 Reference

- **Official Documentation**: <https://developer.sepay.vn/en/cong-thanh-toan/bat-dau>
- **Your Merchant ID**: `SP-TEST-TNA49849`
- **Your Secret Key**: `spsk_test_qXChyoyhNsgWkZg4F7VCH6x7j6u7pWqa`

---

**Next Steps**: I will now revert my incorrect changes and implement the proper Sepay integration based on the official documentation.
