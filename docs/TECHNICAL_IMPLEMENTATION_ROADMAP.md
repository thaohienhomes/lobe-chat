# Technical Implementation Roadmap for pho.chat AI Cost Optimization

## Phase 1: Foundation Setup (Week 1-2)

### 1.1 Database Schema Migration

```sql
-- Add to your Drizzle migration file
CREATE TABLE usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT,
  model VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER DEFAULT 0,
  cost_usd REAL NOT NULL,
  cost_vnd REAL NOT NULL,
  query_complexity VARCHAR(20),
  query_category VARCHAR(50),
  response_time_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE monthly_usage_summary (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  total_queries INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  total_cost_vnd REAL DEFAULT 0,
  simple_queries INTEGER DEFAULT 0,
  medium_queries INTEGER DEFAULT 0,
  complex_queries INTEGER DEFAULT 0,
  subscription_tier VARCHAR(20),
  budget_limit_vnd REAL,
  budget_used_vnd REAL DEFAULT 0,
  budget_remaining_vnd REAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, month)
);

CREATE TABLE user_cost_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  monthly_budget_vnd REAL DEFAULT 29000,
  enable_cost_optimization BOOLEAN DEFAULT TRUE,
  max_cost_per_query_vnd REAL DEFAULT 100,
  enable_budget_alerts BOOLEAN DEFAULT TRUE,
  budget_alert_thresholds JSONB DEFAULT '{"warning": 75, "critical": 90, "emergency": 95}',
  preferred_models JSONB DEFAULT '[]',
  blocked_models JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_usage_logs_user_created ON usage_logs(user_id, created_at DESC);
CREATE INDEX idx_usage_logs_model ON usage_logs(model);
CREATE INDEX idx_monthly_summary_month ON monthly_usage_summary(month);
```

### 1.2 Enhanced Chat API Endpoint

```typescript
// src/app/webapi/chat/[provider]/route.ts - Enhanced version
import { auth } from '@clerk/nextjs/server';

import { CostOptimizationEngine, UsageTracker } from '@/server/modules/CostOptimization';

export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messages, model, stream = true, ...options } = body;

    // Initialize cost optimization
    const costEngine = new CostOptimizationEngine();
    const usageTracker = new UsageTracker(serverDB, userId);

    // Get user's subscription tier and remaining budget
    const userSubscription = await getUserSubscription(userId);
    const remainingBudget = await usageTracker.getRemainingBudget(userSubscription.tier);

    // Get optimal model recommendation
    const lastMessage = messages[messages.length - 1]?.content || '';
    const optimization = await costEngine.selectOptimalModel(lastMessage, userId, remainingBudget);

    // Override model if cost optimization suggests a better option
    const finalModel = optimization.recommendedModel;

    // Check budget before proceeding
    if (remainingBudget <= 0) {
      return NextResponse.json(
        {
          error: 'Đã hết ngân sách tháng này. Vui lòng nâng cấp gói hoặc chờ chu kỳ mới.',
          budgetExceeded: true,
          remainingBudgetVND: remainingBudget,
        },
        { status: 402 },
      );
    }

    // Execute the AI request
    const startTime = Date.now();
    const runtime = await initModelRuntimeWithUserPayload(params.provider, userId);

    const response = await runtime.chat({
      messages,
      model: finalModel,
      stream,
      ...options,
    });

    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;

    // Track usage (for streaming, this will be called after completion)
    if (!stream) {
      await trackUsageAfterCompletion({
        model: finalModel,
        provider: params.provider,
        inputTokens: estimateTokens(messages),
        outputTokens: estimateTokens(response.content),
        responseTimeMs,
        userId,
        costEngine,
        usageTracker,
      });
    }

    return response;
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function trackUsageAfterCompletion(params: {
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  responseTimeMs: number;
  userId: string;
  costEngine: CostOptimizationEngine;
  usageTracker: UsageTracker;
}) {
  const cost = params.costEngine.calculateCost({
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    model: params.model,
    userId: params.userId,
    sessionId: '', // Will be provided by client
  });

  await params.usageTracker.trackUsage({
    model: params.model,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    costUSD: cost,
    sessionId: '', // Will be provided by client
    queryComplexity: 'medium', // Will be determined by costEngine
  });
}
```

## Phase 2: Integration with Existing Systems (Week 3-4)

### 2.1 tRPC Router Integration

```typescript
// src/server/routers/lambda/index.ts - Add cost optimization router
import { costOptimizationRouter } from './costOptimization';

export const lambdaRouter = router({
  // ... existing routers
  costOptimization: costOptimizationRouter,
});
```

### 2.2 Sepay Payment Integration Enhancement

```typescript
// src/app/api/payment/sepay/webhook/route.ts - Enhanced version
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.status === 'success') {
      const { userId, planId, billingCycle } = body.metadata;

      // Update user subscription
      await updateUserSubscription(userId, planId, billingCycle);

      // Initialize cost settings for new subscription
      const budgetVND = VND_PRICING_TIERS[planId as keyof typeof VND_PRICING_TIERS].monthlyVND;

      await serverDB
        .insert('user_cost_settings')
        .values({
          userId,
          monthlyBudgetVND: budgetVND,
          enableCostOptimization: true,
          enableBudgetAlerts: true,
        })
        .onConflict(['userId'])
        .merge({
          monthlyBudgetVND: budgetVND,
          updatedAt: new Date(),
        });

      // Reset monthly usage for new billing cycle
      const currentMonth = new Date().toISOString().slice(0, 7);
      await serverDB
        .insert('monthly_usage_summary')
        .values({
          userId,
          month: currentMonth,
          subscriptionTier: planId,
          budgetLimitVND: budgetVND,
          budgetRemainingVND: budgetVND,
        })
        .onConflict(['userId', 'month'])
        .merge({
          subscriptionTier: planId,
          budgetLimitVND: budgetVND,
          budgetRemainingVND: budgetVND,
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sepay webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
```

## Phase 3: Frontend Integration (Week 5-6)

### 3.1 Cost Monitoring Dashboard Component

```typescript
// src/components/CostMonitoringDashboard.tsx
'use client';

import { Card, Progress, Alert, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';

const { Title, Text } = Typography;

export const CostMonitoringDashboard = () => {
  const { data: usageSummary } = trpc.costOptimization.getUsageSummary.useQuery();
  const { data: costSettings } = trpc.costOptimization.getCostSettings.useQuery();

  if (!usageSummary || !costSettings) {
    return <div>Loading...</div>;
  }

  const usagePercentage = usageSummary.usagePercentage || 0;
  const remainingBudget = usageSummary.budgetRemainingVND || 0;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>Theo dõi Chi phí AI</Title>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <Card title="Ngân sách Tháng này">
          <Progress
            percent={usagePercentage}
            status={usagePercentage >= 90 ? 'exception' : usagePercentage >= 75 ? 'active' : 'success'}
            format={() => `${usagePercentage.toFixed(1)}%`}
          />
          <div style={{ marginTop: '16px' }}>
            <Text>Còn lại: <strong>{remainingBudget.toLocaleString('vi-VN')} VND</strong></Text>
          </div>
        </Card>

        <Card title="Thống kê Sử dụng">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text>Tổng truy vấn: <strong>{usageSummary.totalQueries}</strong></Text>
            <Text>Tổng tokens: <strong>{usageSummary.totalTokens?.toLocaleString()}</strong></Text>
            <Text>Chi phí: <strong>{usageSummary.totalCostVND?.toLocaleString('vi-VN')} VND</strong></Text>
          </div>
        </Card>
      </div>

      {usagePercentage >= 75 && (
        <Alert
          message="Cảnh báo Ngân sách"
          description={`Bạn đã sử dụng ${usagePercentage.toFixed(1)}% ngân sách tháng này. Hãy cân nhắc nâng cấp gói hoặc tối ưu hóa việc sử dụng.`}
          type={usagePercentage >= 90 ? 'error' : 'warning'}
          showIcon
          style={{ marginTop: '16px' }}
        />
      )}
    </div>
  );
};
```

## Phase 4: Production Deployment (Week 7-8)

### 4.1 Environment Variables Setup

```bash
# Add to .env.local and Vercel environment variables
COST_OPTIMIZATION_ENABLED=true
VND_EXCHANGE_RATE=24167
BUDGET_ALERT_EMAIL_ENABLED=true
USAGE_TRACKING_ENABLED=true

# Sepay integration for Vietnamese market
SEPAY_API_KEY=your_sepay_api_key
SEPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 4.2 Monitoring and Alerting Setup

```typescript
// src/server/modules/AlertingSystem/index.ts
export class BudgetAlertingSystem {
  async checkAndSendAlerts(userId: string): Promise<void> {
    const usageTracker = new UsageTracker(serverDB, userId);
    const userSettings = await this.getUserCostSettings(userId);

    if (!userSettings.enableBudgetAlerts) return;

    const remainingBudget = await usageTracker.getRemainingBudget(userSettings.subscriptionTier);
    const usagePercentage =
      ((userSettings.monthlyBudgetVND - remainingBudget) / userSettings.monthlyBudgetVND) * 100;

    if (usagePercentage >= userSettings.budgetAlertThresholds.emergency) {
      await this.sendEmergencyAlert(userId, usagePercentage);
    } else if (usagePercentage >= userSettings.budgetAlertThresholds.critical) {
      await this.sendCriticalAlert(userId, usagePercentage);
    } else if (usagePercentage >= userSettings.budgetAlertThresholds.warning) {
      await this.sendWarningAlert(userId, usagePercentage);
    }
  }
}
```

## Migration Timeline with Rollback Strategies

### Week 1-2: Foundation

- ✅ Database schema migration
- ✅ Cost optimization engine implementation
- 🔄 Rollback: Drop new tables, revert to original chat API

### Week 3-4: Backend Integration

- ✅ Enhanced chat API with cost tracking
- ✅ tRPC router integration
- 🔄 Rollback: Feature flags to disable cost optimization

### Week 5-6: Frontend Integration

- ✅ Dashboard components
- ✅ User settings interface
- 🔄 Rollback: Hide UI components via feature flags

### Week 7-8: Production Deployment

- ✅ Gradual rollout (10% → 50% → 100% users)
- ✅ Monitoring and alerting
- 🔄 Rollback: Instant feature flag disable

## Success Metrics

1. **Cost Efficiency**: 15% reduction in average cost per query
2. **User Satisfaction**: <5% budget overrun complaints
3. **System Performance**: <100ms additional latency
4. **Revenue Impact**: 20% increase in subscription retention
