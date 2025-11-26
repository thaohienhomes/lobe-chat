import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to capture API errors and send them to Sentry
 * Wrap your API route handlers with this middleware
 */
export const withSentryErrorHandler = (
  handler: (req: NextRequest) => Promise<NextResponse>,
) => {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      // Capture the error in Sentry
      Sentry.captureException(error, {
        contexts: {
          http: {
            method: req.method,
            url: req.url,
          },
        },
      });

      // Return error response
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 },
      );
    }
  };
};

/**
 * Utility to add Sentry context to API requests
 */
export const addSentryContext = (
  context: Record<string, any>,
) => {
  if (process.env.NEXT_PUBLIC_ENABLE_SENTRY === '1') {
    Sentry.setContext('api_request', context);
  }
};

