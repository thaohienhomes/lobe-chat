# Sepay Webhook Configuration Fix - Complete Guide

**Issue**: Webhook sent to ngrok development URL instead of production URL  
**Impact**: Payment stuck in pending status, subscription not activated  
**Date**: 2025-11-04

---

## 🔴 **ROOT CAUSE CONFIRMED**

From your Sepay dashboard screenshot:

**Webhook #13730**:
- ❌ **Wrong URL**: `https://e3c31fffa6b8.ngrok-free.app/api/payment/sepay/webhook`
- ❌ **HTTP Status**: 404 (ngrok URL is no longer active)
- ✅ **Correct URL**: `https://pho.chat/api/payment/sepay/webhook`

**Why this happened**:
- During development, you configured Sepay to send webhooks to your local ngrok tunnel
- When you deployed to production, the Sepay dashboard still had the old ngrok URL
- Ngrok URLs are temporary and expire when the tunnel closes
- Production payments are being sent to a dead ngrok URL → 404 error → payment stuck

---

## 🚨 **IMMEDIATE FIX (Do This First)**

### **Step 1: Update Sepay Dashboard Webhook URL**

1. **Log in to Sepay Dashboard**:
   - Go to https://my.sepay.vn/
   - Navigate to **Settings** → **Webhooks** (or **IPN Configuration**)

2. **Find Webhook #13730**:
   - Look for the webhook with URL: `https://e3c31fffa6b8.ngrok-free.app/api/payment/sepay/webhook`
   - This is the one causing the issue

3. **Update the URL**:
   - Click **Edit** (Chi tiết) on webhook #13730
   - Change the URL from:
     ```
     https://e3c31fffa6b8.ngrok-free.app/api/payment/sepay/webhook
     ```
     To:
     ```
     https://pho.chat/api/payment/sepay/webhook
     ```
   - **Save** the changes

4. **Verify the Configuration**:
   - Ensure the webhook is **Active** (not suspended)
   - Ensure the HTTP method is **POST**
   - Ensure there are no other active webhooks pointing to ngrok URLs

5. **Delete/Suspend Old Ngrok Webhooks**:
   - If you see any other webhooks with ngrok URLs, **suspend** or **delete** them
   - Keep only the production webhook with `https://pho.chat/api/payment/sepay/webhook`

---

## 💾 **MANUAL PAYMENT RECOVERY**

### **Step 2: Recover the Stuck Payment**

The payment `PHO_SUB_1762224720829_JKA788` needs to be manually verified and activated.

#### **Option A: Using the Manual Verification Script** (Recommended)

I've already created a script for this. Run:

```bash
bun run scripts/manual-verify-payment.ts PHO_SUB_1762224720829_JKA788
```

**What this script does**:
1. Queries Sepay API to get the actual payment status
2. Updates the database with the correct status and transaction ID
3. Activates the user's subscription
4. Provides detailed logging

**Expected output**:
```
🚀 Starting manual payment verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OrderId: PHO_SUB_1762224720829_JKA788
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Step 1: Fetching payment record from database...
✅ Payment record found:
   User ID: user_33HKLL8pPaIpyawymwQRlz7xBE7
   Plan: premium
   Amount: 129000 VND
   Current Status: pending

🔍 Step 2: Querying Sepay API for payment status...
✅ Sepay API response: { status: "success", transactionId: "..." }

📝 Step 3: Updating payment record in database...
✅ Payment status updated successfully

🎯 Step 4: Activating subscription...
✅ Subscription activated successfully
   Plan: premium
   Billing Cycle: monthly
   Next Billing Date: 2025-12-04T02:52:01.018Z

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 SUCCESS! Payment verified and subscription activated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### **Option B: Manual Database Update** (If script fails)

If the script fails or you don't have Sepay API access, you can manually update the database:

1. **Verify payment in Sepay dashboard**:
   - Go to Sepay dashboard → Transactions
   - Search for OrderId: `PHO_SUB_1762224720829_JKA788`
   - Confirm the payment status is "Success"
   - Note the Transaction ID (e.g., `28949770`)

2. **Update the database**:

Create a script `scripts/manual-activate-payment.ts`:

```typescript
import { eq } from 'drizzle-orm';
import { getServerDB } from '../packages/database/src/core/db-adaptor';
import { sepayPayments, subscriptions } from '../packages/database/src/schemas';

async function manualActivate() {
  const db = await getServerDB();
  
  const orderId = 'PHO_SUB_1762224720829_JKA788';
  const transactionId = '28949770'; // Replace with actual transaction ID from Sepay
  
  // Update payment status
  await db
    .update(sepayPayments)
    .set({
      status: 'success',
      transactionId: transactionId,
      updatedAt: new Date(),
    })
    .where(eq(sepayPayments.orderId, orderId));
  
  // Get payment details
  const payment = await db
    .select()
    .from(sepayPayments)
    .where(eq(sepayPayments.orderId, orderId))
    .limit(1);
  
  const p = payment[0];
  
  // Create subscription
  const now = new Date();
  const nextBilling = new Date(now);
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  
  await db.insert(subscriptions).values({
    id: `sub_${Date.now()}`,
    userId: p.userId,
    planId: p.planId,
    billingCycle: p.billingCycle,
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: nextBilling,
    createdAt: now,
    updatedAt: now,
  });
  
  console.log('✅ Payment activated successfully');
}

manualActivate();
```

Run:
```bash
bun run scripts/manual-activate-payment.ts
```

---

## 🛡️ **PERMANENT SOLUTION**

### **Step 3: Prevent This From Happening Again**

#### **3.1 Clean Up Sepay Dashboard**

**Action**: Remove ALL development/ngrok webhooks

1. Go to Sepay Dashboard → Webhooks
2. Review all webhook configurations
3. **Delete or Suspend** any webhooks with:
   - `ngrok.io` URLs
   - `localhost` URLs
   - Any non-production URLs
4. Keep ONLY the production webhook:
   - URL: `https://pho.chat/api/payment/sepay/webhook`
   - Status: Active
   - Method: POST

#### **3.2 Environment Variable Validation**

**Action**: Ensure `SEPAY_NOTIFY_URL` is always set correctly

Your Vercel environment variables show:
- ✅ `SEPAY_NOTIFY_URL` = `https://pho.chat/api/payment/sepay/webhook` (Correct!)

**For local development**, update your `.env.local`:

```bash
# For local development, use ngrok URL
SEPAY_NOTIFY_URL=https://your-ngrok-url.ngrok-free.app/api/payment/sepay/webhook

# For production (Vercel), this is already set correctly
# SEPAY_NOTIFY_URL=https://pho.chat/api/payment/sepay/webhook
```

**Important**: 
- When testing locally with ngrok, you'll need to manually update Sepay dashboard to use ngrok URL
- When done testing, **immediately** change it back to production URL
- Better approach: Use Sepay's test/sandbox environment for development

#### **3.3 Add Webhook URL Validation**

**Action**: Add validation to detect when webhooks are sent to wrong URLs

Add this to `src/app/api/payment/sepay/webhook/route.ts`:

```typescript
// At the top of POST handler
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestUrl = request.url;
  const expectedHost = process.env.NEXT_PUBLIC_APP_URL || 'https://pho.chat';
  
  // Log the request URL for debugging
  console.log('🔔 Webhook received at:', requestUrl);
  console.log('🔔 Expected host:', expectedHost);
  
  // Warn if webhook is sent to unexpected URL
  if (!requestUrl.includes(expectedHost)) {
    console.warn('⚠️ WARNING: Webhook sent to unexpected URL!');
    console.warn('   Received:', requestUrl);
    console.warn('   Expected:', expectedHost);
    console.warn('   This may indicate Sepay dashboard is misconfigured');
  }
  
  // Continue with normal processing...
}
```

#### **3.4 Add Webhook Monitoring**

**Action**: Set up alerts for webhook failures

Create `src/libs/monitoring/webhook-monitor.ts`:

```typescript
export class WebhookMonitor {
  static async checkWebhookHealth() {
    // Check if webhooks are being received
    // Alert if no webhooks received in last 24 hours during active payment period
  }
  
  static async alertOnWebhookFailure(orderId: string, error: string) {
    // Send alert to admin/developer
    console.error('🚨 WEBHOOK FAILURE ALERT:', {
      orderId,
      error,
      timestamp: new Date().toISOString(),
    });
    
    // TODO: Send email/Slack notification
  }
}
```

#### **3.5 Implement Webhook Retry Mechanism**

**Action**: Add automatic payment verification for stuck payments

Create a cron job that runs every hour to check for stuck payments:

```typescript
// src/app/api/cron/verify-pending-payments/route.ts
export async function GET() {
  const db = await getServerDB();
  
  // Find payments stuck in pending for > 30 minutes
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  const stuckPayments = await db
    .select()
    .from(sepayPayments)
    .where(
      and(
        eq(sepayPayments.status, 'pending'),
        lt(sepayPayments.createdAt, thirtyMinutesAgo)
      )
    );
  
  // Verify each stuck payment with Sepay API
  for (const payment of stuckPayments) {
    await verifyPaymentWithSepay(payment.orderId);
  }
  
  return NextResponse.json({ verified: stuckPayments.length });
}
```

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/verify-pending-payments",
    "schedule": "0 * * * *"
  }]
}
```

---

## ✅ **TESTING**

### **Step 4: Test the Fix**

#### **4.1 Test Webhook Endpoint Accessibility**

```bash
curl -X GET https://pho.chat/api/payment/sepay/webhook
```

**Expected response**:
```json
{
  "message": "Sepay webhook endpoint is accessible",
  "status": "ready",
  "timestamp": "2025-11-04T..."
}
```

#### **4.2 Test Webhook with Sepay Dashboard**

1. Go to Sepay Dashboard → Webhooks
2. Find your production webhook (`https://pho.chat/api/payment/sepay/webhook`)
3. Click **Test** or **Send Test Webhook**
4. Check Vercel logs to confirm webhook was received:
   ```
   🔔 Webhook received from: Sepay/1.0
   🔔 Webhook payload received: { ... }
   ```

#### **4.3 Test with Real Payment** (Recommended)

1. Create a new test payment (use smallest amount possible)
2. Complete the payment via QR code
3. Monitor Vercel logs in real-time:
   ```bash
   bunx vercel logs --prod --follow
   ```
4. Verify you see:
   - `🔔 Webhook received from: ...`
   - `✅ Processing successful payment: ...`
   - `✅ Payment status updated successfully`
   - `✅ Subscription activated successfully`
5. Check database to confirm:
   - Payment status = "success"
   - Transaction ID is populated
   - Subscription is created and active
6. Verify frontend redirects correctly after payment

---

## 📋 **CHECKLIST**

Use this checklist to ensure everything is fixed:

### **Immediate Fix**
- [ ] Updated Sepay webhook URL to `https://pho.chat/api/payment/sepay/webhook`
- [ ] Suspended/deleted all ngrok webhooks in Sepay dashboard
- [ ] Verified only ONE active webhook exists (production URL)
- [ ] Ran manual verification script for stuck payment
- [ ] Confirmed user subscription is now active
- [ ] Notified user that payment is resolved

### **Permanent Solution**
- [ ] Cleaned up all development webhooks from Sepay dashboard
- [ ] Verified `SEPAY_NOTIFY_URL` environment variable is correct
- [ ] Added webhook URL validation to webhook handler
- [ ] Added webhook monitoring/alerting
- [ ] Implemented automatic payment verification cron job
- [ ] Documented the correct webhook configuration process

### **Testing**
- [ ] Tested webhook endpoint accessibility (GET request)
- [ ] Sent test webhook from Sepay dashboard
- [ ] Verified webhook appears in Vercel logs
- [ ] Completed test payment end-to-end
- [ ] Confirmed payment status updates correctly
- [ ] Confirmed subscription activates correctly
- [ ] Confirmed frontend redirects correctly

---

## 🎯 **SUMMARY**

**Problem**: Sepay webhooks sent to expired ngrok URL → 404 error → payments stuck  
**Solution**: Update Sepay dashboard to use production URL  
**Prevention**: Remove all dev webhooks, add monitoring, implement auto-verification  

**Next Steps**:
1. ✅ Update Sepay webhook URL (5 minutes)
2. ✅ Run manual verification script (2 minutes)
3. ✅ Test with new payment (10 minutes)
4. ✅ Implement monitoring (30 minutes)
5. ✅ Set up cron job for auto-verification (30 minutes)

**Total Time**: ~1-2 hours to fully resolve and prevent future issues

