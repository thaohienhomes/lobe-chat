import { LobeChatDatabase } from '@lobechat/database';
import { TRPCError } from '@trpc/server';

import { pino } from '@/libs/logger';
import { SubscriptionService } from '@/server/services/subscription';

import { trpc } from '../lambda/init';

/**
 * Subscription authorization middleware
 * Ensures users have an active PAID subscription before accessing AI features
 *
 * IMPORTANT: This middleware must be used AFTER:
 * - authedProcedure (provides userId)
 * - serverDatabase middleware (provides serverDB)
 */
export const subscriptionAuth = trpc.middleware(async (opts) => {
  const { ctx } = opts;

  // Check if userId exists (should be set by authedProcedure)
  if (!ctx.userId) {
    pino.error('subscriptionAuth: No userId in context');
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User not authenticated',
    });
  }

  // TypeScript doesn't know about serverDB from middleware chain, so we cast
  // serverDB is guaranteed to exist because serverDatabase middleware runs before this
  const serverDB = (ctx as any).serverDB as LobeChatDatabase;

  const subscriptionService = new SubscriptionService(serverDB);

  // Check if user can access AI models
  const canAccess = await subscriptionService.canAccessAIModels(ctx.userId);

  if (!canAccess) {
    const plan = await subscriptionService.getSubscriptionPlan(ctx.userId);

    pino.warn(
      {
        planId: plan.planId,
        status: plan.status,
        userId: ctx.userId,
      },
      'User attempted to access AI models without paid subscription',
    );

    throw new TRPCError({
      cause: {
        planId: plan.planId,
        status: plan.status,
        upgradeUrl: '/settings/subscription',
      },
      code: 'FORBIDDEN',
      message:
        'AI model access requires a paid subscription. Please upgrade your plan to access AI features.',
    });
  }

  pino.info({ userId: ctx.userId }, 'Subscription validation passed');

  return opts.next({
    ctx: {
      subscriptionService,
    },
  });
});
