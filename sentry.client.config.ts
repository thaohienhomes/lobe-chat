import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set `tracePropagationTargets` to control what URLs distributed tracing should be enabled for
  tracePropagationTargets: ['localhost', /^\//],

  // Capture Replay for 10% of all sessions,
  // plus, capture 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  environment: process.env.NODE_ENV,
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

