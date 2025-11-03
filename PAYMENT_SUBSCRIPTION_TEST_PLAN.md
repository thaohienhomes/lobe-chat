# Payment & Subscription System - Comprehensive Test Plan

## Test Environment Setup

**Prerequisites**:
- Local development environment with PostgreSQL running
- Sepay API credentials configured in `.env.local`
- Clerk authentication configured
- All fixes implemented and code compiled

---

## TEST SUITE 1: Webhook Processing (CRITICAL)

### Test 1.1: Webhook Double Parsing Fix
**Objective**: Verify webhook correctly processes payment notifications

**Steps**:
1. Send POST request to `/api/payment/sepay/webhook` with valid Sepay webhook payload
2. Verify webhook processes without errors
3. Check database for updated payment record
4. Verify subscription is activated

**Expected Result**: ✅ Payment status updated, subscription activated

**Test Command**:
```bash
curl -X POST http://localhost:3000/api/payment/sepay/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "PHO_SUB_1234567890_abc123",
    "status": "success",
    "amount": 99000,
    "currency": "VND",
    "transactionId": "TXN_123456"
  }'
```

---

## TEST SUITE 2: QR Code Bank Transfer (CRITICAL)

### Test 2.1: Create QR Code Payment
**Objective**: Verify QR code payment creation works

**Steps**:
1. Navigate to `/subscription/checkout`
2. Select "Bank Transfer" payment method
3. Fill in customer information
4. Click "Create Payment"
5. Verify QR code displays

**Expected Result**: ✅ QR code displays with payment details

### Test 2.2: Payment Polling Detection
**Objective**: Verify polling detects successful payment

**Steps**:
1. Create QR code payment (Test 2.1)
2. Simulate payment via Sepay API or manual verification
3. Verify polling detects payment within 5 seconds
4. Verify redirect to success page

**Expected Result**: ✅ Automatic redirect to success page

### Test 2.3: Manual Payment Verification
**Objective**: Verify manual verification fallback works

**Steps**:
1. Create QR code payment
2. Click "Manual Verification" button
3. Enter transaction ID
4. Click "Verify"
5. Verify subscription activated

**Expected Result**: ✅ Subscription activated after manual verification

---

## TEST SUITE 3: Credit Card Payment (CRITICAL)

### Test 3.1: Credit Card Form Submission
**Objective**: Verify credit card form submits to correct endpoint

**Steps**:
1. Navigate to `/subscription/checkout`
2. Select "Credit Card" payment method
3. Fill in card details (test card: 4111111111111111)
4. Click "Pay Now"
5. Verify request sent to `/api/payment/sepay/create-credit-card`

**Expected Result**: ✅ Request sent to Sepay credit card endpoint

### Test 3.2: Credit Card Payment Processing
**Objective**: Verify credit card payment processes correctly

**Steps**:
1. Complete Test 3.1
2. Verify payment record created in database
3. Verify webhook processes payment
4. Verify subscription activated

**Expected Result**: ✅ Subscription activated after payment

---

## TEST SUITE 4: Usage Data Fetching (HIGH)

### Test 4.1: Usage Overview Real Data
**Objective**: Verify usage page displays real data

**Steps**:
1. Navigate to `/settings?active=usage`
2. Verify usage data loads (not mock data)
3. Verify budget usage percentage displays
4. Verify query count displays
5. Verify token count displays

**Expected Result**: ✅ Real usage data displays correctly

### Test 4.2: Usage Data Accuracy
**Objective**: Verify usage calculations are accurate

**Steps**:
1. Make several AI requests
2. Wait for usage tracking to complete
3. Navigate to `/settings?active=usage`
4. Verify usage reflects recent requests
5. Verify cost calculations are correct

**Expected Result**: ✅ Usage data matches actual requests

---

## TEST SUITE 5: Subscription Management (HIGH)

### Test 5.1: Subscription Manage Page
**Objective**: Verify /subscription/manage page works

**Steps**:
1. Navigate to `/settings?active=usage`
2. Click "Manage Subscription" button
3. Verify page loads without errors
4. Verify subscription details display
5. Verify action buttons present

**Expected Result**: ✅ Page loads with subscription details

### Test 5.2: Payment Method Update Page
**Objective**: Verify /subscription/payment page works

**Steps**:
1. Navigate to `/settings?active=usage`
2. Click "Update Payment Method" button
3. Verify page loads without errors
4. Verify payment method options display
5. Verify selection works

**Expected Result**: ✅ Page loads with payment method options

---

## TEST SUITE 6: Sepay Transaction Query (HIGH)

### Test 6.1: Transaction Matching Logic
**Objective**: Verify improved transaction matching works

**Steps**:
1. Create QR code payment with order ID: `PHO_SUB_1234567890_abc123`
2. Simulate transaction with matching order ID in content
3. Call `/api/payment/sepay/status?orderId=PHO_SUB_1234567890_abc123`
4. Verify transaction is found and matched

**Expected Result**: ✅ Transaction matched correctly

### Test 6.2: Amount Matching Variations
**Objective**: Verify amount matching handles different formats

**Steps**:
1. Test with exact amount match
2. Test with amount / 100 (cents format)
3. Test with amount / 1000 (different format)
4. Verify all variations match correctly

**Expected Result**: ✅ All amount formats matched correctly

---

## TEST SUITE 7: Error Handling (MEDIUM)

### Test 7.1: Webhook Signature Verification
**Objective**: Verify webhook signature verification works

**Steps**:
1. Send webhook with invalid signature
2. Verify webhook rejected with 400 error
3. Send webhook with valid signature
4. Verify webhook processed

**Expected Result**: ✅ Invalid signatures rejected, valid signatures accepted

### Test 7.2: Database Connection Errors
**Objective**: Verify database errors handled gracefully

**Steps**:
1. Simulate database connection error
2. Attempt payment creation
3. Verify error message displayed to user
4. Verify no partial data saved

**Expected Result**: ✅ Errors handled gracefully

---

## TEST SUITE 8: End-to-End Flows (CRITICAL)

### Test 8.1: Complete QR Code Payment Flow
**Objective**: Verify entire QR code payment flow works

**Steps**:
1. User navigates to `/subscription/plans`
2. Selects plan and clicks "Subscribe"
3. Fills checkout form
4. Selects "Bank Transfer"
5. Receives QR code
6. Simulates payment
7. Polling detects payment
8. Redirects to success page
9. Subscription activated

**Expected Result**: ✅ Complete flow works end-to-end

### Test 8.2: Complete Credit Card Payment Flow
**Objective**: Verify entire credit card payment flow works

**Steps**:
1. User navigates to `/subscription/plans`
2. Selects plan and clicks "Subscribe"
3. Fills checkout form
4. Selects "Credit Card"
5. Enters card details
6. Submits payment
7. Webhook processes payment
8. Subscription activated

**Expected Result**: ✅ Complete flow works end-to-end

---

## Test Execution Commands

### Run All Tests
```bash
# Web tests
bunx vitest run --silent='passed-only' 'src/**/*.test.ts'

# Payment API tests
bunx vitest run --silent='passed-only' 'src/app/api/payment/**/*.test.ts'

# Subscription tests
bunx vitest run --silent='passed-only' 'src/app/[variants]/(main)/subscription/**/*.test.ts'
```

### Type Check
```bash
bun run type-check
```

---

## Deployment Checklist

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Webhook double parsing fixed
- [ ] Credit card routed to Sepay
- [ ] Usage data fetching implemented
- [ ] Transaction query logic improved
- [ ] /subscription/manage route created
- [ ] /subscription/payment route created
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Monitoring set up for webhooks
- [ ] Rollback plan documented

---

## Monitoring & Alerts

**Key Metrics to Monitor**:
- Webhook processing success rate
- Payment detection latency
- Usage data fetch latency
- Error rates by endpoint
- Database query performance

**Alert Thresholds**:
- Webhook success rate < 95%
- Payment detection latency > 30 seconds
- Error rate > 1%
- Database query time > 5 seconds

