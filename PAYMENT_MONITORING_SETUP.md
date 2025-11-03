# Payment System Monitoring Setup

## 📊 Monitoring Dashboard

### Key Metrics to Track

#### 1. Payment Creation Success Rate
```sql
-- Query to check payment creation success
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_payments,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM sepay_payments
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### 2. Payment Method Distribution
```sql
SELECT 
  payment_method,
  COUNT(*) as count,
  SUM(amount_vnd) as total_amount
FROM sepay_payments
GROUP BY payment_method;
```

#### 3. Subscription Activation Rate
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_subscriptions,
  SUM(CASE WHEN billing_cycle = 'monthly' THEN 1 ELSE 0 END) as monthly,
  SUM(CASE WHEN billing_cycle = 'yearly' THEN 1 ELSE 0 END) as yearly
FROM subscriptions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at);
```

---

## 🔔 Alert Configuration

### Critical Alerts

#### Alert 1: Payment Creation Failures
**Trigger**: More than 5 payment creation failures in 1 hour
**Action**: 
- Check application logs for import errors
- Verify database connection
- Check Sepay API status

#### Alert 2: Database Connection Errors
**Trigger**: Database connection failures
**Action**:
- Check DATABASE_URL configuration
- Verify database is running
- Check network connectivity

#### Alert 3: Webhook Processing Failures
**Trigger**: Webhook signature verification failures
**Action**:
- Verify webhook secret is correct
- Check webhook payload format
- Review Sepay API documentation

---

## 📈 Performance Metrics

### Response Time Targets
- Payment creation endpoint: < 2 seconds
- Payment status check: < 1 second
- Webhook processing: < 500ms

### Database Performance
- Query execution time: < 100ms
- Connection pool utilization: < 80%
- Slow query log: Monitor queries > 1 second

---

## 🔍 Log Monitoring

### Success Logs to Look For
```
✅ Payment record created successfully: {
  orderId: "...",
  userId: "...",
  timestamp: "..."
}
```

### Error Logs to Watch For
```
❌ Failed to create payment record: {
  error: "...",
  orderId: "...",
  userId: "...",
  timestamp: "..."
}
```

### Import Error Logs
```
Cannot find module '@/database/core/db-adaptor'
```

---

## 🛠️ Monitoring Tools

### 1. Vercel Analytics
- Navigate to: https://vercel.com/dashboard
- Check: Build logs, deployment status, error rates

### 2. Database Monitoring
- Use: PostgreSQL monitoring tools
- Check: Connection count, query performance, table sizes

### 3. Application Logs
- Use: Vercel logs or application logging service
- Check: Error rates, payment creation logs, webhook logs

### 4. Uptime Monitoring
- Monitor: `/api/payment/sepay/status` endpoint
- Expected: 200 OK response with payment status

---

## 📋 Daily Checklist

- [ ] Check payment creation success rate (target: > 99%)
- [ ] Review error logs for any import issues
- [ ] Verify database connection is stable
- [ ] Check webhook processing success rate
- [ ] Monitor subscription activation rate
- [ ] Review payment amounts and currencies
- [ ] Check for any failed transactions

---

## 🚨 Incident Response

### If Payment Creation Fails

**Step 1**: Check application logs
```bash
vercel logs --prod --follow
```

**Step 2**: Verify database connection
```bash
# SSH into Vercel deployment and test
psql $DATABASE_URL -c "SELECT 1"
```

**Step 3**: Check import paths
```bash
# Search for incorrect imports
grep -r "@/database/core/db-adaptor" src/
```

**Step 4**: Restart application
```bash
vercel deploy --prod --yes
```

---

## 📞 Escalation Path

1. **Level 1**: Check logs and metrics
2. **Level 2**: Verify database and configuration
3. **Level 3**: Review recent code changes
4. **Level 4**: Contact Sepay support if API issue
5. **Level 5**: Rollback to previous deployment

---

## ✅ Success Indicators

Payment system is healthy when:
- ✅ Payment creation success rate > 99%
- ✅ Average response time < 2 seconds
- ✅ No import resolution errors
- ✅ Database connection stable
- ✅ Webhook processing success rate > 99%
- ✅ Subscription activation rate > 95%

