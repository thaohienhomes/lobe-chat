# 🚀 Polar.sh Setup Guide for Vercel Production

**Date**: 2025-10-31\
**Status**: Required for International Payments\
**Deployment**: pho.chat (Production)

---

## 📋 Overview

Polar.sh is the international payment gateway for pho.chat. It handles payments from non-Vietnamese users with automatic tax handling and multi-currency support.

**Key Features:**

- Merchant of Record (MoR) - handles tax automatically
- Multi-currency support (USD, EUR, GBP, etc.)
- Payment methods: Credit Card, PayPal, Google Pay, Apple Pay
- Automatic currency conversion
- Subscription management

---

## 🔑 Step 1: Get Polar API Credentials

### 1.1 Create Polar Account

1. Go to <https://polar.sh>
2. Sign up for a business account
3. Verify your email

### 1.2 Get Access Token

1. Log in to Polar Dashboard: <https://polar.sh/dashboard>
2. Navigate to **Settings → API Keys**
3. Click **Create API Key**
4. Copy the token (format: `polar_at_xxxxxxxxxxxxx`)
5. **Save this securely** - you'll need it for Vercel

### 1.3 Configure Webhook

1. In Polar Dashboard, go to **Settings → Webhooks**
2. Click **Create Webhook** or **Add Endpoint**
3. Configure webhook settings:
   - **URL**: `https://pho.chat/api/payment/polar/webhook`
   - **Format**: Raw (default)
   - **URL Requirements**:
     - Must use HTTPS (required by Polar)
     - Must be publicly accessible
     - Must return 200 status code for successful delivery
4. Select webhook events (check all that apply):
   - ✅ `subscription.created` - When a new subscription is created
   - ✅ `subscription.updated` - When subscription details change
   - ✅ `subscription.active` - When subscription becomes active
   - ✅ `subscription.canceled` - When subscription is canceled
   - ✅ `subscription.revoked` - When subscription is revoked
   - ✅ `subscription.uncanceled` - When cancellation is reversed
   - ✅ `order.created` - When a new order is created
   - ✅ `checkout.created` - When checkout session is created
   - ✅ `checkout.updated` - When checkout session is updated
   - ✅ `product.created` - When a new product is created
   - ✅ `product.updated` - When product details change
   - ✅ `benefit.created` - When a new benefit is created
   - ✅ `benefit.updated` - When benefit details change
5. Click **Create** or **Save**
6. Copy the webhook secret (format: `whsec_xxxxxxxxxxxxx`)
7. **Save this securely** - you'll need it for `POLAR_WEBHOOK_SECRET` environment variable

**Important Notes**:

- Polar uses HMAC-SHA256 signature validation for webhook security
- The webhook secret is used to verify that requests are genuinely from Polar
- Never expose the webhook secret in client-side code
- Webhook retries: Polar will retry failed webhooks with exponential backoff

---

## 📦 Step 2: Create Products and Prices in Polar

### 2.1 Create Starter Product

1. Go to **Products** in Polar Dashboard
2. Click **Create Product**
3. Fill in:
   - **Name**: Starter Plan
   - **Description**: Perfect for occasional AI users and students
   - **Type**: Subscription

### 2.2 Create Starter Prices

For the Starter product, create 2 prices:

**Monthly Price:**

- Amount: $1.99 USD
- Billing Period: Monthly
- Copy the Price ID (format: `price_xxxxxxxxxxxxx`)
- **Save as**: `POLAR_PRICE_STARTER_MONTHLY_ID`

**Yearly Price:**

- Amount: $19.99 USD (17% discount)
- Billing Period: Yearly
- Copy the Price ID
- **Save as**: `POLAR_PRICE_STARTER_YEARLY_ID`

**Get Product ID:**

- Copy the Starter Product ID (format: `prod_xxxxxxxxxxxxx`)
- **Save as**: `POLAR_PRODUCT_STARTER_ID`

### 2.3 Create Premium Product

Repeat for Premium Plan:

- **Name**: Premium Plan
- **Monthly Price**: $5.99 USD
- **Yearly Price**: $59.99 USD
- **Save IDs as**: `POLAR_PRODUCT_PREMIUM_ID`, `POLAR_PRICE_PREMIUM_MONTHLY_ID`, `POLAR_PRICE_PREMIUM_YEARLY_ID`

### 2.4 Create Ultimate Product

Repeat for Ultimate Plan:

- **Name**: Ultimate Plan
- **Monthly Price**: $14.99 USD
- **Yearly Price**: $149.99 USD
- **Save IDs as**: `POLAR_PRODUCT_ULTIMATE_ID`, `POLAR_PRICE_ULTIMATE_MONTHLY_ID`, `POLAR_PRICE_ULTIMATE_YEARLY_ID`

---

## 🔐 Step 3: Add Environment Variables to Vercel

### 3.1 Access Vercel Settings

1. Go to <https://vercel.com/dashboard>
2. Select the **lobe-chat** project
3. Click **Settings**
4. Go to **Environment Variables**

### 3.2 Add Polar Variables

Add the following variables **for Production environment only**:

```bash
# Polar Configuration
POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxx
POLAR_SERVER=production
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Starter Plan
POLAR_PRODUCT_STARTER_ID=prod_xxxxxxxxxxxxx
POLAR_PRICE_STARTER_MONTHLY_ID=price_xxxxxxxxxxxxx
POLAR_PRICE_STARTER_YEARLY_ID=price_xxxxxxxxxxxxx

# Premium Plan
POLAR_PRODUCT_PREMIUM_ID=prod_xxxxxxxxxxxxx
POLAR_PRICE_PREMIUM_MONTHLY_ID=price_xxxxxxxxxxxxx
POLAR_PRICE_PREMIUM_YEARLY_ID=price_xxxxxxxxxxxxx

# Ultimate Plan
POLAR_PRODUCT_ULTIMATE_ID=prod_xxxxxxxxxxxxx
POLAR_PRICE_ULTIMATE_MONTHLY_ID=price_xxxxxxxxxxxxx
POLAR_PRICE_ULTIMATE_YEARLY_ID=price_xxxxxxxxxxxxx
```

### 3.3 Verify Variables

1. After adding all variables, click **Save**
2. Verify each variable is set correctly
3. **Important**: Set these for **Production** environment only

---

## 🚀 Step 4: Deploy to Production

### 4.1 Redeploy Application

```bash
# Push changes to main branch
git add .
git commit -m "feat: add Polar environment variables for production"
git push origin main
```

Vercel will automatically trigger a new deployment.

### 4.2 Verify Deployment

1. Go to Vercel Dashboard
2. Check deployment status
3. Wait for "Ready" status
4. Visit <https://pho.chat> to verify

---

## ✅ Step 5: Test Payment Flow

### 5.1 Test International Payment

1. Use VPN to simulate non-Vietnamese IP
2. Go to <https://pho.chat/subscription/checkout>
3. Select a plan
4. Choose "Credit Card" payment method
5. Should redirect to Polar checkout page
6. Complete test payment

### 5.2 Verify Webhook

1. In Polar Dashboard, go to **Webhooks**
2. Check webhook delivery logs
3. Verify events are being received

---

## 🔍 Troubleshooting

### Issue: "Invalid access token"

**Solution:**

- Verify token format starts with `polar_at_`
- Check token hasn't expired
- Regenerate token if needed

### Issue: "Product not found"

**Solution:**

- Verify Product IDs are correct
- Check IDs are from production (not sandbox)
- Ensure prices are created for each product

### Issue: Webhook not receiving events

**Solution:**

- Verify webhook URL is correct: `https://pho.chat/api/payment/polar/webhook`
- Check webhook secret is correct
- Verify events are selected in webhook settings

---

## 📊 Pricing Reference

| Plan     | Monthly | Yearly  | Discount |
| -------- | ------- | ------- | -------- |
| Starter  | $1.99   | $19.99  | 17%      |
| Premium  | $5.99   | $59.99  | 17%      |
| Ultimate | $14.99  | $149.99 | 17%      |

---

## 🔗 Useful Links

- Polar Dashboard: <https://polar.sh/dashboard>
- Polar API Docs: <https://docs.polar.sh>
- Polar SDK: <https://github.com/polarsource/polar-js>
- Vercel Environment Variables: <https://vercel.com/docs/projects/environment-variables>
