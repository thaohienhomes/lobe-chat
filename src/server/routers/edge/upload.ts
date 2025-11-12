import { z } from 'zod';

import { passwordProcedure, router } from '@/libs/trpc/edge';
import { S3 } from '@/server/modules/S3';

export const uploadRouter = router({
  createS3PreSignedUrl: passwordProcedure
    .input(z.object({ contentType: z.string().optional(), pathname: z.string() }))
    .mutation(async ({ input }) => {
      const s3 = new S3();

      return await s3.createPreSignedUrl(input.pathname, input.contentType);
    }),
});

export type FileRouter = typeof uploadRouter;
