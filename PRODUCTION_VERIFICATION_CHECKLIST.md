# Production Deployment Verification Checklist

**Deployment Date**: 2025-10-28\
**PR**: #9 - Deploy Sepay Payment Integration & Pricing Model Updates to Production\
**Commit**: 44123f811efef6da5b5c2e2a5f677662a384843c\
**Production URL**: <https://pho.chat>

---

## 🚀 Deployment Status

- [x] PR #9 merged to main
- [ ] Production deployment completed
- [ ] Production URL accessible
- [ ] No build errors
- [ ] No runtime errors in logs

---

## 🔐 Authentication & Access

### Clerk Authentication

- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Sign out flow works
- [ ] User profile accessible
- [ ] Session persistence works
- [ ] Protected routes redirect to sign-in

**Test Steps**:

1. Visit <https://pho.chat>
2. Click "Sign Up" or "Sign In"
3. Complete authentication flow
4. Verify user is logged in
5. Navigate to protected routes (e.g., /subscription)
6. Sign out and verify redirect

---

## 💳 Payment Integration Testing

### 1. Sepay Bank Transfer (Vietnamese Users)

**Prerequisites**:

- Logged in user
- Vietnamese IP or VPN
- Test bank account details

**Test Flow**:

1. Navigate to `/subscription/checkout`
2. Select a plan (Starter/Premium/Ultimate)
3. Verify pricing displays in VND (39k/129k/349k)
4. Select "Bank Transfer" payment method
5. Click "Subscribe" or "Pay Now"
6. Verify redirect to `/payment/waiting`
7. Check QR code displays correctly
8. Verify bank account details shown
9. Verify countdown timer (15 minutes)
10. Wait 5 minutes for manual verification button
11. Test manual verification flow
12. Verify payment status polling (every 5 seconds)
13. Complete payment via bank transfer
14. Verify redirect to `/payment/success`
15. Check subscription activated in user account

**Expected Results**:

- [ ] QR code displays correctly
- [ ] Bank account details visible
- [ ] Countdown timer works
- [ ] Manual verification available after 5 minutes
- [ ] Payment status updates automatically
- [ ] Success page shows after payment
- [ ] Subscription activated

**API Endpoints to Test**:

- [ ] `POST /api/payment/sepay/create` - Create bank transfer payment
- [ ] `GET /api/payment/sepay/status?orderId=xxx` - Check payment status
- [ ] `POST /api/payment/sepay/verify-manual` - Manual verification
- [ ] `POST /api/payment/sepay/webhook` - Webhook handler

---

### 2. Sepay Credit Card (Vietnamese Users)

**Prerequisites**:

- Logged in user
- Vietnamese IP or VPN
- Test credit card details (if available)

**Test Flow**:

1. Navigate to `/subscription/checkout`
2. Select a plan (Starter/Premium/Ultimate)
3. Verify pricing displays in VND
4. Select "Credit Card" payment method
5. Fill in credit card form:
   - Card number
   - Expiry date (MM/YY)
   - CVV
   - Cardholder name
6. Click "Pay Now"
7. Verify card validation (Luhn algorithm)
8. Verify redirect to payment gateway or success page
9. Complete payment
10. Verify redirect to `/payment/success`
11. Check subscription activated

**Expected Results**:

- [ ] Credit card form displays correctly
- [ ] Client-side validation works (Luhn, expiry, CVV)
- [ ] Card formatting works (spaces every 4 digits)
- [ ] Payment processes successfully
- [ ] Success page shows after payment
- [ ] Subscription activated

**API Endpoints to Test**:

- [ ] `POST /api/payment/sepay/create-credit-card` - Create credit card payment
- [ ] Rate limiting works (30 requests/min per IP, 10/min per user)

---

### 3. Polar Payment (International Users)

**Prerequisites**:

- Logged in user
- Non-Vietnamese IP (or use VPN to simulate)
- Test payment method (credit card, PayPal, etc.)

**Test Flow**:

1. Navigate to `/subscription/checkout`
2. Select a plan (Starter/Premium/Ultimate)
3. Verify pricing displays in USD or local currency
4. Verify PPP discount applied (if applicable)
5. Click "Subscribe" or "Pay Now"
6. Verify redirect to Polar checkout page
7. Complete payment on Polar
8. Verify redirect back to `/payment/success`
9. Check subscription activated

**Expected Results**:

- [ ] Polar checkout page loads
- [ ] Pricing displays correctly (USD or local currency)
- [ ] PPP discount applied correctly
- [ ] Payment processes successfully
- [ ] Redirect back to pho.chat works
- [ ] Subscription activated

**API Endpoints to Test**:

- [ ] `POST /api/payment/polar/create` - Create Polar checkout session
- [ ] `POST /api/payment/polar/webhook` - Webhook handler

---

### 4. Payment Gateway Routing

**Test Scenarios**:

1. **Vietnamese IP** → Should route to Sepay
2. **International IP** → Should route to Polar
3. **VPN switching** → Should detect and route correctly

**Expected Results**:

- [ ] Geo-location detection works
- [ ] Correct payment gateway selected
- [ ] No errors in routing logic

---

## 💰 Pricing & Subscription

### Pricing Display

- [ ] Starter plan: 39,000 VND or $5 USD
- [ ] Premium plan: 129,000 VND or $15 USD
- [ ] Ultimate plan: 349,000 VND or $45 USD
- [ ] Monthly/Yearly toggle works
- [ ] PPP discount badge shows (if applicable)
- [ ] Currency symbol correct (₫ for VND, $ for USD)

### Subscription Management

- [ ] Active subscription shows in user account
- [ ] Subscription details correct (plan, price, billing cycle)
- [ ] Upgrade/downgrade flow works
- [ ] Cancel subscription flow works
- [ ] Renewal date displayed correctly

**API Endpoints to Test**:

- [ ] `GET /api/subscription/pricing` - Get pricing for user's location
- [ ] `GET /api/subscription/current` - Get current subscription
- [ ] `POST /api/subscription/upgrade` - Upgrade subscription
- [ ] `POST /api/subscription/cancel` - Cancel subscription

---

## 🎨 UI/UX & Branding

### pho.chat Branding

- [ ] Logo displays correctly
- [ ] App name shows as "pho.chat"
- [ ] Favicon correct
- [ ] Meta tags updated (title, description)
- [ ] Social media preview images correct
- [ ] Color scheme matches branding
- [ ] Typography consistent

### Responsive Design

- [ ] Desktop view (1920x1080)
- [ ] Tablet view (768x1024)
- [ ] Mobile view (375x667)
- [ ] Payment forms responsive
- [ ] QR code displays correctly on mobile

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG standards
- [ ] Form labels and ARIA attributes correct

---

## 🔍 Error Handling & Edge Cases

### Payment Errors

- [ ] Invalid card number → Shows error message
- [ ] Expired card → Shows error message
- [ ] Insufficient funds → Shows error message
- [ ] Network timeout → Shows retry option
- [ ] Payment declined → Shows alternative payment methods

### Session Errors

- [ ] Expired session → Redirects to sign-in
- [ ] Invalid session → Shows error message
- [ ] Concurrent sessions → Handles correctly

### Edge Cases

- [ ] Payment timeout (15 minutes) → Shows timeout message
- [ ] Duplicate payment attempt → Prevents duplicate charges
- [ ] Browser back button during payment → Handles gracefully
- [ ] Page refresh during payment → Restores state

---

## 📊 Performance & Monitoring

### Performance Metrics

- [ ] Page load time < 3 seconds
- [ ] Time to Interactive (TTI) < 5 seconds
- [ ] First Contentful Paint (FCP) < 1.5 seconds
- [ ] Largest Contentful Paint (LCP) < 2.5 seconds
- [ ] Cumulative Layout Shift (CLS) < 0.1

### API Response Times

- [ ] Payment creation < 2 seconds
- [ ] Payment status check < 1 second
- [ ] Webhook processing < 500ms
- [ ] Pricing endpoint < 500ms

### Error Monitoring

- [ ] Check Vercel logs for errors
- [ ] Check Sentry (if configured) for exceptions
- [ ] Check database logs for query errors
- [ ] Check payment gateway logs for failures

---

## 🔒 Security Verification

### Payment Security

- [ ] HTTPS enforced on all pages
- [ ] No sensitive data in URLs
- [ ] No credit card data stored in database
- [ ] Rate limiting active on payment endpoints
- [ ] CSRF protection enabled
- [ ] XSS protection enabled

### Authentication Security

- [ ] Clerk session tokens secure
- [ ] No tokens in localStorage (should be httpOnly cookies)
- [ ] Protected routes require authentication
- [ ] API endpoints validate authentication

---

## 📝 Database Verification

### Schema Updates

- [ ] 68 tables exist (not 62)
- [ ] `sepay_payments` table exists
- [ ] `masked_card` field exists in billing table
- [ ] All migrations applied successfully
- [ ] No migration errors in logs

### Data Integrity

- [ ] Payment records created correctly
- [ ] Subscription records updated correctly
- [ ] User data consistent
- [ ] No orphaned records

**SQL Queries to Run**:

```sql
-- Check table count
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Check sepay_payments table
SELECT * FROM sepay_payments LIMIT 5;

-- Check recent subscriptions
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 10;

-- Check payment status distribution
SELECT status, COUNT(*) FROM sepay_payments GROUP BY status;
```

---

## 🌐 Internationalization (i18n)

### Language Support

- [ ] English (en-US) - Default
- [ ] Vietnamese (vi-VN) - For Vietnamese users
- [ ] Currency formatting correct for each locale
- [ ] Date/time formatting correct for each locale

### Translation Completeness

- [ ] Payment pages translated
- [ ] Subscription pages translated
- [ ] Error messages translated
- [ ] Success messages translated

---

## 📱 Cross-Browser Testing

### Desktop Browsers

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers

- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Samsung Internet (Android)

---

## 🚨 Rollback Plan

**If critical issues found**:

1. **Immediate Rollback**:

   ```bash
   # Via Vercel Dashboard
   # Go to Deployments → Find previous stable deployment → Click "Promote to Production"
   ```

2. **Previous Stable Deployment**:
   - Deployment ID: `dpl_GWhuGiRSgAyf7kRxaHoSJrAHZaPV`
   - Commit: `985dcb51843f6e9bca57847a36b2ce9803eb412c`
   - Status: READY (last known good state)

3. **Notify Team**:
   - Document the issue
   - Create hotfix branch
   - Fix and redeploy

---

## ✅ Sign-Off

**Verified By**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\
**Date**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\
**Deployment Status**: \[ ] APPROVED \[ ] ROLLBACK REQUIRED\
**Notes**:

---

## 📞 Support Contacts

- **Developer**: <thaohienhomes@gmail.com>
- **Vercel Support**: <https://vercel.com/support>
- **Sepay Support**: \[Sepay contact info]
- **Polar Support**: \[Polar contact info]

---

**End of Checklist**
