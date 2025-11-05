import { NextRequest, NextResponse } from 'next/server';

import { paymentMetricsCollector } from '@/libs/monitoring/payment-metrics';
import { getPaymentByOrderId } from '@/server/services/billing/sepay';

/**
 * Query payment status from database (NOT from Sepay API to avoid rate limiting)
 * GET /api/payment/sepay/status?orderId=xxx&amount=xxx
 *
 * This endpoint checks the database for payment status instead of calling Sepay API.
 * The webhook handler updates the database when payments are completed.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const amountStr = searchParams.get('amount');
    const userIdParam = searchParams.get('userId');

    console.log('🔍 Payment status query received:', {
      amount: amountStr,
      orderId,
      timestamp: new Date().toISOString(),
      userId: userIdParam,
    });

    if (!orderId) {
      console.error('❌ Missing orderId parameter');
      return NextResponse.json(
        { message: 'Order ID is required', success: false },
        { status: 400 },
      );
    }

    console.log('📊 Checking payment status in database (avoiding Sepay API rate limits)...');

    // Query payment status from database instead of Sepay API
    const payment = await getPaymentByOrderId(orderId);

    const latency = Date.now() - startTime;

    if (!payment) {
      console.log('⏳ Payment record not found in database:', {
        latency: `${latency}ms`,
        orderId,
      });

      return NextResponse.json({
        message: 'Payment not found or still pending',
        orderId,
        status: 'pending',
        success: false,
      });
    }

    console.log('📊 Payment status from database:', {
      latency: `${latency}ms`,
      orderId,
      status: payment.status,
      transactionId: payment.transactionId,
    });

    // Check if payment is successful
    if (payment.status === 'success') {
      // Record successful payment detection
      if (userIdParam) {
        paymentMetricsCollector.recordPaymentDetection(
          orderId,
          userIdParam,
          latency,
          'success',
        );
      }

      console.log('✅ Payment completed successfully:', {
        latency: `${latency}ms`,
        orderId,
        transactionId: payment.transactionId,
      });

      return NextResponse.json({
        message: 'Payment completed successfully',
        orderId: payment.orderId,
        status: 'success',
        success: true,
        transactionId: payment.transactionId,
      });
    } else if (payment.status === 'failed') {
      console.log('❌ Payment failed:', {
        latency: `${latency}ms`,
        orderId,
      });

      return NextResponse.json({
        message: 'Payment failed',
        orderId: payment.orderId,
        status: 'failed',
        success: false,
      });
    } else {
      // Status is 'pending'
      console.log('⏳ Payment still pending:', {
        latency: `${latency}ms`,
        orderId,
      });

      return NextResponse.json({
        message: 'Payment is still pending',
        orderId: payment.orderId,
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
