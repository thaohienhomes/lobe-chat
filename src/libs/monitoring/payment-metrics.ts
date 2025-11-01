/**
 * Payment System Monitoring Metrics
 * Tracks webhook success rates, payment detection latency, error rates, and database performance
 */

import { pino } from '@/libs/logger';

export interface PaymentMetric {
  timestamp: number;
  type: 'webhook' | 'payment_detection' | 'error' | 'database';
  status: 'success' | 'failure' | 'timeout';
  duration?: number; // milliseconds
  orderId?: string;
  userId?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface MetricsSnapshot {
  webhookSuccessRate: number; // percentage
  paymentDetectionLatency: number; // milliseconds (average)
  errorRate: number; // percentage
  totalWebhooks: number;
  successfulWebhooks: number;
  failedWebhooks: number;
  totalPaymentDetections: number;
  averageDetectionTime: number;
  totalErrors: number;
  timestamp: number;
}

class PaymentMetricsCollector {
  private metrics: PaymentMetric[] = [];
  private readonly maxMetricsSize = 10000; // Keep last 10k metrics in memory
  private readonly metricsWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Record a payment metric
   */
  recordMetric(metric: PaymentMetric): void {
    this.metrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now(),
    });

    // Keep metrics within size limit
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }

    // Log metric for external monitoring systems
    this.logMetricToExternalSystem(metric);
  }

  /**
   * Record webhook processing
   */
  recordWebhookProcessing(
    orderId: string,
    status: 'success' | 'failure',
    duration: number,
    errorMessage?: string,
  ): void {
    this.recordMetric({
      type: 'webhook',
      status,
      duration,
      orderId,
      errorMessage,
      timestamp: Date.now(),
    });

    pino.info(
      {
        type: 'webhook_processing',
        orderId,
        status,
        duration,
        errorMessage,
      },
      `Webhook processing: ${status}`,
    );
  }

  /**
   * Record payment detection latency
   */
  recordPaymentDetection(
    orderId: string,
    userId: string,
    latency: number,
    status: 'success' | 'timeout',
  ): void {
    this.recordMetric({
      type: 'payment_detection',
      status,
      duration: latency,
      orderId,
      userId,
      timestamp: Date.now(),
    });

    pino.info(
      {
        type: 'payment_detection',
        orderId,
        userId,
        latency,
        status,
      },
      `Payment detection: ${status} (${latency}ms)`,
    );
  }

  /**
   * Record error
   */
  recordError(
    type: string,
    errorMessage: string,
    orderId?: string,
    userId?: string,
    metadata?: Record<string, any>,
  ): void {
    this.recordMetric({
      type: 'error',
      status: 'failure',
      errorMessage,
      orderId,
      userId,
      metadata,
      timestamp: Date.now(),
    });

    pino.error(
      {
        type,
        errorMessage,
        orderId,
        userId,
        metadata,
      },
      `Payment error: ${type}`,
    );
  }

  /**
   * Record database operation
   */
  recordDatabaseOperation(
    operation: string,
    duration: number,
    status: 'success' | 'failure',
    errorMessage?: string,
  ): void {
    this.recordMetric({
      type: 'database',
      status,
      duration,
      metadata: { operation },
      errorMessage,
      timestamp: Date.now(),
    });

    pino.info(
      {
        type: 'database_operation',
        operation,
        duration,
        status,
        errorMessage,
      },
      `Database operation: ${operation} (${duration}ms)`,
    );
  }

  /**
   * Get metrics snapshot for the last 24 hours
   */
  getMetricsSnapshot(): MetricsSnapshot {
    const now = Date.now();
    const recentMetrics = this.metrics.filter((m) => now - m.timestamp < this.metricsWindow);

    const webhooks = recentMetrics.filter((m) => m.type === 'webhook');
    const successfulWebhooks = webhooks.filter((m) => m.status === 'success').length;
    const failedWebhooks = webhooks.filter((m) => m.status === 'failure').length;

    const paymentDetections = recentMetrics.filter((m) => m.type === 'payment_detection');
    const detectionLatencies = paymentDetections
      .filter((m) => m.duration !== undefined)
      .map((m) => m.duration!);
    const averageDetectionTime =
      detectionLatencies.length > 0
        ? detectionLatencies.reduce((a, b) => a + b, 0) / detectionLatencies.length
        : 0;

    const errors = recentMetrics.filter((m) => m.type === 'error');

    const totalMetrics = recentMetrics.length;
    const totalErrors = errors.length;

    return {
      webhookSuccessRate:
        webhooks.length > 0 ? (successfulWebhooks / webhooks.length) * 100 : 0,
      paymentDetectionLatency: averageDetectionTime,
      errorRate: totalMetrics > 0 ? (totalErrors / totalMetrics) * 100 : 0,
      totalWebhooks: webhooks.length,
      successfulWebhooks,
      failedWebhooks,
      totalPaymentDetections: paymentDetections.length,
      averageDetectionTime,
      totalErrors,
      timestamp: now,
    };
  }

  /**
   * Check if metrics are within acceptable thresholds
   */
  checkHealthStatus(): {
    healthy: boolean;
    warnings: string[];
    alerts: string[];
  } {
    const snapshot = this.getMetricsSnapshot();
    const warnings: string[] = [];
    const alerts: string[] = [];

    // Check webhook success rate (target: >95%)
    if (snapshot.webhookSuccessRate < 95 && snapshot.webhookSuccessRate >= 90) {
      warnings.push(
        `Webhook success rate is ${snapshot.webhookSuccessRate.toFixed(2)}% (target: >95%)`,
      );
    } else if (snapshot.webhookSuccessRate < 90) {
      alerts.push(
        `CRITICAL: Webhook success rate is ${snapshot.webhookSuccessRate.toFixed(2)}% (target: >95%)`,
      );
    }

    // Check payment detection latency (target: <30s)
    if (snapshot.paymentDetectionLatency > 30000 && snapshot.paymentDetectionLatency <= 45000) {
      warnings.push(
        `Payment detection latency is ${(snapshot.paymentDetectionLatency / 1000).toFixed(2)}s (target: <30s)`,
      );
    } else if (snapshot.paymentDetectionLatency > 45000) {
      alerts.push(
        `CRITICAL: Payment detection latency is ${(snapshot.paymentDetectionLatency / 1000).toFixed(2)}s (target: <30s)`,
      );
    }

    // Check error rate (target: <1%)
    if (snapshot.errorRate > 1 && snapshot.errorRate <= 2) {
      warnings.push(`Error rate is ${snapshot.errorRate.toFixed(2)}% (target: <1%)`);
    } else if (snapshot.errorRate > 2) {
      alerts.push(`CRITICAL: Error rate is ${snapshot.errorRate.toFixed(2)}% (target: <1%)`);
    }

    return {
      healthy: alerts.length === 0,
      warnings,
      alerts,
    };
  }

  /**
   * Log metric to external monitoring system (Vercel Analytics, PostHog, etc.)
   */
  private logMetricToExternalSystem(metric: PaymentMetric): void {
    // This can be extended to send metrics to external services like:
    // - Vercel Analytics
    // - PostHog
    // - Custom monitoring endpoint
    // For now, we rely on Pino logging which can be aggregated by Vercel
  }

  /**
   * Clear old metrics (older than 24 hours)
   */
  clearOldMetrics(): void {
    const now = Date.now();
    this.metrics = this.metrics.filter((m) => now - m.timestamp < this.metricsWindow);
  }
}

// Export singleton instance
export const paymentMetricsCollector = new PaymentMetricsCollector();

// Periodically clear old metrics (every hour)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    paymentMetricsCollector.clearOldMetrics();
  }, 60 * 60 * 1000);
}

