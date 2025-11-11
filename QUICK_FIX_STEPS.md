# Quick Fix Steps - Sepay Webhook Issue

**Problem**: Payment stuck because webhook sent to ngrok URL instead of production URL  
**Time to Fix**: 10-15 minutes

---

## 🚀 **STEP-BY-STEP FIX (Do These Now)**

### **Step 1: Update Sepay Dashboard** (5 minutes)

1. **Open Sepay Dashboard**:
   - Go to: https://my.sepay.vn/
   - Log in with your credentials

2. **Navigate to Webhooks**:
   - Click on **Settings** or **Cài đặt**
   - Find **Webhooks** or **IPN Configuration**

3. **Find the Problematic Webhook**:
   - Look for webhook #13730 (or any webhook with ngrok URL)
   - Current URL: `https://e3c31fffa6b8.ngrok-free.app/api/payment/sepay/webhook`

4. **Update the URL**:
   - Click **Edit** (Chi tiết) or **Chỉnh sửa**
   - Change URL to: `https://pho.chat/api/payment/sepay/webhook`
   - Click **Save** (Lưu)

5. **Clean Up**:
   - **Suspend** or **Delete** any other webhooks with:
     - `ngrok.io` URLs
     - `localhost` URLs
     - Any development URLs
   - Keep ONLY the production webhook active

6. **Verify**:
   - Confirm only ONE webhook is active
   - Confirm it points to: `https://pho.chat/api/payment/sepay/webhook`
   - Confirm status is **Active** (Hoạt động)

---

### **Step 2: Recover the Stuck Payment** (5 minutes)

**Option A: Using the Automated Script** (Recommended)

Run this command in your terminal:

```bash
bun run scripts/manual-verify-payment.ts PHO_SUB_1762224720829_JKA788
```

**What it does**:
- Queries Sepay API to get actual payment status
- Updates database with correct status
- Activates user subscription
- Provides detailed output

**Expected Output**:
```
🚀 Starting manual payment verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OrderId: PHO_SUB_1762224720829_JKA788
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Step 1: Fetching payment record from database...
✅ Payment record found

🔍 Step 2: Querying Sepay API for payment status...
✅ Sepay API response: success

📝 Step 3: Updating payment record in database...
✅ Payment status updated successfully

🎯 Step 4: Activating subscription...
✅ Subscription activated successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 SUCCESS! Payment verified and subscription activated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If the script fails**, see Option B below.

---

**Option B: Manual Database Update** (If script fails)

1. **Get Transaction ID from Sepay**:
   - Go to Sepay Dashboard → Transactions
   - Search for OrderId: `PHO_SUB_1762224720829_JKA788`
   - Note the Transaction ID (e.g., `28949770`)

2. **Create and run this script**:

Create `scripts/quick-fix-payment.ts`:

```typescript
import { eq } from 'drizzle-orm';
import { getServerDB } from '../packages/database/src/core/db-adaptor';
import { sepayPayments, subscriptions } from '../packages/database/src/schemas';

async function quickFix() {
  const db = await getServerDB();
  
  // Update payment
  await db.update(sepayPayments).set({
    status: 'success',
    transactionId: '28949770', // ← Replace with actual transaction ID
    updatedAt: new Date(),
  }).where(eq(sepayPayments.orderId, 'PHO_SUB_1762224720829_JKA788'));
  
  // Create subscription
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  await db.insert(subscriptions).values({
    id: `sub_${Date.now()}`,
    userId: 'user_33HKLL8pPaIpyawymwQRlz7xBE7',
    planId: 'premium',
    billingCycle: 'monthly',
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: nextMonth,
    createdAt: now,
    updatedAt: now,
  });
  
  console.log('✅ Payment activated!');
}

quickFix();
```

Run:
```bash
bun run scripts/quick-fix-payment.ts
```

---

### **Step 3: Verify the Fix** (2 minutes)

1. **Check Database**:
```bash
bun run scripts/check-payment-status.ts PHO_SUB_1762224720829_JKA788
```

Expected output:
```
Payment Status: success  ✅
Transaction ID: 28949770  ✅
Subscription Status: active  ✅
```

2. **Test Frontend**:
   - Have the user refresh the payment page
   - They should see "Payment Successful" and be redirected
   - Subscription should be active in their account

---

### **Step 4: Test with New Payment** (5 minutes)

1. **Create a test payment**:
   - Go to https://pho.chat
   - Try to subscribe to Premium plan
   - Complete payment via QR code

2. **Monitor Vercel logs**:
```bash
bunx vercel logs --prod --follow
```

3. **Look for these logs**:
```
🔔 Webhook received from: Sepay/1.0
✅ Processing successful payment: PHO_SUB_...
✅ Payment status updated successfully
✅ Subscription activated successfully
```

4. **Verify**:
   - Payment status should update to "success" within 5 seconds
   - User should be redirected to success page
   - Subscription should be active

---

## ✅ **SUCCESS CHECKLIST**

After completing the steps above, verify:

- [ ] Sepay webhook URL updated to `https://pho.chat/api/payment/sepay/webhook`
- [ ] All ngrok webhooks deleted/suspended
- [ ] Stuck payment manually verified and activated
- [ ] User subscription is now active
- [ ] Test payment completed successfully
- [ ] Webhook appears in Vercel logs
- [ ] Frontend redirects correctly after payment

---

## 🚨 **IF SOMETHING GOES WRONG**

### **Script Fails with "SEPAY_SECRET_KEY not configured"**

The SEPAY_SECRET_KEY is already configured in Vercel production environment. The script should work when run against production data.

If you need to run it locally, add to `.env.local`:
```bash
SEPAY_SECRET_KEY=spsk_live_8cVMbpayaya0XhwEGRBdCGRBdC
```

### **Webhook Still Not Received**

1. Check Sepay dashboard webhook logs
2. Verify webhook URL is exactly: `https://pho.chat/api/payment/sepay/webhook`
3. Test webhook endpoint:
   ```bash
   curl https://pho.chat/api/payment/sepay/webhook
   ```
   Should return: `{"message":"Sepay webhook endpoint is accessible",...}`

### **Payment Still Pending After Manual Fix**

1. Check database directly:
   ```bash
   bun run scripts/check-payment-status.ts PHO_SUB_1762224720829_JKA788
   ```

2. If status is still "pending", run the manual fix script again

3. Check Vercel logs for any errors

---

## 📞 **NOTIFY THE USER**

After fixing, send this message to the user:

> Hi there,
> 
> Good news! We've resolved the issue with your payment.
> 
> **Your Premium subscription is now active!** 🎉
> 
> Please refresh your browser or log out and log back in to access all Premium features.
> 
> We apologize for the delay. This was caused by a temporary configuration issue that has now been fixed.
> 
> If you have any questions or issues, please don't hesitate to reach out.
> 
> Thank you for your patience!
> 
> Best regards,  
> pho.chat Support Team

---

## 📚 **DETAILED DOCUMENTATION**

For more details, see:
- `WEBHOOK_FIX_GUIDE.md` - Complete fix guide with prevention strategies
- `PAYMENT_ISSUE_ANALYSIS_2025-11-04.md` - Detailed root cause analysis
- `scripts/manual-verify-payment.ts` - Automated verification script
- `scripts/check-payment-status.ts` - Database status checker

---

## ⏱️ **TOTAL TIME**

- Step 1 (Update Sepay): 5 minutes
- Step 2 (Fix payment): 5 minutes
- Step 3 (Verify): 2 minutes
- Step 4 (Test): 5 minutes

**Total**: ~15-20 minutes to completely resolve the issue

---

**Ready to start? Begin with Step 1! 🚀**

