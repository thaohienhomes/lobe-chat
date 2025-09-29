import { NextRequest, NextResponse } from 'next/server';

import { SepayWebhookData, sepayGateway } from '@/libs/sepay';
import {
  activateUserSubscription,
  getPaymentByOrderId,
  updatePaymentStatus,
} from '@/server/services/billing/sepay';

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(webhookData: SepayWebhookData): Promise<void> {
  try {
    console.log('Processing successful payment:', webhookData.orderId);

    // Update payment record status and attach webhook payload
    await updatePaymentStatus(webhookData.orderId, 'success', {
      rawWebhook: webhookData,
      transactionId: webhookData.transactionId,
    });

    // Fetch the original payment record to determine userId/plan/billingCycle
    const payment = await getPaymentByOrderId(webhookData.orderId);
    if (payment?.userId && payment?.planId && payment?.billingCycle) {
      await activateUserSubscription({
        billingCycle: payment.billingCycle as 'monthly' | 'yearly',
        planId: payment.planId,
        userId: payment.userId,
      });
    } else {
      console.warn(
        '[sepay] Payment record not found or incomplete; subscription activation skipped',
      );
    }

    console.log('Successfully processed payment:', webhookData.orderId);
  } catch (error) {
    console.error('Error processing successful payment:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handleFailedPayment(webhookData: SepayWebhookData): Promise<void> {
  try {
    console.log('Processing failed payment:', webhookData.orderId);

    await updatePaymentStatus(webhookData.orderId, 'failed', {
      rawWebhook: webhookData,
      transactionId: webhookData.transactionId,
    });

    console.log('Successfully processed failed payment:', webhookData.orderId);
  } catch (error) {
    console.error('Error processing failed payment:', error);
    throw error;
  }
}

/**
 * Handle pending payment
 */
async function handlePendingPayment(webhookData: SepayWebhookData): Promise<void> {
  try {
    console.log('Processing pending payment:', webhookData.orderId);

    await updatePaymentStatus(webhookData.orderId, 'pending', {
      rawWebhook: webhookData,
      transactionId: webhookData.transactionId,
    });

    console.log('Successfully processed pending payment:', webhookData.orderId);
  } catch (error) {
    console.error('Error processing pending payment:', error);
    throw error;
  }
}

/**
 * Sepay webhook handler for payment notifications
 * POST /api/payment/sepay/webhook
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse webhook data
    const webhookData: SepayWebhookData = await request.json();

    console.log('Sepay webhook received:', {
      amount: webhookData.amount,
      orderId: webhookData.orderId,
      status: webhookData.status,
      transactionId: webhookData.transactionId,
    });

    // Verify webhook signature
    const isValidSignature = sepayGateway.verifyWebhookSignature(webhookData);

    if (!isValidSignature) {
      console.error('Invalid webhook signature:', webhookData.orderId);
      return NextResponse.json({ message: 'Invalid signature', success: false }, { status: 400 });
    }

    // Process payment based on status
    switch (webhookData.status) {
      case 'success': {
        await handleSuccessfulPayment(webhookData);
        break;
      }
      case 'failed': {
        await handleFailedPayment(webhookData);
        break;
      }
      case 'pending': {
        await handlePendingPayment(webhookData);
        break;
      }
      default: {
        console.warn('Unknown payment status:', webhookData.status);
      }
    }

    // Return success response to Sepay
    return NextResponse.json({ message: 'Webhook processed', success: true });
  } catch (error) {
    console.error('Sepay webhook processing error:', error);
    return NextResponse.json(
      { message: 'Webhook processing failed', success: false },
      { status: 500 },
    );
  }
}
