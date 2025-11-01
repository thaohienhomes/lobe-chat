import { NextRequest, NextResponse } from 'next/server';

import { sepayGateway } from '@/libs/sepay';
import { paymentMetricsCollector } from '@/libs/monitoring/payment-metrics';

/**
 * Query payment status from SePay
 * GET /api/payment/sepay/status?orderId=xxx&amount=xxx
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const amountStr = searchParams.get('amount');
    const userIdParam = searchParams.get('userId');

    if (!orderId) {
      return NextResponse.json(
        { message: 'Order ID is required', success: false },
        { status: 400 },
      );
    }

    // Parse expected amount for better transaction matching
    const expectedAmount = amountStr ? parseInt(amountStr, 10) : undefined;

    // Query payment status from SePay
    const statusResponse = await sepayGateway.queryPaymentStatus(orderId, expectedAmount);

    const latency = Date.now() - startTime;

    if (statusResponse.success) {
      // Record successful payment detection
      if (userIdParam) {
        paymentMetricsCollector.recordPaymentDetection(
          orderId,
          userIdParam,
          latency,
          'success',
        );
      }

      return NextResponse.json({
        message: statusResponse.message,
        orderId: statusResponse.orderId,
        status: 'success',
        success: true,
        transactionId: statusResponse.transactionId,
      });
    } else {
      return NextResponse.json({
        message: statusResponse.message || 'Payment not found or still pending',
        orderId,
        status: 'pending',
        success: false,
      });
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    paymentMetricsCollector.recordError(
      'payment_status_query_error',
      errorMessage,
    );
    console.error('Payment status query error:', error);
    return NextResponse.json(
      {
        message: 'Failed to query payment status',
        status: 'failed',
        success: false
      },
      { status: 500 },
    );
  }
}
