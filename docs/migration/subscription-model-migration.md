# Subscription Model Migration Guide

## Overview

This document outlines the migration process from user-managed AI provider configurations to subscription-based model access control.

## Migration Goals

1. **Security**: Remove user-managed API keys to prevent unauthorized access
2. **Simplicity**: Provide automatic model enablement based on subscription plans
3. **Consistency**: Ensure all users have the same experience within their plan tier
4. **Revenue Protection**: Prevent free users from accessing premium models via personal API keys

## Architecture

### Phase 1: Backend Infrastructure ✅
- **Configuration**: `src/config/pricing.ts` - Plan-to-model mapping
- **Service Layer**: `src/services/subscription/modelAccess.ts` - Model access management
- **API Endpoints**: Auto-enable, check access, get allowed models
- **Database**: Existing `ai_providers` and `ai_models` tables

### Phase 2: Frontend Changes ✅
- **Feature Flags**: Hide AI provider settings UI
- **Model Filtering**: Subscription-aware model selection
- **UI Enhancements**: Tier badges, upgrade prompts
- **User Experience**: Clear indication of plan restrictions

### Phase 3: Migration & Rollout ✅
- **Migration Script**: `scripts/migrate-subscription-models.ts`
- **Monitoring**: `src/services/monitoring/migrationMonitor.ts`
- **Rollout Control**: `src/services/featureFlags/rolloutService.ts`
- **User Communication**: `src/services/communication/migrationNotifications.ts`

## Migration Process

### 1. Pre-Migration Preparation

```bash
# Test migration in dry-run mode
pnpm tsx scripts/migrate-subscription-models.ts --dry-run

# Create backup only
pnpm tsx scripts/migrate-subscription-models.ts --backup-only
```

### 2. Gradual Rollout

```bash
# Start with 10% rollout
pnpm tsx scripts/run-migration-with-monitoring.ts --rollout-percentage=10

# Increase to 50% after monitoring
pnpm tsx scripts/run-migration-with-monitoring.ts --rollout-percentage=50

# Full rollout
pnpm tsx scripts/run-migration-with-monitoring.ts --rollout-percentage=100
```

### 3. Monitoring & Alerts

Monitor migration progress via admin API:

```bash
curl -X GET "https://pho.chat/api/admin/migration/status"
```

Update rollout configuration:

```bash
curl -X POST "https://pho.chat/api/admin/migration/status" \
  -H "Content-Type: application/json" \
  -d '{"rolloutPercentage": 25, "enabled": true}'
```

## Plan-to-Model Mapping

### VN Plans (Vietnamese Market)

| Plan | Tier 1 Models | Tier 2 Models | Tier 3 Models | Default Model |
|------|---------------|---------------|---------------|---------------|
| `vn_free` | ✅ Unlimited | ❌ None | ❌ None | `gpt-4o-mini` |
| `vn_basic` | ✅ Unlimited | ✅ 30/day | ❌ None | `gpt-4o-mini` |
| `vn_pro` | ✅ Unlimited | ✅ Unlimited | ✅ 50/day | `gpt-4o` |
| `vn_team` | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited | `gpt-4o` |

### Global Plans (International Market)

| Plan | Tier 1 Models | Tier 2 Models | Tier 3 Models | Default Model |
|------|---------------|---------------|---------------|---------------|
| `gl_starter` | ✅ Unlimited | ❌ None | ❌ None | `gpt-4o-mini` |
| `gl_standard` | ✅ Unlimited | ✅ 100/day | ❌ None | `gpt-4o-mini` |
| `gl_premium` | ✅ Unlimited | ✅ Unlimited | ✅ 200/day | `gpt-4o` |
| `gl_lifetime` | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited | `gpt-4o` |

## Model Tiers

### Tier 1 (Budget Models) - 5 Phở Points
- `gpt-4o-mini`
- `gemini-1.5-flash`
- `claude-3-haiku`
- `deepseek-chat`

### Tier 2 (Standard Models) - 150 Phở Points
- `gpt-4o`
- `claude-3-sonnet`
- `gemini-1.5-pro`
- `deepseek-reasoner`

### Tier 3 (Premium Models) - 1000 Phở Points
- `gpt-4-turbo`
- `claude-3-opus`
- `o1`
- `o1-pro`

## Rollback Plan

If issues occur during migration:

1. **Immediate Rollback**:
   ```bash
   # Disable rollout
   curl -X POST "https://pho.chat/api/admin/migration/status" \
     -d '{"enabled": false, "rolloutPercentage": 0}'
   ```

2. **Restore User Settings**:
   ```bash
   # Restore from backup (manual process)
   # Backups are stored in scripts/migration-backups/YYYY-MM-DD/
   ```

3. **Re-enable Provider Settings**:
   ```typescript
   // In src/config/featureFlags/schema.ts
   provider_settings: true,
   openai_api_key: true,
   ```

## User Communication Timeline

### Pre-Migration (T-24h)
- Email announcement to affected users
- Blog post explaining changes
- In-app notification banner

### During Migration (T+0h)
- In-app progress indicator
- Real-time status updates
- Support team on standby

### Post-Migration (T+1h)
- Completion notifications
- Feature tour for new UI
- Feedback collection

## Success Metrics

### Technical Metrics
- **Migration Success Rate**: >95%
- **API Response Time**: <500ms average
- **Error Rate**: <2%
- **System Uptime**: >99.9%

### Business Metrics
- **User Satisfaction**: >4.0/5.0 rating
- **Support Tickets**: <5% increase
- **Subscription Upgrades**: Track conversion from upgrade prompts
- **Feature Adoption**: >80% users using new model selection

## Troubleshooting

### Common Issues

1. **Migration Fails for User**
   - Check user's subscription status
   - Verify database connectivity
   - Review error logs in backup directory

2. **Models Not Showing**
   - Verify feature flags configuration
   - Check API endpoint responses
   - Confirm subscription plan mapping

3. **Performance Issues**
   - Monitor database query performance
   - Check API response times
   - Scale infrastructure if needed

### Support Contacts

- **Technical Issues**: dev@pho.chat
- **User Support**: support@pho.chat
- **Emergency**: Slack #migration-alerts

## Post-Migration Cleanup

After successful migration (T+7 days):

1. **Remove Old Code**:
   - Legacy provider configuration UI
   - Unused API endpoints
   - Deprecated database columns

2. **Update Documentation**:
   - User guides
   - API documentation
   - Support articles

3. **Performance Optimization**:
   - Database index optimization
   - API response caching
   - Frontend bundle optimization

## Lessons Learned

Document lessons learned after migration completion:
- What went well
- What could be improved
- Recommendations for future migrations
