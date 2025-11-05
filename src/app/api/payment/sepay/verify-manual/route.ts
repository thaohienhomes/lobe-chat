import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import {
  activateUserSubscription,
  getPaymentByOrderId,
  updatePaymentStatus,
} from '@/server/services/billing/sepay';

/**
 * Manual payment verification endpoint
 * POST /api/payment/sepay/verify-manual
 *
 * This endpoint allows manual verification of payments when webhooks fail
 * or when payments are made directly to the bank account
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      console.error('❌ Unauthorized manual verification attempt');
      return NextResponse.json({ message: 'Unauthorized', success: false }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, transactionId, amount, description } = body;

    console.log('🔍 Manual payment verification requested:', {
      amount,
      description,
      orderId,
      timestamp: new Date().toISOString(),
      transactionId: transactionId || 'MANUAL_VERIFICATION',
      userId,
    });

    if (!orderId) {
      console.error('❌ Missing orderId in manual verification request');
      return NextResponse.json(
        {
          message: 'Order ID is required',
          success: false,
        },
        { status: 400 },
      );
    }

    // Check if payment record exists
    console.log('🔍 Fetching payment record for orderId:', orderId);
    const payment = await getPaymentByOrderId(orderId);
    if (!payment) {
      console.error('❌ Payment record not found for orderId:', orderId);
      return NextResponse.json(
        {
          message: 'Payment record not found',
          success: false,
        },
        { status: 404 },
      );
    }

    // Verify the payment belongs to the authenticated user
    if (payment.userId !== userId) {
      console.error('❌ Payment does not belong to authenticated user:', {
        authenticatedUserId: userId,
        paymentUserId: payment.userId,
      });
      return NextResponse.json(
        {
          message: 'Payment does not belong to authenticated user',
          success: false,
        },
        { status: 403 },
      );
    }

    // Update payment status to success
    console.log('📝 Updating payment status to success...');
    const manualTransactionId = transactionId || `MANUAL_${Date.now()}`;
    await updatePaymentStatus(orderId, 'success', {
      rawWebhook: {
        amount: amount || payment.amountVnd,
        currency: 'VND',
        description: description || 'Manual payment verification',
        orderId,
        signature: 'MANUAL_VERIFICATION',
        status: 'success',
        timestamp: new Date().toISOString(),
        transactionId: manualTransactionId,
      },
      transactionId: manualTransactionId,
    });
    console.log('✅ Payment status updated successfully');

    // Activate user subscription
    if (payment.planId && payment.billingCycle) {
      console.log('🎯 Activating subscription for user:', {
        billingCycle: payment.billingCycle,
        planId: payment.planId,
        userId: payment.userId,
      });

      await activateUserSubscription({
        billingCycle: payment.billingCycle as 'monthly' | 'yearly',
        planId: payment.planId,
        userId: payment.userId,
      });

      console.log('✅ Subscription activated successfully for user:', userId);
    } else {
      console.error('❌ Cannot activate subscription - missing plan info:', {
        hasBillingCycle: !!payment.billingCycle,
        hasPlanId: !!payment.planId,
      });
    }

    console.log('✅ Payment manually verified and processed:', {
      orderId,
      timestamp: new Date().toISOString(),
      transactionId: manualTransactionId,
    });

    return NextResponse.json({
      message: 'Payment successfully verified and subscription activated',
      orderId,
      success: true,
      transactionId: manualTransactionId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('❌ Manual payment verification error:', {
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: errorMessage,
        message: 'Failed to verify payment',
        success: false,
      },
      { status: 500 },
    );
  }
}
