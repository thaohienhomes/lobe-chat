# 🔍 Payment Flow Diagnostic Report

**Date**: 2025-10-31\
**Status**: 🚨 CRITICAL ISSUES IDENTIFIED\
**Deployment**: Production (pho.chat)

---

## 📋 Executive Summary

Two critical payment flow issues identified in production:

1. **Bank Transfer QR Code Not Displaying** - Missing payment waiting page
2. **Credit Card Payment Incorrect Redirect** - No gateway routing logic
3. **Polar Environment Variables Missing** - International payments blocked

---

## 🔴 Issue 1: Bank Transfer QR Code Not Displaying

### Root Cause

The checkout component redirects to `/payment/waiting` page which **does not exist** in the codebase.

**Current Flow:**

```
User clicks "Pay" → API returns paymentUrl → window.location.href redirects to /payment/waiting
                                                                    ↓
                                                        ❌ 404 Page Not Found
```

**Code Location:** `src/app/[variants]/(main)/subscription/checkout/Client.tsx:276-277`

```javascript
if (data.success && data.paymentUrl) {
  window.location.href = data.paymentUrl; // Redirects to non-existent page
}
```

### Solution

Create the missing payment waiting page at `src/app/[variants]/(main)/payment/waiting/page.tsx` that:

1. Extracts QR code URL from query parameters
2. Displays the QR code image
3. Shows payment instructions
4. Polls payment status

---

## 🔴 Issue 2: Credit Card Payment - Incorrect Redirect

### Root Cause

The checkout component always routes credit card payments to Sepay, but should route international users to Polar.

**Current Flow:**

```
User selects "Credit Card" → Always calls /api/payment/sepay/create-credit-card
                                                    ↓
                                    ❌ Redirects to /dashboard (wrong)
                                    ✅ Should redirect to Polar for international users
```

**Code Location:** `src/app/[variants]/(main)/subscription/checkout/Client.tsx:289-330`

### Solution

Implement gateway routing logic:

1. Detect user's country/region
2. Route Vietnamese users to Sepay
3. Route international users to Polar
4. Update checkout component to handle both payment methods

---

## 🔴 Issue 3: Polar Environment Variables Missing

### Required Variables for Production

**Polar Configuration:**

```bash
POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxx
POLAR_SERVER=production
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Polar Product IDs (Starter Plan):**

```bash
POLAR_PRODUCT_STARTER_ID=prod_xxxxxxxxxxxxx
POLAR_PRICE_STARTER_MONTHLY_ID=price_xxxxxxxxxxxxx
POLAR_PRICE_STARTER_YEARLY_ID=price_xxxxxxxxxxxxx
```

**Polar Product IDs (Premium Plan):**

```bash
POLAR_PRODUCT_PREMIUM_ID=prod_xxxxxxxxxxxxx
POLAR_PRICE_PREMIUM_MONTHLY_ID=price_xxxxxxxxxxxxx
POLAR_PRICE_PREMIUM_YEARLY_ID=price_xxxxxxxxxxxxx
```

**Polar Product IDs (Ultimate Plan):**

```bash
POLAR_PRODUCT_ULTIMATE_ID=prod_xxxxxxxxxxxxx
POLAR_PRICE_ULTIMATE_MONTHLY_ID=price_xxxxxxxxxxxxx
POLAR_PRICE_ULTIMATE_YEARLY_ID=price_xxxxxxxxxxxxx
```

---

## 💰 Pricing Structure

### Starter Plan

- **Monthly**: 39,000 VND (Sepay) / $1.99 USD (Polar)
- **Yearly**: 390,000 VND (Sepay) / $19.99 USD (Polar, 17% discount)
- **Compute Credits**: 5M/month

### Premium Plan

- **Monthly**: 129,000 VND (Sepay) / $5.99 USD (Polar)
- **Yearly**: 1,290,000 VND (Sepay) / $59.99 USD (Polar, 17% discount)
- **Compute Credits**: 15M/month

### Ultimate Plan

- **Monthly**: 349,000 VND (Sepay) / $14.99 USD (Polar)
- **Yearly**: 3,490,000 VND (Sepay) / $149.99 USD (Polar, 17% discount)
- **Compute Credits**: 35M/month

---

## ✅ Action Items

### Priority 1: Create Payment Waiting Page

- [ ] Create `src/app/[variants]/(main)/payment/waiting/page.tsx`
- [ ] Extract QR code from URL parameters
- [ ] Display QR code image
- [ ] Show payment instructions
- [ ] Implement status polling

### Priority 2: Implement Gateway Routing

- [ ] Update checkout component to detect user location
- [ ] Route Vietnamese users to Sepay
- [ ] Route international users to Polar
- [ ] Handle both payment methods correctly

### Priority 3: Add Polar Environment Variables

- [ ] Set POLAR_ACCESS_TOKEN in Vercel
- [ ] Set POLAR_SERVER=production
- [ ] Set POLAR_WEBHOOK_SECRET
- [ ] Set all POLAR_PRODUCT\_\* and POLAR_PRICE\_\* IDs
- [ ] Redeploy to production

---

## 📊 Current Environment Status

**Sepay Variables**: ✅ Configured

- SEPAY_MERCHANT_ID: Configured
- SEPAY_SECRET_KEY: Configured
- SEPAY_BANK_ACCOUNT: Configured
- SEPAY_BANK_NAME: Configured

**Polar Variables**: ❌ Missing

- All Polar variables need to be added to Vercel

---

## 🔗 Related Files

- Checkout Component: `src/app/[variants]/(main)/subscription/checkout/Client.tsx`
- Sepay API: `src/app/api/payment/sepay/create/route.ts`
- Sepay Credit Card API: `src/app/api/payment/sepay/create-credit-card/route.ts`
- Polar API: `src/app/api/payment/polar/create/route.ts`
- Sepay SDK: `src/libs/sepay/index.ts`
- Polar SDK: `src/libs/polar/index.ts`
- Gateway Router: `src/server/services/payment/gateway-router.ts`
