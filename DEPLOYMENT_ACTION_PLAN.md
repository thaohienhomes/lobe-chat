# Sepay Payment Integration - Deployment Action Plan

## 🎯 Objective
Deploy all Sepay payment integration fixes to production and verify successful payment processing.

---

## 📋 Pre-Deployment Checklist

- [x] Root cause identified and documented
- [x] All affected files fixed
- [x] All commits created and pushed to GitHub
- [x] Code review completed
- [x] Test plan documented
- [x] Monitoring setup documented
- [ ] **NEXT**: Deploy to Vercel production

---

## 🚀 Deployment Steps

### Step 1: Verify All Commits Are Pushed
```bash
cd /e/Projex25/X-Chat/lobe-chat
git log --oneline -5
git push origin thaohienhomes/feat/payment-system-production-ready
```

**Expected Output**:
```
0008e1391 (HEAD -> thaohienhomes/feat/payment-system-production-ready, origin/...)
  fix: correct database imports in trpc middleware files to use @/database/server
e82c9d8bd
  fix: correct database import in billing service to use @/database/server
25afbea71
  fix: correct database imports to use @/database/server
c69d5f2a0
  feat: Payment system production-ready with monitoring and subscription management
```

### Step 2: Deploy to Vercel Production
```bash
cd /e/Projex25/X-Chat/lobe-chat
vercel deploy --prod --yes
```

**Expected Output**:
- Deployment URL: `https://pho.chat`
- Build status: ✅ Success
- No TypeScript errors
- No build warnings

### Step 3: Verify Deployment
```bash
# Check deployment status
vercel status

# View deployment logs
vercel logs --prod --follow
```

---

## 🧪 Post-Deployment Testing

### Test 1: Bank Transfer Payment (5 minutes)
1. Open https://pho.chat/subscription/upgrade
2. Select "Premium Monthly" plan
3. Click "Chuyển khoản" (Bank Transfer)
4. Click "Thanh toán 129,000 đ"
5. **Verify**: QR code displays, no 500 error

### Test 2: Credit Card Payment (5 minutes)
1. Open https://pho.chat/subscription/upgrade
2. Select "Premium Yearly" plan
3. Click "Thẻ tín dụng" (Credit Card)
4. Enter test card: 4242 4242 4242 4242
5. **Verify**: Payment processes, no error

### Test 3: Database Verification (5 minutes)
1. Open https://pho.chat/admin/database
2. Click "Run Verification"
3. **Verify**: Dashboard loads, no errors

### Test 4: Monitoring Dashboard (5 minutes)
1. Open https://pho.chat/admin/monitoring
2. Check payment metrics
3. **Verify**: Metrics display correctly

---

## 📊 Monitoring During First 24 Hours

### Hourly Checks (First 6 hours)
- [ ] Check application logs for errors
- [ ] Verify payment creation success rate
- [ ] Monitor database connection status
- [ ] Check webhook processing

### Daily Checks (After 24 hours)
- [ ] Payment creation success rate > 99%
- [ ] No import resolution errors
- [ ] Database performance normal
- [ ] Subscription activation working
- [ ] No 500 errors on payment endpoints

---

## 🔍 Verification Queries

### Check Payment Records Created
```sql
SELECT COUNT(*) as total_payments,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
FROM sepay_payments
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Check Subscription Activations
```sql
SELECT COUNT(*) as new_subscriptions
FROM subscriptions
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Check for Errors
```sql
SELECT * FROM application_logs
WHERE level = 'ERROR'
AND created_at > NOW() - INTERVAL '24 hours'
AND message LIKE '%payment%'
ORDER BY created_at DESC;
```

---

## 🚨 Rollback Plan

If critical issues occur:

### Immediate Rollback
```bash
# Revert to previous deployment
vercel rollback

# Or deploy previous commit
git checkout 25afbea71
vercel deploy --prod --yes
```

### Rollback Triggers
- Payment creation success rate < 95%
- More than 10 500 errors in 1 hour
- Database connection failures
- Import resolution errors in logs

---

## 📞 Escalation Path

| Issue | Action | Contact |
|-------|--------|---------|
| Build fails | Check logs, fix errors | DevOps |
| Payment errors | Check database, verify imports | Backend |
| Webhook issues | Check Sepay API status | Sepay Support |
| Database issues | Check connection, verify schema | DBA |

---

## ✅ Success Criteria

Deployment is successful when:
1. ✅ All tests pass without errors
2. ✅ Payment creation success rate > 99%
3. ✅ No 500 errors on payment endpoints
4. ✅ Database records created successfully
5. ✅ Subscriptions activated after payment
6. ✅ No import resolution errors in logs
7. ✅ Monitoring alerts configured
8. ✅ 24-hour stability verified

---

## 📝 Post-Deployment Documentation

After successful deployment:
1. Update deployment runbook
2. Document any issues encountered
3. Update monitoring dashboards
4. Brief team on changes
5. Archive deployment logs

---

## 🎓 Lessons Learned

Document for future reference:
- Import path resolution issues
- Database initialization patterns
- Testing procedures
- Monitoring setup
- Deployment best practices

---

## 📅 Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Fix Development | ✅ Complete | Done |
| Code Review | ✅ Complete | Done |
| Testing Plan | ✅ Complete | Done |
| Deployment | ⏳ In Progress | Next |
| Post-Deployment Testing | ⏳ Pending | 30 min |
| Monitoring (24h) | ⏳ Pending | 24 hours |
| Verification | ⏳ Pending | Final |

---

## 🎉 Expected Outcome

After successful deployment:
- ✅ Users can create payments without errors
- ✅ Payment records stored in database
- ✅ Subscriptions activated automatically
- ✅ Payment system fully operational
- ✅ Production ready for users

