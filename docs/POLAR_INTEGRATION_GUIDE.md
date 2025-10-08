# 🌍 Polar.sh Integration Guide

**Date:** 2025-01-08  
**Purpose:** Setup and testing guide for Polar.sh payment gateway integration

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Polar Dashboard Configuration](#polar-dashboard-configuration)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## 1. Overview

### What is Polar.sh?

Polar.sh is a **Merchant of Record (MoR)** payment platform designed for developers and SaaS businesses.

**Key Benefits:**
- ✅ **Automatic Tax Handling** - VAT, GST, sales tax calculated and remitted automatically
- ✅ **Global Payment Methods** - Credit cards, PayPal, Google Pay, Apple Pay
- ✅ **Subscription Management** - Built-in recurring billing
- ✅ **Customer Portal** - Self-service subscription management
- ✅ **Developer-Friendly** - Clean API, webhooks, TypeScript SDK

**Fees:**
- 4% + $0.40 per transaction
- No monthly fees
- No setup fees

---

## 2. Prerequisites

### Required Accounts

1. **Polar.sh Account**
   - Sign up at: https://polar.sh
   - Complete business verification
   - Add bank account for payouts

2. **pho.chat Production Environment**
   - Vercel deployment
   - PostgreSQL database
   - Clerk authentication

---

## 3. Environment Setup

### Step 1: Install Polar SDK

```bash
pnpm add @polar-sh/sdk
```

### Step 2: Add Environment Variables

Add to `.env.local` (development) and Vercel (production):

```bash
# Polar.sh Configuration
POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxx
POLAR_SERVER=production  # or 'sandbox' for testing
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Polar Product IDs (from Polar dashboard)
POLAR_PRODUCT_STARTER_ID=prod_xxxxxxxxxxxxx
POLAR_PRICE_STARTER_MONTHLY_ID=price_xxxxxxxxxxxxx
POLAR_PRICE_STARTER_YEARLY_ID=price_xxxxxxxxxxxxx

POLAR_PRODUCT_PREMIUM_ID=prod_xxxxxxxxxxxxx
POLAR_PRICE_PREMIUM_MONTHLY_ID=price_xxxxxxxxxxxxx
POLAR_PRICE_PREMIUM_YEARLY_ID=price_xxxxxxxxxxxxx

POLAR_PRODUCT_ULTIMATE_ID=prod_xxxxxxxxxxxxx
POLAR_PRICE_ULTIMATE_MONTHLY_ID=price_xxxxxxxxxxxxx
POLAR_PRICE_ULTIMATE_YEARLY_ID=price_xxxxxxxxxxxxx
```

### Step 3: Get Access Token

1. Go to Polar Dashboard → Settings → API Keys
2. Create new API key with permissions:
   - ✅ Read products
   - ✅ Write checkouts
   - ✅ Read/Write subscriptions
   - ✅ Read customers
3. Copy the access token (starts with `polar_at_`)

---

## 4. Polar Dashboard Configuration

### Step 1: Create Products

Create 3 products in Polar dashboard:

#### **Product 1: Starter**
- **Name:** pho.chat Starter
- **Description:** Suitable for users who occasionally use AI features
- **Features:**
  - 5,000,000 compute credits/month
  - GPT-4o mini - Approx 7,000 messages
  - DeepSeek R1 - Approx 1,900 messages
  - File Storage - 1.0 GB
  - Vector Storage - 5,000 entries

#### **Product 2: Premium**
- **Name:** pho.chat Premium
- **Description:** Designed for professional users who frequently use AI features
- **Features:**
  - 15,000,000 compute credits/month
  - GPT-4o mini - Approx 21,100 messages
  - DeepSeek R1 - Approx 5,800 messages
  - File Storage - 2.0 GB
  - Vector Storage - 10,000 entries

#### **Product 3: Ultimate**
- **Name:** pho.chat Ultimate
- **Description:** For heavy users requiring extensive AI complex conversations
- **Features:**
  - 35,000,000 compute credits/month
  - GPT-4o mini - Approx 49,100 messages
  - DeepSeek R1 - Approx 13,400 messages
  - File Storage - 4.0 GB
  - Vector Storage - 20,000 entries

### Step 2: Create Prices

For each product, create 2 prices:

#### **Starter Prices**
- **Monthly:** $1.61 USD (39,000 VND equivalent)
- **Yearly:** $16.10 USD (17% discount - 10 months price)

#### **Premium Prices**
- **Monthly:** $5.34 USD (129,000 VND equivalent)
- **Yearly:** $53.40 USD (17% discount)

#### **Ultimate Prices**
- **Monthly:** $14.44 USD (349,000 VND equivalent)
- **Yearly:** $144.40 USD (17% discount)

**Note:** Use USD as base currency. Polar will handle currency conversion automatically.

### Step 3: Configure Webhooks

1. Go to Polar Dashboard → Settings → Webhooks
2. Add webhook endpoint:
   ```
   https://pho.chat/api/payment/polar/webhook
   ```
3. Select events:
   - ✅ `checkout.completed`
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.canceled`
   - ✅ `payment.succeeded`
   - ✅ `payment.failed`
4. Copy webhook secret (starts with `whsec_`)

---

## 5. Testing

### Test in Sandbox Mode

1. Set `POLAR_SERVER=sandbox` in `.env.local`
2. Use Polar test cards:
   - **Success:** `4242 4242 4242 4242`
   - **Decline:** `4000 0000 0000 0002`
   - **3D Secure:** `4000 0027 6000 3184`

### Test Flow

```bash
# 1. Start development server
bun run dev

# 2. Navigate to subscription page
open http://localhost:3000/settings/subscription

# 3. Click "Upgrade to Premium"

# 4. Should redirect to Polar checkout page

# 5. Complete payment with test card

# 6. Should redirect back to success page

# 7. Check database for new subscription record
```

### Verify Webhook

```bash
# Use Polar CLI to test webhooks locally
npx @polar-sh/cli webhooks forward \
  --endpoint http://localhost:3000/api/payment/polar/webhook \
  --secret whsec_xxxxxxxxxxxxx
```

---

## 6. Deployment

### Step 1: Add Environment Variables to Vercel

```bash
# Using Vercel CLI
vercel env add POLAR_ACCESS_TOKEN
vercel env add POLAR_SERVER
vercel env add POLAR_WEBHOOK_SECRET
vercel env add POLAR_PRODUCT_STARTER_ID
# ... add all other Polar env vars
```

### Step 2: Deploy

```bash
git add .
git commit -m "feat: integrate Polar.sh payment gateway"
git push origin main
```

### Step 3: Update Webhook URL

In Polar Dashboard, update webhook URL to production:
```
https://pho.chat/api/payment/polar/webhook
```

---

## 7. Troubleshooting

### Issue: "Invalid access token"

**Solution:**
- Verify `POLAR_ACCESS_TOKEN` is correct
- Check token has required permissions
- Ensure token is not expired

### Issue: "Webhook signature verification failed"

**Solution:**
- Verify `POLAR_WEBHOOK_SECRET` matches Polar dashboard
- Check webhook endpoint is publicly accessible
- Ensure raw body is used for signature verification

### Issue: "Product not found"

**Solution:**
- Verify product IDs in environment variables
- Check products are created in correct Polar account (production vs sandbox)
- Ensure product IDs start with `prod_`

### Issue: "Payment declined"

**Solution:**
- Check customer's card details
- Verify sufficient funds
- Check if card supports international transactions
- Try different payment method

---

## 8. Payment Gateway Routing

### Automatic Gateway Selection

The system automatically selects the best payment gateway based on user's country:

```typescript
// Vietnam → Sepay (0% fees)
if (country === 'VN') {
  gateway = 'sepay';
}

// International → Polar.sh (Merchant of Record)
else {
  gateway = 'polar';
}
```

### Manual Gateway Selection (Future)

Users can manually select their preferred gateway:

```typescript
// API: POST /api/payment/polar/create
{
  "planId": "premium",
  "billingCycle": "monthly",
  "gateway": "polar" // Optional: force specific gateway
}
```

---

## 9. Customer Portal

### Enable Self-Service Management

Polar provides a customer portal where users can:
- View subscription details
- Update payment method
- Cancel subscription
- Download invoices

### Integration

```typescript
import { getCustomerPortalUrl } from '@/libs/polar';

// Get portal URL
const portalUrl = await getCustomerPortalUrl(customerId);

// Redirect user
window.location.href = portalUrl;
```

---

## 10. Monitoring

### Key Metrics to Track

1. **Conversion Rate**
   - Checkout started → Checkout completed
   - Target: >70%

2. **Payment Success Rate**
   - Payment attempted → Payment succeeded
   - Target: >95%

3. **Subscription Churn**
   - Active subscriptions → Canceled subscriptions
   - Target: <5% monthly

4. **Revenue**
   - Monthly Recurring Revenue (MRR)
   - Average Revenue Per User (ARPU)

### Polar Dashboard

Monitor these metrics in Polar Dashboard:
- https://polar.sh/dashboard/analytics

---

## 11. Next Steps

### Phase 1: Launch (Week 1-2)
- ✅ Polar integration complete
- ✅ Testing in sandbox
- ✅ Deploy to production
- ✅ Monitor first transactions

### Phase 2: Optimization (Week 3-4)
- Add more payment methods (Google Pay, Apple Pay)
- Implement retry logic for failed payments
- Add email notifications
- A/B test pricing

### Phase 3: Expansion (Month 2-3)
- Add Stripe for lower fees
- Add Razorpay for India
- Implement PPP pricing
- Multi-currency support

---

## 12. Support

### Polar Support
- **Docs:** https://docs.polar.sh
- **Discord:** https://discord.gg/polar
- **Email:** support@polar.sh

### pho.chat Team
- **GitHub Issues:** https://github.com/thaohienhomes/lobe-chat/issues
- **Email:** support@pho.chat

---

**Last Updated:** 2025-01-08  
**Version:** 1.0.0  
**Status:** Ready for production

