/**
 * Minimal file router for server-side rendering pages
 * This router ONLY includes the file.getFileItemById procedure to avoid
 * bundling the entire lambdaRouter (which pulls in 200+ MB of dependencies)
 * into page components that only need to fetch file metadata.
 *
 * DO NOT add more procedures here unless absolutely necessary for SSR pages.
 * For client-side operations, use the full lambdaRouter via tRPC client.
 */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { AsyncTaskModel } from '@/database/models/asyncTask';
import { ChunkModel } from '@/database/models/chunk';
import { FileModel } from '@/database/models/file';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { FileService } from '@/server/services/file';
import { FileListItem } from '@/types/files';

const fileProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;

  return opts.next({
    ctx: {
      asyncTaskModel: new AsyncTaskModel(ctx.serverDB, ctx.userId),
      chunkModel: new ChunkModel(ctx.serverDB, ctx.userId),
      fileModel: new FileModel(ctx.serverDB, ctx.userId),
      fileService: new FileService(ctx.serverDB, ctx.userId),
    },
  });
});

export const minimalFileRouter = router({
  getFileItemById: fileProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }): Promise<FileListItem | undefined> => {
      const item = await ctx.fileModel.findById(input.id);

      if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found' });

      let embeddingTask = null;
      if (item.embeddingTaskId) {
        embeddingTask = await ctx.asyncTaskModel.findById(item.embeddingTaskId);
      }
      let chunkingTask = null;
      if (item.chunkTaskId) {
        chunkingTask = await ctx.asyncTaskModel.findById(item.chunkTaskId);
      }

      const chunkCount = await ctx.chunkModel.count(input.id);

      return {
        chunkCount,
        chunkingStatus: chunkingTask?.status,
        createdAt: item.createdAt,
        embeddingStatus: embeddingTask?.status,
        fileType: item.fileType,
        id: item.id,
        name: item.name,
        size: item.size,
        updatedAt: item.updatedAt,
        url: await ctx.fileService.getFullFileUrl(item?.url),
      };
    }),
});

