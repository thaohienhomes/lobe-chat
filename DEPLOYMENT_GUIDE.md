# Production Deployment Guide - pho.chat Payment System

## Pre-Deployment Checklist

### 1. Code Quality Verification
```bash
# Type checking
bun run type-check

# Expected: Zero TypeScript errors
```

### 2. Automated Testing
```bash
# Run payment system tests
bunx vitest run --silent='passed-only' 'src/app/api/payment/sepay/**/*.test.ts'
bunx vitest run --silent='passed-only' 'src/server/services/billing/**/*.test.ts'
bunx vitest run --silent='passed-only' 'src/libs/sepay/**/*.test.ts'

# Expected: All tests pass with >80% coverage
```

### 3. Database Verification
```bash
# Verify production database connection
# Navigate to: /admin/database
# Run verification checks
# Expected: All checks pass (green status)
```

### 4. Environment Configuration

**Required Environment Variables:**
```
# Sepay Payment Gateway
SEPAY_API_KEY=<your-sepay-api-key>
SEPAY_API_SECRET=<your-sepay-api-secret>
SEPAY_WEBHOOK_SECRET=<your-sepay-webhook-secret>

# Database
DATABASE_URL=<your-production-database-url>
DATABASE_DRIVER=node

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-key>
CLERK_SECRET_KEY=<your-clerk-secret>

# Monitoring (Optional)
ENABLE_VERCEL_ANALYTICS=1
DEBUG_VERCEL_ANALYTICS=0
```

## Deployment Steps

### Step 1: Code Review
- [ ] Have team review all changes
- [ ] Verify no breaking changes
- [ ] Check for security issues

### Step 2: Local Testing
- [ ] Run type checking: `bun run type-check`
- [ ] Run tests: `bunx vitest run --silent='passed-only' 'src/**/*.test.ts'`
- [ ] Test payment flows manually in development

### Step 3: Staging Deployment (Optional)
- [ ] Deploy to staging environment
- [ ] Run end-to-end tests
- [ ] Verify all payment flows work
- [ ] Check monitoring dashboards

### Step 4: Production Deployment
```bash
# Deploy to Vercel
bun run deploy

# Or use the Vercel CLI
vercel --prod
```

### Step 5: Post-Deployment Verification
- [ ] Verify all endpoints are accessible
- [ ] Check monitoring dashboard: `/admin/monitoring`
- [ ] Check database verification: `/admin/database`
- [ ] Test payment flows end-to-end
- [ ] Monitor error rates and latency

### Step 6: Monitoring Setup
- [ ] Enable monitoring dashboards
- [ ] Set up alerts for critical metrics
- [ ] Configure log aggregation
- [ ] Set up backup procedures

## Rollback Procedures

### If Critical Issues Occur

1. **Immediate Rollback**
   ```bash
   # Revert to previous deployment
   vercel rollback
   ```

2. **Database Rollback** (if needed)
   ```bash
   # Restore from backup
   # Contact database administrator
   ```

3. **Communication**
   - Notify users of issue
   - Provide status updates
   - Estimate time to resolution

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Webhook Success Rate** (Target: >95%)
   - Location: `/admin/monitoring`
   - Alert if: <90%

2. **Payment Detection Latency** (Target: <30s)
   - Location: `/admin/monitoring`
   - Alert if: >45s

3. **Error Rate** (Target: <1%)
   - Location: `/admin/monitoring`
   - Alert if: >2%

4. **Database Health**
   - Location: `/admin/database`
   - Alert if: Any check fails

### Accessing Monitoring Dashboards

1. **Payment Metrics Dashboard**
   - URL: `https://pho.chat/admin/monitoring`
   - Requires: Admin authentication
   - Updates: Every 30 seconds

2. **Database Verification Dashboard**
   - URL: `https://pho.chat/admin/database`
   - Requires: Admin authentication
   - Manual refresh available

## Troubleshooting

### Issue: Webhook Processing Fails
**Solution:**
1. Check webhook signature verification logs
2. Verify Sepay webhook secret is correct
3. Check database connection
4. Review error logs in monitoring dashboard

### Issue: Payment Detection Timeout
**Solution:**
1. Check payment status endpoint latency
2. Verify database performance
3. Check Sepay API response times
4. Review polling mechanism

### Issue: Database Connection Error
**Solution:**
1. Verify DATABASE_URL is correct
2. Check database is running
3. Verify network connectivity
4. Run database verification checks

### Issue: Subscription Upgrade Fails
**Solution:**
1. Verify user has active subscription
2. Check plan IDs are valid
3. Verify database connection
4. Review error logs

## Performance Optimization

### Database Optimization
- Ensure indexes are created
- Monitor query performance
- Use connection pooling
- Regular maintenance

### API Optimization
- Monitor endpoint latency
- Check response times
- Optimize database queries
- Use caching where appropriate

### Monitoring Optimization
- Adjust metrics collection frequency
- Optimize dashboard queries
- Archive old metrics
- Clean up logs regularly

## Security Considerations

1. **Webhook Security**
   - Verify webhook signatures
   - Use HTTPS only
   - Validate webhook data
   - Log all webhook events

2. **Payment Security**
   - Never log sensitive payment data
   - Use masked card numbers
   - Verify SSL certificates
   - Follow PCI DSS guidelines

3. **Database Security**
   - Use strong passwords
   - Enable encryption
   - Regular backups
   - Access control

4. **API Security**
   - Require authentication
   - Rate limiting
   - Input validation
   - Error handling

## Support Contacts

- **Payment Issues**: Sepay Support
- **Database Issues**: Database Administrator
- **Deployment Issues**: DevOps Team
- **Monitoring Issues**: System Administrator

## Success Criteria

✅ All tests pass  
✅ Type checking passes  
✅ Database verification passes  
✅ Monitoring dashboards accessible  
✅ Payment flows work end-to-end  
✅ Webhook processing successful  
✅ Error rates <1%  
✅ Payment detection latency <30s  
✅ Webhook success rate >95%  

## Timeline

- **Pre-Deployment**: 1-2 hours
- **Deployment**: 15-30 minutes
- **Post-Deployment Verification**: 1-2 hours
- **Monitoring**: Continuous (24+ hours)

**Total Time**: 3-5 hours for full deployment and verification

