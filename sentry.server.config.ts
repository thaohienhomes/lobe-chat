import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENABLE_SENTRY = process.env.NEXT_PUBLIC_ENABLE_SENTRY === '1';

// Server-side patterns for expected/noise errors
const SERVER_IGNORED_PATTERNS = [
  // Neon DB transient errors (already handled with retry logic)
  /Connection terminated unexpectedly/i,
  /ECONNRESET/i,
  /Connection refused/i,
  // Expected TRPC errors for unauthenticated users
  /UNAUTHORIZED/i,
  // Expected Next.js errors
  /NEXT_NOT_FOUND/i,
  /NEXT_REDIRECT/i,
  // Clerk session errors (expected for expired sessions)
  /Clerk/i,
];

if (ENABLE_SENTRY && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enabled: ENABLE_SENTRY,

    // Filter out noise errors before sending to Sentry
    beforeSend(event, hint) {
      const error = hint.originalException;
      const errorMessage = error instanceof Error ? error.message : String(error || '');

      // Check if error matches server-side ignored patterns
      for (const pattern of SERVER_IGNORED_PATTERNS) {
        if (pattern.test(errorMessage)) {
          return null; // Drop the event
        }
      }

      // Check event message as well
      if (event.message) {
        for (const pattern of SERVER_IGNORED_PATTERNS) {
          if (pattern.test(event.message)) {
            return null;
          }
        }
      }

      return event;
    },

    // Additional ignore patterns
    ignoreErrors: [
      'UNAUTHORIZED',
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
      'Connection terminated unexpectedly',
    ],

    // Performance monitoring: 10% in production, 100% in development
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profiling: 10% in production, 100% in development
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

