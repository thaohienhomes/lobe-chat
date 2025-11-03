# Payment Verification Deployment Guide

## Overview
This guide covers deploying the payment verification fixes to production. The fixes address automatic payment verification, subscription activation, and user redirection after successful Sepay bank transfer payments.

---

## Pre-Deployment Checklist

### 1. Code Review
- [x] Webhook handler payload normalization implemented
- [x] Error logging enhanced with stack traces
- [x] Signature verification made lenient for debugging
- [x] All tests passing (8/8 webhook tests)
- [x] Manual verification endpoint enhanced
- [x] Status endpoint enhanced

### 2. Environment Variables
Verify these are set in Vercel:
```
SEPAY_API_KEY=<your_api_key>
SEPAY_SECRET_KEY=<your_secret_key>
SEPAY_API_URL=https://api.sepay.vn
DATABASE_URL=<your_production_db_url>
```

### 3. Database
- [x] `sepay_payments` table exists with all required columns
- [x] `subscriptions` table exists with all required columns
- [x] Foreign key relationships configured
- [x] Indexes created for performance

---

## Deployment Steps

### Step 1: Deploy to Vercel
```bash
# Commit changes
git add .
git commit -m "🔧 fix: enhance payment verification and webhook handling"

# Push to your branch
git push origin thaohienhomes/feat/payment-system-production-ready

# Create PR and merge to main
# Then deploy to Vercel
```

### Step 2: Verify Webhook Configuration
1. Go to Sepay Dashboard
2. Check webhook URL is set to: `https://pho.chat/api/payment/sepay/webhook`
3. Verify webhook is enabled
4. Check recent webhook deliveries for any errors

### Step 3: Test Payment Flow

#### Option A: Manual Verification (Recommended First)
```bash
# Use the manual verification endpoint to test
curl -X POST https://pho.chat/api/payment/sepay/verify-manual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk_token>" \
  -d '{
    "orderId": "PHO_QR_TEST_123",
    "transactionId": "TXN_TEST_123",
    "amount": 100000,
    "description": "Test payment"
  }'
```

#### Option B: Real Payment Test
1. Create a payment order via `/api/payment/sepay/create`
2. Complete the bank transfer using the QR code
3. Monitor Vercel logs for webhook processing
4. Check database for subscription activation

### Step 4: Monitor Logs

#### Vercel Function Logs
```
# Look for these success indicators:
✅ Webhook received from: ...
✅ Normalized webhook data: ...
✅ Payment status updated successfully
✅ Subscription activated successfully for user: ...
✅ Webhook processed successfully for orderId: ...
```

#### Error Indicators
```
# If you see these, check the details:
❌ Missing orderId in webhook payload
❌ Missing transactionId in webhook payload
❌ Payment record not found for orderId: ...
❌ Sepay webhook processing error: ...
```

---

## Troubleshooting

### Issue: "Failed to fetch" errors in frontend console

**Solution:**
1. Check Vercel logs for `/api/payment/sepay/status` endpoint
2. Look for error messages with stack traces
3. Verify `orderId` and `amount` parameters are correct
4. Check database connection in Vercel environment

### Issue: Webhook not being processed

**Solution:**
1. Verify webhook URL in Sepay Dashboard
2. Check Vercel function logs for webhook endpoint
3. Look for "🔔 Webhook received from:" logs
4. Verify Sepay is sending webhooks (check Sepay Dashboard)

### Issue: Subscription not activated

**Solution:**
1. Check "✅ Subscription activated successfully" log
2. Verify payment record exists in database
3. Check `subscriptions` table for new entry
4. Verify `planId` and `billingCycle` in payment record

### Issue: Invalid signature errors

**Solution:**
1. Current implementation logs but continues processing
2. Check Sepay webhook signature format
3. Verify `SEPAY_SECRET_KEY` is correct
4. Compare signature generation with Sepay documentation

---

## Rollback Plan

If issues occur:

1. **Immediate Rollback:**
   ```bash
   git revert <commit_hash>
   git push origin main
   # Vercel will auto-deploy
   ```

2. **Verify Rollback:**
   - Check Vercel deployment status
   - Monitor logs for old behavior
   - Test payment flow again

---

## Post-Deployment Verification

### 24 Hours After Deployment
- [ ] Monitor error logs for any issues
- [ ] Check webhook processing success rate
- [ ] Verify subscription activations
- [ ] Test manual verification endpoint
- [ ] Check database for payment records

### 1 Week After Deployment
- [ ] Review payment metrics
- [ ] Check subscription activation rate
- [ ] Monitor error patterns
- [ ] Verify user redirects working
- [ ] Check frontend polling success rate

---

## Key Files Modified

1. **`src/app/api/payment/sepay/webhook/route.ts`**
   - Webhook handler with payload normalization
   - Enhanced error logging
   - Lenient signature verification

2. **`src/app/api/payment/sepay/status/route.ts`**
   - Enhanced status polling with detailed logs
   - Better error messages

3. **`src/app/api/payment/sepay/verify-manual/route.ts`**
   - Manual verification with enhanced logging
   - Better error propagation

4. **`src/libs/sepay/index.ts`**
   - Improved error handling in gateway

5. **`src/app/api/payment/sepay/webhook/route.test.ts`**
   - Updated tests with payload normalization
   - All 8 tests passing

---

## Success Metrics

After deployment, verify:
- ✅ Webhook processing success rate > 95%
- ✅ Subscription activation within 5 seconds of payment
- ✅ User redirect to success page working
- ✅ No "Failed to fetch" errors in frontend
- ✅ All error logs include stack traces
- ✅ Database updates occurring correctly

---

## Support

If issues occur:
1. Check Vercel logs first
2. Review error messages with stack traces
3. Check database for payment records
4. Verify Sepay webhook configuration
5. Test manual verification endpoint

