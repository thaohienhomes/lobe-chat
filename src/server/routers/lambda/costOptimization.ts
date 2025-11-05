// @ts-nocheck
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { CostOptimizationEngine, UsageTracker, VND_PRICING_TIERS } from '@/server/modules/CostOptimization';
import { monthlyUsageSummary, usageLogs } from '@/database/schemas/usage';

const costOptimizationProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;

  return opts.next({
    ctx: {
      ...ctx,
      costEngine: new CostOptimizationEngine(),
      usageTracker: new UsageTracker(ctx.serverDB, ctx.userId),
    },
  });
});

export const costOptimizationRouter = router({


  /**
     * Calculate cost breakdown for different usage patterns
     */
  calculateCostBreakdown: costOptimizationProcedure
    .input(
      z.object({
        complexQueries: z.number().min(0).max(1000),
        mediumQueries: z.number().min(0).max(5000),
        simpleQueries: z.number().min(0).max(10_000),
      })
    )
    .query(async ({ input, ctx }) => {
      const breakdown = ctx.costEngine.calculateMonthlyBreakdown(input);

      // Add Vietnamese context
      const vndBreakdown = {
        ...breakdown,
        breakdown: breakdown.breakdown.map(item => ({
          ...item,
          avgCostPerQueryVND: item.avgCostPerQuery * 24_167,
          totalCostVND: item.totalCost * 24_167,
        })),
        recommendedTier: breakdown.totalCostVND <= 1.2 ? 'starter' :
          breakdown.totalCostVND <= 2.4 ? 'premium' : 'ultimate',
      };

      return vndBreakdown;
    }),







  /**
     * Get user cost settings
     */
  getCostSettings: costOptimizationProcedure
    .query(async ({ ctx }) => {
      try {
        const settings = await ctx.serverDB
          .select()
          .from('user_cost_settings')
          .where({ userId: ctx.userId })
          .first();

        if (!settings) {
          return {
            blockedModels: [],
            budgetAlertThresholds: { critical: 90, emergency: 95, warning: 75 },
            enableBudgetAlerts: true,
            enableCostOptimization: true,
            maxCostPerQueryVND: 100,
            monthlyBudgetVND: 29_000,
            preferredModels: [],
          };
        }

        return settings;
      } catch (err) {
        console.error('costOptimization.getCostSettings error', err);
        return {
          blockedModels: [],
          budgetAlertThresholds: { critical: 90, emergency: 95, warning: 75 },
          enableBudgetAlerts: true,
          enableCostOptimization: true,
          maxCostPerQueryVND: 100,
          monthlyBudgetVND: 29_000,
          preferredModels: [],
        };
      }
    }),








  /**
     * Get optimal model recommendation based on query and budget
     */
  getOptimalModel: costOptimizationProcedure
    .input(
      z.object({
        query: z.string(),
        sessionId: z.string().optional(),
        subscriptionTier: z.enum(['starter', 'premium', 'ultimate']),
      })
    )
    .query(async ({ input, ctx }) => {
      const remainingBudget = await ctx.usageTracker.getRemainingBudget(input.subscriptionTier);

      const recommendation = await ctx.costEngine.selectOptimalModel(
        input.query,
        ctx.userId,
        remainingBudget
      );

      return {
        ...recommendation,
        subscriptionTier: input.subscriptionTier,
        tierLimits: VND_PRICING_TIERS[input.subscriptionTier],
      };
    }),







  /**
   * Get usage history (recent usage logs)
   */
  getUsageHistory: costOptimizationProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const logs = await ctx.serverDB
          .select({
            costUSD: usageLogs.costUSD,
            costVND: usageLogs.costVND,
            createdAt: usageLogs.createdAt,
            id: usageLogs.id,
            inputTokens: usageLogs.inputTokens,
            model: usageLogs.model,
            outputTokens: usageLogs.outputTokens,
            provider: usageLogs.provider,
            queryComplexity: usageLogs.queryComplexity,
            totalTokens: usageLogs.totalTokens,
          })
          .from(usageLogs)
          .where(eq(usageLogs.userId, ctx.userId))
          .orderBy(desc(usageLogs.createdAt))
          .limit(input.limit);

        return logs.map(log => ({
          ...log,
          date: log.createdAt.toISOString().split('T')[0],
        }));
      } catch (err) {
        console.error('costOptimization.getUsageHistory error', err);
        return [];
      }
    }),







  /**
       * Get detailed usage logs for analysis
       */
  getUsageLogs: costOptimizationProcedure
    .input(
      z.object({
        complexity: z.enum(['simple', 'medium', 'complex']).optional(),
        endDate: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        model: z.string().optional(),
        offset: z.number().min(0).default(0),
        startDate: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        let query = ctx.serverDB
          .select()
          .from('usage_logs')
          .where({ userId: ctx.userId })
          .orderBy('created_at DESC')
          .limit(input.limit)
          .offset(input.offset);

        if (input.startDate) {
          query = query.where('created_at >= ?', input.startDate);
        }
        if (input.endDate) {
          query = query.where('created_at <= ?', input.endDate);
        }
        if (input.model) {
          query = query.where({ model: input.model });
        }
        if (input.complexity) {
          query = query.where({ queryComplexity: input.complexity });
        }

        const logs = await query;

        // Calculate totals
        const totals = logs.reduce(
          (acc, log) => ({
            totalCostVND: acc.totalCostVND + log.costVND,
            totalQueries: acc.totalQueries + 1,
            totalTokens: acc.totalTokens + log.totalTokens,
          }),
          { totalCostVND: 0, totalQueries: 0, totalTokens: 0 },
        );

        return {
          logs,
          pagination: {
            hasMore: logs.length === input.limit,
            limit: input.limit,
            offset: input.offset,
          },
          totals,
        };
      } catch (err) {
        console.error('costOptimization.getUsageLogs error', err);
        return {
          logs: [],
          pagination: { hasMore: false, limit: input.limit, offset: input.offset },
          totals: { totalCostVND: 0, totalQueries: 0, totalTokens: 0 },
        };
      }
    }),


  /**
     * Get current month usage summary
     */
  getUsageSummary: costOptimizationProcedure
    .input(
      z.object({
        month: z.string().optional(), // YYYY-MM format, defaults to current month
      })
    )
    .query(async ({ input, ctx }) => {
      const targetMonth = input.month || new Date().toISOString().slice(0, 7);
      try {
        // First check if user has an active subscription
        const { subscriptions } = await import('@/database/schemas/billing');
        const { and } = await import('drizzle-orm');

        const activeSubscription = await ctx.serverDB
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.userId, ctx.userId),
              eq(subscriptions.status, 'active')
            )
          )
          .limit(1);

        // If no active subscription, return null to indicate no subscription
        if (!activeSubscription || activeSubscription.length === 0) {
          return null;
        }

        const summaryResult = await ctx.serverDB
          .select()
          .from(monthlyUsageSummary)
          .where(eq(monthlyUsageSummary.userId, ctx.userId))
          .limit(1);

        const summary = summaryResult[0];

        // If no usage summary yet but has subscription, return zero usage
        if (!summary) {
          const subscription = activeSubscription[0];
          const planId = subscription.planId as 'starter' | 'premium' | 'ultimate';
          const budgetLimit = VND_PRICING_TIERS[planId]?.monthlyVND || VND_PRICING_TIERS.starter.monthlyVND;

          return {
            budgetRemainingVND: budgetLimit,
            month: targetMonth,
            totalCostVND: 0,
            totalQueries: 0,
            totalTokens: 0,
            usagePercentage: 0,
          };
        }

        const usagePercentage = summary.budgetLimitVND
          ? ((summary.budgetUsedVND || 0) / summary.budgetLimitVND) * 100
          : 0;

        return {
          budgetRemainingVND: summary.budgetRemainingVND || 0,
          month: summary.month,
          totalCostVND: summary.totalCostVND || 0,
          totalQueries: summary.totalQueries || 0,
          totalTokens: summary.totalTokens || 0,
          usagePercentage,
        };
      } catch (err) {
        console.error('costOptimization.getUsageSummary error', err);
        // Return null on error to indicate no data available
        return null;
      }
    }),

  /**
     * Track usage after AI model request
     */
  trackUsage: costOptimizationProcedure
    .input(
      z.object({
        costUSD: z.number(),
        inputTokens: z.number(),
        model: z.string(),
        outputTokens: z.number(),
        provider: z.string(),
        queryCategory: z.string().optional(),
        queryComplexity: z.enum(['simple', 'medium', 'complex']),
        responseTimeMs: z.number().optional(),
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.usageTracker.trackUsage({
        costUSD: input.costUSD,
        inputTokens: input.inputTokens,
        model: input.model,
        outputTokens: input.outputTokens,
        queryComplexity: input.queryComplexity,
        sessionId: input.sessionId,
      });

      // Check if budget warning should be sent
      const subscriptionTier = await ctx.serverDB
        .select({ tier: 'subscription_tier' })
        .from('monthly_usage_summary')
        .where({ userId: ctx.userId })
        .orderBy('created_at DESC')
        .limit(1)
        .first();

      if (subscriptionTier?.tier) {
        const remainingBudget = await ctx.usageTracker.getRemainingBudget(
          subscriptionTier.tier as keyof typeof VND_PRICING_TIERS
        );

        const tierBudget = VND_PRICING_TIERS[subscriptionTier.tier as keyof typeof VND_PRICING_TIERS];
        const usagePercentage = ((tierBudget.monthlyVND - remainingBudget) / tierBudget.monthlyVND) * 100;

        return {
          budgetWarning: usagePercentage >= 75 ?
            `Đã sử dụng ${usagePercentage.toFixed(1)}% ngân sách tháng này` : undefined,
          remainingBudgetVND: remainingBudget,
          success: true,
          usagePercentage,
        };
      }

      return { success: true };
    }),


  /**
   * Update user cost settings
   */
  updateCostSettings: costOptimizationProcedure
    .input(
      z.object({
        blockedModels: z.array(z.string()).optional(),
        budgetAlertThresholds: z.object({
          critical: z.number().min(80).max(100),
          emergency: z.number().min(90).max(100),
          warning: z.number().min(50).max(100),
        }).optional(),
        enableBudgetAlerts: z.boolean().optional(),
        enableCostOptimization: z.boolean().optional(),
        maxCostPerQueryVND: z.number().min(1).max(1000).optional(),
        monthlyBudgetVND: z.number().min(10_000).max(1_000_000).optional(),
        preferredModels: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.serverDB
        .insert('user_cost_settings')
        .values({
          userId: ctx.userId,
          ...input,
        })
        .onConflict(['userId'])
        .merge(input);

      return { success: true };
    }),
});

export type CostOptimizationRouter = typeof costOptimizationRouter;
