# 🔄 Polar Pricing & Webhook Configuration Update

**Date**: 2025-10-31\
**Status**: ✅ UPDATED\
**Application**: pho.chat (Production)

---

## 📊 Updated Pricing Structure

### New USD Pricing for International Users (Polar)

| Plan     | Monthly | Yearly  | Discount | Change    |
| -------- | ------- | ------- | -------- | --------- |
| Starter  | $1.99   | $19.99  | 17%      | +$0.38/mo |
| Premium  | $5.99   | $59.99  | 17%      | +$0.65/mo |
| Ultimate | $14.99  | $149.99 | 17%      | +$0.55/mo |

### VND Pricing for Vietnamese Users (Sepay)

| Plan     | Monthly     | Yearly        | Discount |
| -------- | ----------- | ------------- | -------- |
| Starter  | 39,000 VND  | 390,000 VND   | 17%      |
| Premium  | 129,000 VND | 1,290,000 VND | 17%      |
| Ultimate | 349,000 VND | 3,490,000 VND | 17%      |

**Note**: VND pricing remains unchanged. Only USD pricing for Polar has been updated.

---

## 🔔 Webhook Configuration Details

### Webhook URL

**Production URL**: `https://pho.chat/api/payment/polar/webhook`

**Requirements**:

- Must use HTTPS (required by Polar)
- Must be publicly accessible
- Must return 200 status code for successful delivery
- Endpoint must validate webhook signature using HMAC-SHA256

### Webhook Events to Subscribe

When configuring the webhook in Polar Dashboard, select these events:

#### Subscription Events (CRITICAL)

- ✅ `subscription.created` - When a new subscription is created
- ✅ `subscription.updated` - When subscription details change
- ✅ `subscription.active` - When subscription becomes active
- ✅ `subscription.canceled` - When subscription is canceled
- ✅ `subscription.revoked` - When subscription is revoked
- ✅ `subscription.uncanceled` - When cancellation is reversed

#### Order & Checkout Events (IMPORTANT)

- ✅ `order.created` - When a new order is created
- ✅ `checkout.created` - When checkout session is created
- ✅ `checkout.updated` - When checkout session is updated

#### Product & Benefit Events (OPTIONAL)

- ✅ `product.created` - When a new product is created
- ✅ `product.updated` - When product details change
- ✅ `benefit.created` - When a new benefit is created
- ✅ `benefit.updated` - When benefit details change

### Webhook Secret

**Format**: `whsec_xxxxxxxxxxxxx`

**How to Obtain**:

1. Go to Polar Dashboard: <https://polar.sh/dashboard>
2. Navigate to **Settings → Webhooks**
3. Click **Create Webhook** or **Add Endpoint**
4. Enter webhook URL: `https://pho.chat/api/payment/polar/webhook`
5. Select events (see list above)
6. Click **Create** or **Save**
7. Copy the webhook secret displayed
8. Save securely for `POLAR_WEBHOOK_SECRET` environment variable

**Security Notes**:

- Polar uses HMAC-SHA256 for webhook signature validation
- The webhook secret is used to verify requests are genuinely from Polar
- Never expose the webhook secret in client-side code
- Store securely in Vercel environment variables

### Webhook Retry Policy

Polar automatically retries failed webhooks:

- **Retry Strategy**: Exponential backoff
- **Max Retries**: Multiple attempts over 24 hours
- **Success Criteria**: HTTP 200 status code
- **Failure Handling**: Check Polar Dashboard for delivery logs

---

## 🔧 Implementation Steps

### Step 1: Update Polar Products and Prices

1. Log in to Polar Dashboard: <https://polar.sh/dashboard>
2. Navigate to **Products**
3. For each plan (Starter, Premium, Ultimate):
   - Edit existing product or create new
   - Update monthly price to new USD amount
   - Update yearly price to new USD amount
   - Copy Product ID and Price IDs
   - Save changes

### Step 2: Configure Webhook

1. In Polar Dashboard, go to **Settings → Webhooks**
2. Click **Create Webhook** or **Add Endpoint**
3. Enter webhook URL: `https://pho.chat/api/payment/polar/webhook`
4. Select format: **Raw** (default)
5. Select all events listed above (13 events total)
6. Click **Create** or **Save**
7. Copy webhook secret: `whsec_xxxxxxxxxxxxx`
8. Save securely

### Step 3: Update Vercel Environment Variables

Add or update these environment variables in Vercel production:

```bash
# Polar Configuration
POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxx
POLAR_SERVER=production
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Starter Plan (Updated Prices)
POLAR_PRODUCT_STARTER_ID=prod_xxxxxxxxxxxxx
POLAR_PRICE_STARTER_MONTHLY_ID=price_xxxxxxxxxxxxx # $1.99/month
POLAR_PRICE_STARTER_YEARLY_ID=price_xxxxxxxxxxxxx  # $19.99/year

# Premium Plan (Updated Prices)
POLAR_PRODUCT_PREMIUM_ID=prod_xxxxxxxxxxxxx
POLAR_PRICE_PREMIUM_MONTHLY_ID=price_xxxxxxxxxxxxx # $5.99/month
POLAR_PRICE_PREMIUM_YEARLY_ID=price_xxxxxxxxxxxxx  # $59.99/year

# Ultimate Plan (Updated Prices)
POLAR_PRODUCT_ULTIMATE_ID=prod_xxxxxxxxxxxxx
POLAR_PRICE_ULTIMATE_MONTHLY_ID=price_xxxxxxxxxxxxx # $14.99/month
POLAR_PRICE_ULTIMATE_YEARLY_ID=price_xxxxxxxxxxxxx  # $149.99/year
```

### Step 4: Redeploy Application

1. Go to Vercel Dashboard: <https://vercel.com/dashboard>
2. Select **lobe-chat** project
3. Click **Deployments**
4. Click **...** on latest deployment
5. Click **Redeploy**
6. Wait for "Ready" status

### Step 5: Test Webhook Delivery

1. Make a test payment using Polar
2. Go to Polar Dashboard → **Webhooks**
3. Check webhook delivery logs
4. Verify events are being received
5. Check Vercel logs for webhook processing

---

## ✅ Verification Checklist

- [ ] Polar products updated with new USD pricing
- [ ] Polar prices created for all plans (monthly + yearly)
- [ ] Product IDs and Price IDs copied
- [ ] Webhook configured in Polar Dashboard
- [ ] Webhook URL set to `https://pho.chat/api/payment/polar/webhook`
- [ ] All 13 webhook events selected
- [ ] Webhook secret copied
- [ ] All 12 Polar environment variables added to Vercel
- [ ] Application redeployed
- [ ] Webhook delivery tested and verified
- [ ] Payment flow tested with new pricing

---

## 📋 Documentation Updated

The following documentation files have been updated with new pricing:

1. ✅ `POLAR_SETUP_GUIDE_FOR_VERCEL.md`
   - Updated pricing in Step 2.2, 2.3, 2.4
   - Updated pricing reference table
   - Enhanced webhook configuration section

2. ✅ `PAYMENT_FLOW_DIAGNOSTIC_REPORT.md`
   - Updated pricing structure section
   - Clarified Sepay vs Polar pricing

---

## 🔗 Quick Reference Links

- **Polar Dashboard**: <https://polar.sh/dashboard>
- **Polar Webhooks**: <https://polar.sh/dashboard/settings/webhooks>
- **Polar API Docs**: <https://docs.polar.sh>
- **Vercel Dashboard**: <https://vercel.com/dashboard>
- **pho.chat Application**: <https://pho.chat>

---

## 📞 Support

If you encounter issues:

1. **Webhook not receiving events**:
   - Verify webhook URL is correct
   - Check webhook secret is set in Vercel
   - Verify events are selected in Polar Dashboard
   - Check Vercel logs for errors

2. **Pricing not updating**:
   - Verify Product IDs and Price IDs are correct
   - Check environment variables in Vercel
   - Redeploy application after updating variables
   - Clear browser cache

3. **Payment flow issues**:
   - See `PAYMENT_ISSUES_ACTION_PLAN.md`
   - Check browser console for errors
   - Review Vercel deployment logs

---

## 🎯 Summary

✅ **Pricing Updated**: New USD pricing for international users\
✅ **Webhook Configured**: Complete webhook setup guide provided\
✅ **Documentation Updated**: All relevant files updated\
✅ **Ready for Implementation**: Follow steps above to deploy

**Estimated Time**: 30-45 minutes
