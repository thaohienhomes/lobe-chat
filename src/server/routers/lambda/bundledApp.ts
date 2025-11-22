import { z } from 'zod';

import { BundledAppModel } from '@/database/models/bundledApp';
import { publicProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';

/**
 * Bundled apps are system-wide templates, so we use publicProcedure
 * No userId required
 */
const bundledAppProcedure = publicProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;

  return opts.next({
    ctx: {
      bundledAppModel: new BundledAppModel(ctx.serverDB),
    },
  });
});

export const bundledAppRouter = router({
  
  
/**
   * Get bundled app by ID
   */
getAppById: bundledAppProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.bundledAppModel.findById(input.id);
    }),

  
  


/**
   * Get bundled apps by category
   */
getAppsByCategory: bundledAppProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.bundledAppModel.getByCategory(input.category);
    }),

  
  

/**
   * Get featured bundled apps
   */
getFeaturedApps: bundledAppProcedure.query(async ({ ctx }) => {
    return ctx.bundledAppModel.getFeatured();
  }),

  
  /**
   * Get all public bundled apps
   */
getPublicApps: bundledAppProcedure.query(async ({ ctx }) => {
    return ctx.bundledAppModel.query({ isPublic: true });
  }),

  /**
   * Track usage when user uses a bundled app
   */
  trackUsage: bundledAppProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.bundledAppModel.incrementUsageCount(input.id);
    }),
});
