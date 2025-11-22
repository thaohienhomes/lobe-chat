import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to verify Sentry is working
 * GET /api/test-sentry - Test Sentry error tracking
 * GET /api/test-sentry?type=message - Test Sentry message tracking
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'error';

  try {
    if (type === 'message') {
      // Test message capture
      Sentry.captureMessage('Test message from pho.chat', 'info');
      return NextResponse.json({
        message: 'Test message sent to Sentry',
        success: true,
      });
    } else if (type === 'exception') {
      // Test exception capture
      throw new Error('Test exception from pho.chat API');
    } else {
      // Default: test error capture
      const testError = new Error('Test error from pho.chat');
      Sentry.captureException(testError);
      return NextResponse.json({
        message: 'Test error sent to Sentry',
        success: true,
      });
    }
  } catch (error) {
    Sentry.captureException(error, {
      contexts: {
        test: {
          endpoint: '/api/test-sentry',
          type,
        },
      },
    });

    return NextResponse.json(
      {
        error: 'Test error captured',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
