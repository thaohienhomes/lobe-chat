import { NextRequest, NextResponse } from 'next/server';

import { sepayGateway } from '@/libs/sepay';

/**
 * Query payment status from SePay
 * GET /api/payment/sepay/status?orderId=xxx&amount=xxx
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const amountStr = searchParams.get('amount');

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

    if (statusResponse.success) {
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
