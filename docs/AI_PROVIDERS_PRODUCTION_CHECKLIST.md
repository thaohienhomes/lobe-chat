# AI Providers Production Deployment Checklist

> **Pre-deployment checklist for pho.chat AI model provider configuration**

## 📋 Pre-Deployment Checklist

### Phase 1: API Key Acquisition (Week 1)

#### OpenAI (CRITICAL - Required)

- [ ] Create OpenAI account at [platform.openai.com](https://platform.openai.com)
- [ ] Add payment method to OpenAI account
- [ ] Generate API key (starts with `sk-proj-` or `sk-`)
- [ ] Save API key securely (password manager)
- [ ] Set up billing alerts ($10, $50, $100)
- [ ] Verify account tier (Free → Tier 1 recommended)
- [ ] Test API key with curl:
  ```bash
  curl https://api.openai.com/v1/chat/completions \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'
  ```

#### Anthropic (HIGH PRIORITY - Recommended)

- [ ] Create Anthropic account at [console.anthropic.com](https://console.anthropic.com)
- [ ] Add payment method to Anthropic account
- [ ] Generate API key (starts with `sk-ant-`)
- [ ] Save API key securely
- [ ] Set up billing alerts ($10, $50, $100)
- [ ] Test API key with curl:
  ```bash
  curl https://api.anthropic.com/v1/messages \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "Content-Type: application/json" \
    -d '{"model":"claude-3-5-haiku-20241022","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
  ```

#### Google AI (MEDIUM PRIORITY - Optional)

- [ ] Create Google Cloud account
- [ ] Enable Google AI API
- [ ] Generate API key at [makersuite.google.com](https://makersuite.google.com/app/apikey)
- [ ] Save API key securely (starts with `AIzaSy`)
- [ ] Understand free tier limits (60 requests/minute)
- [ ] Test API key with curl:
  ```bash
  curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GOOGLE_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
  ```

#### DeepSeek (OPTIONAL - Cost Optimization)

- [ ] Create DeepSeek account at [platform.deepseek.com](https://platform.deepseek.com)
- [ ] Generate API key
- [ ] Save API key securely
- [ ] Understand pricing ($0.14/$0.28 per 1M tokens)

### Phase 2: Local Development Setup (Week 1)

#### Environment Configuration

- [ ] Copy `.env.example` to `.env.local`
- [ ] Add OpenAI API key to `.env.local`
- [ ] Add Anthropic API key to `.env.local`
- [ ] Add Google AI API key to `.env.local` (if using)
- [ ] Verify no API keys are committed to git:
  ```bash
  git status                       # .env.local should NOT appear
  cat .gitignore | grep .env.local # Should be listed
  ```

#### Local Testing

- [ ] Start development server: `bun run dev`
- [ ] Navigate to `http://localhost:3010`
- [ ] Go to Settings → Language Model
- [ ] Verify OpenAI provider appears with green checkmark
- [ ] Verify Anthropic provider appears with green checkmark
- [ ] Verify Google provider appears (if configured)
- [ ] Create new chat
- [ ] Test OpenAI model (gpt-4o-mini):
  - [ ] Send message: "Hello, how are you?"
  - [ ] Verify response received
  - [ ] Check response time (should be < 3 seconds)
- [ ] Test Anthropic model (claude-3-5-haiku):
  - [ ] Send message: "Hello, how are you?"
  - [ ] Verify response received
  - [ ] Check response time (should be < 3 seconds)
- [ ] Test Google model (gemini-2.0-flash) if configured:
  - [ ] Send message: "Hello, how are you?"
  - [ ] Verify response received
  - [ ] Check response time (should be < 3 seconds)

#### Error Handling Testing

- [ ] Test with invalid API key:
  - [ ] Temporarily change API key to invalid value
  - [ ] Restart server
  - [ ] Verify error message appears
  - [ ] Restore correct API key
- [ ] Test rate limiting (if possible):
  - [ ] Send multiple rapid requests
  - [ ] Verify graceful handling
- [ ] Test fallback behavior:
  - [ ] Disable OpenAI (set `ENABLED_OPENAI=0`)
  - [ ] Verify Anthropic is used as fallback
  - [ ] Re-enable OpenAI

### Phase 3: Vercel Configuration (Week 2)

#### Vercel Environment Variables Setup

- [ ] Log in to [Vercel Dashboard](https://vercel.com)
- [ ] Navigate to your project
- [ ] Go to Settings → Environment Variables
- [ ] Add OpenAI API key:
  - Variable: `OPENAI_API_KEY`
  - Value: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
  - Environments: ✓ Production ✓ Preview ✓ Development
- [ ] Add Anthropic API key:
  - Variable: `ANTHROPIC_API_KEY`
  - Value: `sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
  - Environments: ✓ Production ✓ Preview ✓ Development
- [ ] Add Google AI API key (if using):
  - Variable: `GOOGLE_API_KEY`
  - Value: `AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
  - Environments: ✓ Production ✓ Preview ✓ Development
- [ ] Add DeepSeek API key (if using):
  - Variable: `DEEPSEEK_API_KEY`
  - Value: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
  - Environments: ✓ Production ✓ Preview ✓ Development

#### Verify Environment Variables

- [ ] Screenshot environment variables page (for documentation)
- [ ] Verify all keys are set for Production environment
- [ ] Verify all keys are set for Preview environment
- [ ] Verify no keys are visible in screenshots (masked)

### Phase 4: Production Deployment (Week 2)

#### Pre-Deployment

- [ ] Verify all tests pass locally: `bun run test`
- [ ] Verify type checking passes: `bun run type-check`
- [ ] Verify build succeeds: `bun run build`
- [ ] Review deployment checklist in main README
- [ ] Verify database is configured and accessible
- [ ] Verify Clerk authentication is configured

#### Deployment

- [ ] Commit all changes: `git add . && git commit -m "Configure AI providers for production"`
- [ ] Push to main branch: `git push origin main`
- [ ] Monitor Vercel deployment:
  - [ ] Go to Vercel Dashboard → Deployments
  - [ ] Wait for deployment to complete
  - [ ] Check for build errors
  - [ ] Review deployment logs
- [ ] Verify deployment URL is accessible
- [ ] Check deployment status (should be "Ready")

#### Post-Deployment Verification

- [ ] Visit production URL
- [ ] Log in with Clerk authentication
- [ ] Navigate to Settings → Language Model
- [ ] Verify OpenAI provider appears
- [ ] Verify Anthropic provider appears
- [ ] Verify Google provider appears (if configured)
- [ ] Create new chat in production
- [ ] Test OpenAI model:
  - [ ] Send test message
  - [ ] Verify response received
  - [ ] Check response quality
  - [ ] Verify no errors in browser console
- [ ] Test Anthropic model:
  - [ ] Send test message
  - [ ] Verify response received
  - [ ] Check response quality
  - [ ] Verify no errors in browser console
- [ ] Test Google model (if configured):
  - [ ] Send test message
  - [ ] Verify response received
  - [ ] Check response quality
  - [ ] Verify no errors in browser console

#### Production Monitoring

- [ ] Check Vercel deployment logs for errors
- [ ] Check Vercel Analytics (if enabled)
- [ ] Monitor OpenAI usage dashboard
- [ ] Monitor Anthropic usage dashboard
- [ ] Monitor Google AI usage dashboard (if configured)
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Set up error tracking (e.g., Sentry) - optional

### Phase 5: Cost Management (Ongoing)

#### Billing Alerts

- [ ] OpenAI billing alerts configured:
  - [ ] $10 threshold (warning)
  - [ ] $50 threshold (critical)
  - [ ] $100 threshold (emergency)
- [ ] Anthropic billing alerts configured:
  - [ ] $10 threshold (warning)
  - [ ] $50 threshold (critical)
  - [ ] $100 threshold (emergency)
- [ ] Google AI quota alerts configured (if using)
- [ ] Email notifications enabled for all alerts

#### Usage Monitoring

- [ ] Review OpenAI usage daily (first week)
- [ ] Review Anthropic usage daily (first week)
- [ ] Review Google AI usage daily (first week, if using)
- [ ] Set up weekly usage reports
- [ ] Document baseline usage patterns
- [ ] Identify cost optimization opportunities

#### Cost Optimization

- [ ] Enable cost tracking in pho.chat:
  ```bash
  COST_OPTIMIZATION_ENABLED=true
  USAGE_TRACKING_ENABLED=true
  ```
- [ ] Review model selection strategy
- [ ] Consider using cheaper models for simple tasks:
  - Simple chat → gpt-4o-mini
  - Complex reasoning → gpt-4o
  - Code generation → claude-3-5-sonnet
- [ ] Implement request caching (if applicable)
- [ ] Monitor and optimize prompt lengths

### Phase 6: Security & Compliance (Week 3)

#### API Key Security

- [ ] Verify API keys are not in git history:
  ```bash
  git log --all --full-history --source -- .env.local
  # Should return nothing
  ```
- [ ] Verify API keys are not in public documentation
- [ ] Verify API keys are not in screenshots
- [ ] Store API keys in password manager
- [ ] Document API key rotation schedule (every 90 days)
- [ ] Set calendar reminders for key rotation

#### Access Control

- [ ] Limit Vercel project access to authorized team members
- [ ] Enable 2FA on OpenAI account
- [ ] Enable 2FA on Anthropic account
- [ ] Enable 2FA on Google account
- [ ] Enable 2FA on Vercel account
- [ ] Review and document who has access to API keys

#### Compliance

- [ ] Review OpenAI Terms of Service
- [ ] Review Anthropic Terms of Service
- [ ] Review Google AI Terms of Service
- [ ] Ensure compliance with data privacy regulations (GDPR, etc.)
- [ ] Document data handling practices
- [ ] Implement user consent mechanisms (if required)

### Phase 7: Documentation (Week 3)

#### Internal Documentation

- [ ] Document which providers are enabled
- [ ] Document API key locations (password manager)
- [ ] Document billing alert thresholds
- [ ] Document usage monitoring procedures
- [ ] Document incident response procedures
- [ ] Document key rotation procedures

#### User Documentation

- [ ] Update user guide with available models
- [ ] Document model selection recommendations
- [ ] Document cost implications (if applicable)
- [ ] Create FAQ for common issues

### Phase 8: Ongoing Maintenance

#### Weekly Tasks

- [ ] Review usage dashboards
- [ ] Check for cost anomalies
- [ ] Review error logs
- [ ] Monitor provider status pages:
  - [OpenAI Status](https://status.openai.com)
  - [Anthropic Status](https://status.anthropic.com)
  - [Google Cloud Status](https://status.cloud.google.com)

#### Monthly Tasks

- [ ] Review total costs vs. budget
- [ ] Analyze usage patterns
- [ ] Optimize model selection
- [ ] Review and update documentation
- [ ] Check for new model releases
- [ ] Update model lists if needed

#### Quarterly Tasks

- [ ] Rotate API keys (every 90 days)
- [ ] Review provider contracts
- [ ] Evaluate new providers
- [ ] Conduct security audit
- [ ] Review and update disaster recovery plan

---

## 🚨 Critical Issues Checklist

If you encounter issues, check these first:

### Provider Not Showing in UI

- [ ] Verify API key is set in Vercel
- [ ] Verify API key format is correct
- [ ] Verify environment variable name is correct (case-sensitive)
- [ ] Redeploy application
- [ ] Clear browser cache
- [ ] Check browser console for errors

### Invalid API Key Error

- [ ] Verify API key is active in provider dashboard
- [ ] Verify no extra spaces in API key
- [ ] Verify API key hasn't expired
- [ ] Regenerate API key if necessary
- [ ] Update Vercel environment variable
- [ ] Redeploy application

### Rate Limit Errors

- [ ] Check current usage in provider dashboard
- [ ] Verify account tier
- [ ] Upgrade tier if necessary
- [ ] Implement request queuing
- [ ] Configure fallback providers

### High Costs

- [ ] Review usage dashboard
- [ ] Identify high-cost requests
- [ ] Optimize prompt lengths
- [ ] Switch to cheaper models for simple tasks
- [ ] Implement request caching
- [ ] Set hard spending limits

---

## 📊 Success Metrics

After deployment, track these metrics:

### Availability

- [ ] Uptime > 99.9%
- [ ] Average response time < 3 seconds
- [ ] Error rate < 0.1%

### Cost

- [ ] Daily cost within budget
- [ ] Cost per request < target
- [ ] No unexpected cost spikes

### User Experience

- [ ] Chat response quality high
- [ ] No user-reported errors
- [ ] Fast response times

---

## 📞 Support Contacts

### Provider Support

- **OpenAI**: [help.openai.com](https://help.openai.com)
- **Anthropic**: [support.anthropic.com](https://support.anthropic.com)
- **Google AI**: [support.google.com](https://support.google.com)

### Internal Contacts

- **Technical Lead**: \[Your contact]
- **DevOps**: \[Your contact]
- **Security**: \[Your contact]

---

**Checklist Version**: 1.0\
**Last Updated**: January 2025\
**Next Review**: \[Set date]
