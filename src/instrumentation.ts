import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

// Export for Next.js error instrumentation (required by Sentry)
// This captures errors from nested React Server Components
export const onRequestError = Sentry.captureRequestError;
