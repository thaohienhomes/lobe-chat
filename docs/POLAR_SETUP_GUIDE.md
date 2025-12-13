# Polar.sh Integration Setup Guide

> Complete guide for configuring Polar.sh payment gateway for Phở Chat global users.

## Overview

Polar.sh handles payments for **Global users (non-Vietnam)** with these plans:

| Plan Code     | Display Name  | Price (USD)     | Monthly Points |
| ------------- | ------------- | --------------- | -------------- |
| `gl_starter`  | Starter       | $0              | 30,000         |
| `gl_standard` | Standard      | $9.90           | 500,000        |
| `gl_premium`  | Premium       | $19.90          | 2,000,000      |
| `gl_lifetime` | Lifetime Deal | $149 (one-time) | 500,000/mo     |

---

## Step 1: Create Polar Account

1. Go to [polar.sh](https://polar.sh) and sign up with GitHub
2. Complete organization setup
3. Verify your email

---

## Step 2: Get Access Token

1. Navigate to **Settings** → **API Keys**
2. Click **Create New Token**
3. Name: `pho-chat-production`
4. Scopes: Select all (or minimum: `products`, `subscriptions`, `webhooks`)
5. Click **Create**
6. Copy token: `polar_at_xxxxxxxxxxxxx`

⚠️ **Save this token securely - you won't see it again!**

---

## Step 3: Create Products

Navigate to **Products** → **Create Product** for each plan:

### Product 1: Standard Plan

- **Name**: Phở Chat Standard
- **Description**: Unlimited Tier 1 models, 30 Tier 2 messages/day
- **Price**: $9.90/month (recurring)
- **Yearly option**: $99/year (17% discount)
- Click **Create**
- Note the **Product ID**: `prod_xxxxxxxxxxxxx`

### Product 2: Premium Plan

- **Name**: Phở Chat Premium
- **Description**: Unlimited Tier 1 & 2, 50 Tier 3 messages/day
- **Price**: $19.90/month (recurring)
- **Yearly option**: $199/year (17% discount)
- Click **Create**
- Note the **Product ID**: `prod_xxxxxxxxxxxxx`

### Product 3: Lifetime Deal

- **Name**: Phở Chat Lifetime
- **Description**: All Premium features forever, 500K points/month
- **Price**: $149 (one-time payment)
- Click **Create**
- Note the **Product ID**: `prod_xxxxxxxxxxxxx`

---

## Step 4: Setup Webhooks

1. Navigate to **Settings** → **Webhooks**
2. Click **Add Webhook**
3. Configure:
   - **URL**: `https://pho.chat/api/payment/polar/webhook`
   - **Events**: Select:
     - `checkout.completed`
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
     - `payment.succeeded`
     - `payment.failed`
4. Click **Create**
5. Copy **Webhook Secret**: `whsec_xxxxxxxxxxxxx`

---

## Step 5: Set Vercel Environment Variables

### Via Vercel Dashboard (Recommended)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select **pho.chat** project
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable:

| Variable Name               | Value            | Environments        |
| --------------------------- | ---------------- | ------------------- |
| `POLAR_ACCESS_TOKEN`        | `polar_at_xxxxx` | Production, Preview |
| `POLAR_SERVER`              | `production`     | Production          |
| `POLAR_SERVER`              | `sandbox`        | Preview             |
| `POLAR_WEBHOOK_SECRET`      | `whsec_xxxxx`    | Production, Preview |
| `POLAR_PRODUCT_STANDARD_ID` | `prod_xxxxx`     | Production, Preview |
| `POLAR_PRODUCT_PREMIUM_ID`  | `prod_xxxxx`     | Production, Preview |
| `POLAR_PRODUCT_LIFETIME_ID` | `prod_xxxxx`     | Production, Preview |

5. Click **Save**
6. **Redeploy** the project to apply changes

### Via Vercel CLI

```bash
vercel env add POLAR_ACCESS_TOKEN production
vercel env add POLAR_SERVER production # Enter: production
vercel env add POLAR_WEBHOOK_SECRET production
vercel env add POLAR_PRODUCT_STANDARD_ID production
vercel env add POLAR_PRODUCT_PREMIUM_ID production
vercel env add POLAR_PRODUCT_LIFETIME_ID production
```

---

## Step 6: Verify Configuration

### Test Webhook Endpoint

```bash
curl -X POST https://pho.chat/api/payment/polar/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
# Expected: 400 or 401 (missing signature) - NOT 404
```

### Check Polar Dashboard

1. Go to **Webhooks** in Polar dashboard
2. Click on your webhook
3. Check **Delivery Logs** for any test events

---

## Troubleshooting

| Issue                 | Cause                      | Solution                                   |
| --------------------- | -------------------------- | ------------------------------------------ |
| 404 on webhook        | Route not deployed         | Redeploy Vercel project                    |
| 401 Invalid signature | Wrong webhook secret       | Verify `POLAR_WEBHOOK_SECRET`              |
| Product not found     | Wrong product ID           | Check product IDs in Polar dashboard       |
| Points not added      | Missing userId in metadata | Ensure checkout includes `metadata.userId` |

---

## Code References

| File                                         | Purpose                 |
| -------------------------------------------- | ----------------------- |
| `src/app/api/payment/polar/webhook/route.ts` | Webhook handler         |
| `src/app/api/payment/polar/create/route.ts`  | Create checkout session |
| `src/libs/polar.ts`                          | Polar SDK utilities     |
| `src/config/pricing.ts`                      | Plan configurations     |

---

## Security Notes

1. Never commit tokens to git
2. Use different tokens for production/preview
3. Rotate tokens periodically
4. Monitor webhook delivery logs for anomalies
