import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

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
      return NextResponse.json({ message: 'Unauthorized', success: false }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, transactionId, amount, description } = body;

    if (!orderId) {
      return NextResponse.json({ 
        message: 'Order ID is required', 
        success: false 
      }, { status: 400 });
    }

    console.log('🔍 Manual payment verification requested:', {
      orderId,
      transactionId: transactionId || 'MANUAL_VERIFICATION',
      amount,
      description,
      userId,
    });

    // Check if payment record exists
    const payment = await getPaymentByOrderId(orderId);
    if (!payment) {
      return NextResponse.json({ 
        message: 'Payment record not found', 
        success: false 
      }, { status: 404 });
    }

    // Verify the payment belongs to the authenticated user
    if (payment.userId !== userId) {
      return NextResponse.json({ 
        message: 'Payment does not belong to authenticated user', 
        success: false 
      }, { status: 403 });
    }

    // Update payment status to success
    await updatePaymentStatus(orderId, 'success', {
      transactionId: transactionId || `MANUAL_${Date.now()}`,
      manualVerification: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: userId,
      rawWebhook: {
        orderId,
        transactionId: transactionId || `MANUAL_${Date.now()}`,
        amount: amount || payment.amount,
        currency: 'VND',
        status: 'success',
        timestamp: new Date().toISOString(),
        signature: 'MANUAL_VERIFICATION',
        description: description || 'Manual payment verification',
      },
    });

    // Activate user subscription
    if (payment.planId && payment.billingCycle) {
      await activateUserSubscription({
        billingCycle: payment.billingCycle as 'monthly' | 'yearly',
        planId: payment.planId,
        userId: payment.userId,
      });

      console.log('✅ Subscription activated for user:', userId);
    }

    console.log('✅ Payment manually verified and processed:', orderId);

    return NextResponse.json({ 
      message: 'Payment successfully verified and subscription activated', 
      success: true,
      orderId,
      transactionId: transactionId || `MANUAL_${Date.now()}`,
    });

  } catch (error) {
    console.error('❌ Manual payment verification error:', error);
    return NextResponse.json(
      { 
        message: 'Failed to verify payment', 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 },
    );
  }
}
