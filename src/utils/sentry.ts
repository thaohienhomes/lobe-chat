import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception and send it to Sentry
 * @param error - The error to capture
 * @param context - Additional context information
 */
export const captureException = (error: Error | string, context?: Record<string, any>) => {
  if (process.env.NEXT_PUBLIC_ENABLE_SENTRY !== '1') {
    console.error('[Sentry] Disabled, error:', error);
    return;
  }

  if (typeof error === 'string') {
    Sentry.captureException(new Error(error), { extra: context });
  } else {
    Sentry.captureException(error, { extra: context });
  }
};

/**
 * Capture a message and send it to Sentry
 * @param message - The message to capture
 * @param level - The severity level
 * @param context - Additional context information
 */
export const captureMessage = (
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, any>,
) => {
  if (process.env.NEXT_PUBLIC_ENABLE_SENTRY !== '1') {
    console.log(`[Sentry] Disabled, message (${level}):`, message);
    return;
  }

  Sentry.captureMessage(message, level);
  if (context) {
    Sentry.setContext('additional', context);
  }
};

/**
 * Set user context for Sentry
 * @param userId - The user ID
 * @param email - The user email
 * @param username - The username
 */
export const setSentryUser = (userId?: string, email?: string, username?: string) => {
  if (process.env.NEXT_PUBLIC_ENABLE_SENTRY !== '1') return;

  Sentry.setUser({
    email,
    id: userId,
    username,
  });
};

/**
 * Clear user context from Sentry
 */
export const clearSentryUser = () => {
  if (process.env.NEXT_PUBLIC_ENABLE_SENTRY !== '1') return;

  Sentry.setUser(null);
};
