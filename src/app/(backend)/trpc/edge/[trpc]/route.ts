import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { NextRequest } from 'next/server';

import { pino } from '@/libs/logger';
import { createEdgeContext } from '@/libs/trpc/edge/context';
import { edgeRouter } from '@/server/routers/edge';

// Switch to Node.js runtime to ensure AWS SDK and other Node-only libs work
// Edge runtime caused 'DOMParser is not defined' during build/deploy due to bundled libs
export const runtime = 'nodejs';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    /**
     * @link https://trpc.io/docs/v11/context
     */
    createContext: () => createEdgeContext(req),

    endpoint: '/trpc/edge',

    onError: ({ error, path }) => {
      pino.info(`Error in tRPC handler (edge) on path: ${path}`);
      console.error(error);
    },

    req,
    router: edgeRouter,
  });

export { handler as GET, handler as POST };
