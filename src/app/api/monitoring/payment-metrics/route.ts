/**
 * Payment Metrics Monitoring Endpoint
 * Exposes payment system metrics for monitoring dashboards
 * 
 * GET /api/monitoring/payment-metrics - Get current metrics snapshot
 * GET /api/monitoring/payment-metrics/health - Get health status
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { paymentMetricsCollector } from '@/libs/monitoring/payment-metrics';
import { pino } from '@/libs/logger';

/**
 * GET /api/monitoring/payment-metrics
 * Returns current payment metrics snapshot
 */
export async function GET(request: NextRequest) {
  try {
    // Check if this is a health check endpoint
    const url = new URL(request.url);
    const isHealthCheck = url.searchParams.get('health') === 'true';

    // Verify authentication (admin only)
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check when admin system is implemented
    // For now, any authenticated user can access metrics

    if (isHealthCheck) {
      const health = paymentMetricsCollector.checkHealthStatus();

      pino.info(
        {
          alerts: health.alerts.length,
          healthy: health.healthy,
          warnings: health.warnings.length,
        },
        'Payment system health check',
      );

      return NextResponse.json(
        {
          alerts: health.alerts,
          healthy: health.healthy,
          timestamp: Date.now(),
          warnings: health.warnings,
        },
        {
          status: health.healthy ? 200 : 503,
        },
      );
    }

    // Return metrics snapshot
    const snapshot = paymentMetricsCollector.getMetricsSnapshot();

    pino.info(
      {
        errorRate: snapshot.errorRate,
        paymentDetectionLatency: snapshot.paymentDetectionLatency,
        webhookSuccessRate: snapshot.webhookSuccessRate,
      },
      'Payment metrics snapshot retrieved',
    );

    return NextResponse.json(snapshot);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    pino.error(
      {
        error: errorMessage,
      },
      'Failed to retrieve payment metrics',
    );

    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}

