import { TRPCError } from '@trpc/server';
import debug from 'debug';

import { getServerDB } from '@/database/server';
import { pino } from '@/libs/logger';

import { asyncAuth } from './asyncAuth';
import { asyncTrpc } from './init';

const log = debug('lobe-async:middleware');

// Configuration for retry behavior on transient database errors
// Mirrors the config in lambda/middleware/serverDatabase.ts
const DB_RETRY_CONFIG = {
  maxRetries: 2,
  retryDelayMs: 100,
  transientErrorPatterns: [
    'Connection terminated unexpectedly',
    'Connection terminated',
    'connection closed',
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'socket hang up',
    'WebSocket',
  ],
};

const isTransientDBError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const errorMessage = error.message.toLowerCase();
  return DB_RETRY_CONFIG.transientErrorPatterns.some((pattern) =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase()),
  );
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const publicProcedure = asyncTrpc.procedure;

export const asyncRouter = asyncTrpc.router;

/**
 * Database middleware with retry logic for transient connection errors.
 * Used by async tRPC procedures. Handles Neon serverless connection issues.
 *
 * Sentry issue: PHO-JAVASCRIPT-NEXTJS-2
 */
const dbMiddleware = asyncTrpc.middleware(async (opts) => {
  log('Database middleware called');
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= DB_RETRY_CONFIG.maxRetries; attempt++) {
    try {
      log('Getting server database connection (attempt %d)', attempt + 1);
      const serverDB = await getServerDB();
      log('Database connection established successfully');

      if (attempt > 0) {
        pino.info(
          `[pho.chat] Async DB connection recovered after ${attempt} retry attempt(s)`,
        );
      }

      return opts.next({
        ctx: { serverDB },
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (isTransientDBError(error) && attempt < DB_RETRY_CONFIG.maxRetries) {
        log('Transient DB error, retrying: %O', error);
        pino.warn(
          `[pho.chat] Async transient DB error on attempt ${attempt + 1}: ${lastError.message}. Retrying...`,
        );
        await sleep(DB_RETRY_CONFIG.retryDelayMs * (attempt + 1));
        continue;
      }

      log('Failed to establish database connection: %O', error);
      pino.error(
        `[pho.chat] Async database connection failed (attempt ${attempt + 1}): ${lastError.message}`,
      );
      break;
    }
  }

  throw new TRPCError({
    cause: lastError,
    code: 'INTERNAL_SERVER_ERROR',
    message:
      'Unable to connect to the database. Please try again in a moment. If the problem persists, contact support.',
  });
});

export const asyncAuthedProcedure = asyncTrpc.procedure.use(dbMiddleware).use(asyncAuth);

export const createAsyncCallerFactory = asyncTrpc.createCallerFactory;
