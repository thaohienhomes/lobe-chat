import { TRPCError } from '@trpc/server';

import { getServerDB } from '@/database/server';
import { pino } from '@/libs/logger';

import { trpc } from '../init';

// Configuration for retry behavior on transient database errors
const DB_RETRY_CONFIG = {
  maxRetries: 2,
  retryDelayMs: 100,
  // Error messages that indicate transient connection issues worth retrying
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

/**
 * Check if an error is a transient database connection error that can be retried
 */
const isTransientDBError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  const errorMessage = error.message.toLowerCase();
  return DB_RETRY_CONFIG.transientErrorPatterns.some((pattern) =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase()),
  );
};

/**
 * Sleep helper for retry delays
 */
const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });

/**
 * Server database middleware with retry logic for transient connection errors.
 *
 * Handles the common "Connection terminated unexpectedly" error from Neon serverless
 * by retrying the database connection acquisition. This is particularly important
 * in serverless environments (Vercel) where connections may become stale.
 *
 * Sentry issue: PHO-JAVASCRIPT-NEXTJS-2
 */
export const serverDatabase = trpc.middleware(async (opts) => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= DB_RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const serverDB = await getServerDB();

      // If this is a retry attempt that succeeded, log it for monitoring
      if (attempt > 0) {
        pino.info(`[pho.chat] Database connection recovered after ${attempt} retry attempt(s)`);
      }

      return opts.next({
        ctx: { serverDB },
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Only retry for transient connection errors
      if (isTransientDBError(error) && attempt < DB_RETRY_CONFIG.maxRetries) {
        pino.warn(
          `[pho.chat] Transient DB error on attempt ${attempt + 1}/${DB_RETRY_CONFIG.maxRetries + 1}: ${lastError.message}. Retrying...`,
        );
        await sleep(DB_RETRY_CONFIG.retryDelayMs * (attempt + 1)); // Exponential backoff
        continue;
      }

      // Log non-transient errors or final retry failure
      pino.error(
        `[pho.chat] Database connection failed (attempt ${attempt + 1}): ${lastError.message}`,
      );
      break;
    }
  }

  // All retries exhausted or non-transient error encountered
  // Throw a user-friendly tRPC error instead of crashing with raw DB error
  throw new TRPCError({
    cause: lastError,
    code: 'INTERNAL_SERVER_ERROR',
    message:
      'Unable to connect to the database. Please try again in a moment. If the problem persists, contact support.',
  });
});
