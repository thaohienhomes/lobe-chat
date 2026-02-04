import { MEMORY_CATEGORIES, MemoryCategory } from '@lobechat/database/schemas';
import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { UserMemoryModel } from '@/server/models/userMemory';

const memoryProcedure = authedProcedure.use(serverDatabase).use(async ({ ctx, next }) => {
  return next({
    ctx: {
      memoryModel: new UserMemoryModel(ctx.userId),
    },
  });
});

export const userMemoryRouter = router({
  
  /**
   * Batch create memories (for auto-extraction)
   */
batchCreate: memoryProcedure
    .input(
      z.array(
        z.object({
          category: z.enum(MEMORY_CATEGORIES).default('context'),
          content: z.string().min(1).max(500),
          importance: z.number().min(1).max(10).default(5),
          sourceMessageId: z.string().optional(),
          sourceTopicId: z.string().optional(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      // Filter out duplicates
      const unique: typeof input = [];
      for (const memory of input) {
        const existing = await ctx.memoryModel.findSimilar(memory.content);
        if (!existing) {
          unique.push(memory);
        }
      }

      if (unique.length === 0) return [];
      return ctx.memoryModel.batchCreate(unique);
    }),

  
  


/**
   * Create a new memory
   */
create: memoryProcedure
    .input(
      z.object({
        category: z.enum(MEMORY_CATEGORIES).default('context'),
        content: z.string().min(1).max(500),
        importance: z.number().min(1).max(10).default(5),
        sourceMessageId: z.string().optional(),
        sourceTopicId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check for duplicates first
      const existing = await ctx.memoryModel.findSimilar(input.content);
      if (existing) {
        // Update importance if new one is higher
        if (input.importance > existing.importance) {
          return ctx.memoryModel.update(existing.id, { importance: input.importance });
        }
        return existing;
      }

      return ctx.memoryModel.create(input);
    }),

  
  




/**
   * Delete a memory
   */
delete: memoryProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.memoryModel.delete(input);
  }),

  
  




/**
   * Get all user memories, optionally filtered by category
   */
getAll: memoryProcedure
    .input(
      z
        .object({
          category: z.enum(MEMORY_CATEGORIES).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.memoryModel.getAll(input?.category as MemoryCategory);
    }),

  
  


/**
   * Get memory count
   */
getCount: memoryProcedure.query(async ({ ctx }) => {
    return ctx.memoryModel.count();
  }),

  
  
/**
   * Get formatted memories string for prompt injection
   */
getForPrompt: memoryProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).optional().default(10),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.memoryModel.getMemoriesForPrompt(input?.limit || 10);
    }),

  
  
/**
   * Mark memory as used (increments usage count)
   */
markAsUsed: memoryProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.memoryModel.markAsUsed(input);
  }),

  
  /**
   * Update a memory
   */
update: memoryProcedure
    .input(
      z.object({
        data: z.object({
          category: z.enum(MEMORY_CATEGORIES).optional(),
          content: z.string().min(1).max(500).optional(),
          importance: z.number().min(1).max(10).optional(),
        }),
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.memoryModel.update(input.id, input.data);
    }),
});

export type UserMemoryRouter = typeof userMemoryRouter;
