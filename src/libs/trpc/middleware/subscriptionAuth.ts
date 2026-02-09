import { LobeChatDatabase } from '@lobechat/database';
import { TRPCError } from '@trpc/server';

import { pino } from '@/libs/logger';
import { SubscriptionService } from '@/server/services/subscription';

import { trpc } from '../lambda/init';

/**
 * Subscription authorization middleware
 * Allows access for:
 * - Paid subscribers (unlimited)
 * - Free trial users (limited messages/tokens)
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

  // Check trial access (works for both paid and free users)
  const trialAccess = await subscriptionService.checkTrialAccess(ctx.userId);

  if (!trialAccess.allowed) {
    const plan = await subscriptionService.getSubscriptionPlan(ctx.userId);

    pino.warn(
      {
        messagesRemaining: trialAccess.messagesRemaining,
        planId: plan.planId,
        reason: trialAccess.reason,
        tokensRemaining: trialAccess.tokensRemaining,
        userId: ctx.userId,
      },
      'Trial expired - user needs to upgrade',
    );

    throw new TRPCError({
      cause: {
        isTrialExpired: true,
        upgradeUrl: '/settings/subscription',
      },
      code: 'FORBIDDEN',
      message: trialAccess.reason || 'Bạn đã sử dụng hết quota miễn phí. Nâng cấp để tiếp tục chat.',
    });
  }

  if (trialAccess.isTrialUser) {
    pino.info(
      {
        messagesRemaining: trialAccess.messagesRemaining,
        tokensRemaining: trialAccess.tokensRemaining,
        userId: ctx.userId,
      },
      'Trial user access granted',
    );
  } else {
    pino.info({ userId: ctx.userId }, 'Paid subscription validation passed');
  }

  return opts.next({
    ctx: {
      isTrialUser: trialAccess.isTrialUser,
      messagesRemaining: trialAccess.messagesRemaining,
      subscriptionService,
      tokensRemaining: trialAccess.tokensRemaining,
    },
  });
});
