import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENABLE_SENTRY = process.env.NEXT_PUBLIC_ENABLE_SENTRY === '1';

if (ENABLE_SENTRY && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enabled: ENABLE_SENTRY,
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Set `tracePropagationTargets` to control what URLs distributed tracing should be enabled for
    tracePropagationTargets: ['localhost', /^\//],
  });
}

