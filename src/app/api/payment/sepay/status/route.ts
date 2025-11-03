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

    console.log('🔍 Payment status query received:', {
      orderId,
      amount: amountStr,
      userId: userIdParam,
      timestamp: new Date().toISOString(),
    });

    if (!orderId) {
      console.error('❌ Missing orderId parameter');
      return NextResponse.json(
        { message: 'Order ID is required', success: false },
        { status: 400 },
      );
    }

    // Parse expected amount for better transaction matching
    const expectedAmount = amountStr ? parseInt(amountStr, 10) : undefined;

    console.log('📡 Querying payment status from Sepay gateway...');
    // Query payment status from SePay
    const statusResponse = await sepayGateway.queryPaymentStatus(orderId, expectedAmount);

    const latency = Date.now() - startTime;

    console.log('📊 Payment status response:', {
      latency: `${latency}ms`,
      message: statusResponse.message,
      orderId: statusResponse.orderId,
      success: statusResponse.success,
      transactionId: statusResponse.transactionId,
    });

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

      console.log('✅ Payment found successfully:', {
        latency: `${latency}ms`,
        orderId,
        transactionId: statusResponse.transactionId,
      });

      return NextResponse.json({
        message: statusResponse.message,
        orderId: statusResponse.orderId,
        status: 'success',
        success: true,
        transactionId: statusResponse.transactionId,
      });
    } else {
      console.log('⏳ Payment not found or still pending:', {
        latency: `${latency}ms`,
        orderId,
        message: statusResponse.message,
      });

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
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('❌ Payment status query error:', {
      error: errorMessage,
      latency: `${latency}ms`,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    paymentMetricsCollector.recordError(
      'payment_status_query_error',
      errorMessage,
    );

    return NextResponse.json(
      {
        error: errorMessage,
        message: 'Failed to query payment status',
        status: 'failed',
        success: false
      },
      { status: 500 },
    );
  }
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Origin': '*',
    },
    status: 200,
  });
}
