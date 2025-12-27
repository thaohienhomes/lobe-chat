// instrumentation-client.ts
// Sentry client configuration for Next.js 15+ with Turbopack support
// Content moved from sentry.client.config.ts as per Sentry SDK recommendations
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENABLE_SENTRY = process.env.NEXT_PUBLIC_ENABLE_SENTRY === '1';

// Patterns for errors to ignore (expected/noise errors)
const IGNORED_ERROR_PATTERNS = [
  // User-initiated request cancellations
  /aborterror/i,
  /the operation was aborted/i,
  /signal is aborted/i,
  /fetch failed/i,
  // Browser extension errors
  /extension/i,
  /chrome-extension/i,
  /moz-extension/i,
  // Network errors that are expected
  /networkerror/i,
  /failed to fetch/i,
  /load failed/i,
  // ResizeObserver loop errors (browser quirk, not actionable)
  /resizeobserver loop/i,
  // Script errors from third-party scripts
  /script error/i,
  // Clerk-related expected errors
  /clerk: unable to retrieve/i,
  // TikTok Pixel errors (third-party)
  /tiktok/i,
  /ttq/i,
];

// Messages that indicate expected behavior (not real errors)
const EXPECTED_ERROR_MESSAGES = [
  'UNAUTHORIZED', // Expected for unauthenticated users hitting protected endpoints
  'NEXT_NOT_FOUND', // Expected 404s
  'ChunkLoadError', // Lazy loading failures (usually network issues)
];

if (ENABLE_SENTRY && SENTRY_DSN) {
  Sentry.init({
    // Filter out noise errors before sending to Sentry
    beforeSend(event, hint) {
      const error = hint.originalException;
      const errorMessage = error instanceof Error ? error.message : String(error || '');

      // Check if error matches ignored patterns
      for (const pattern of IGNORED_ERROR_PATTERNS) {
        if (pattern.test(errorMessage)) {
          return null; // Drop the event
        }
      }

      // Check for expected error messages
      for (const expectedMsg of EXPECTED_ERROR_MESSAGES) {
        if (errorMessage.includes(expectedMsg)) {
          return null; // Drop the event
        }
      }

      // Check event message as well
      if (event.message) {
        for (const pattern of IGNORED_ERROR_PATTERNS) {
          if (pattern.test(event.message)) {
            return null;
          }
        }
      }

      return event;
    },

    debug: false,

    dsn: SENTRY_DSN,

    // Disabled for production
    enabled: ENABLE_SENTRY,

    environment: process.env.NODE_ENV,

    // Additional ignore patterns for error titles
    ignoreErrors: [
      // Common browser/network errors
      'AbortError',
      'NetworkError',
      'ChunkLoadError',
      'Loading chunk',
      'Loading CSS chunk',
      // ResizeObserver (browser quirk)
      'ResizeObserver loop',
      // Script errors from third-party
      'Script error',
      // Clerk expected errors
      'Clerk:',
    ],

    integrations: [
      Sentry.replayIntegration({
        blockAllMedia: true,
        maskAllText: true,
      }),
    ],

    replaysOnErrorSampleRate: 1,

    // Session Replay: 10% of sessions, 100% of sessions with errors
    replaysSessionSampleRate: 0.1,

    // Distributed tracing targets
    tracePropagationTargets: ['localhost', /^\//],

    // Performance monitoring: 10% in production, 100% in development
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  });
}

// Export for Next.js navigation instrumentation (required by Sentry)
// This captures router transitions for performance monitoring
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
