import { NextRequest, NextResponse } from 'next/server';

import { SepayWebhookData, sepayGateway } from '@/libs/sepay';
import {
  activateUserSubscription,
  getPaymentByOrderId,
  updatePaymentStatus,
} from '@/server/services/billing/sepay';

/**
 * GET endpoint to test webhook accessibility
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Sepay webhook endpoint is accessible',
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Extract masked card number from webhook data
 */
function extractMaskedCardNumber(webhookData: SepayWebhookData): string | undefined {
  // If payment method is credit card, extract masked card from webhook
  if (webhookData.paymentMethod === 'credit_card' && webhookData.maskedCardNumber) {
    return webhookData.maskedCardNumber;
  }
  return undefined;
}

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(webhookData: SepayWebhookData): Promise<void> {
  try {
    console.log('Processing successful payment:', webhookData.orderId);

    // Update payment record status and attach webhook payload
    await updatePaymentStatus(webhookData.orderId, 'success', {
      maskedCardNumber: extractMaskedCardNumber(webhookData),
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
 * Sepay webhook handler and manual payment verification endpoint
 * POST /api/payment/sepay/webhook
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔔 Webhook received from:', request.headers.get('user-agent'));
    console.log('🔔 Request headers:', Object.fromEntries(request.headers.entries()));

    const body = await request.json();
    console.log('🔔 Webhook payload:', body);

    // Check if this is a manual verification request
    if (body.action === 'manual_verify') {
      const { orderId, transactionId, amount } = body;

      console.log('🔍 Manual payment verification requested:', {
        amount,
        orderId,
        transactionId,
      });

      // Process as successful payment
      const webhookData: SepayWebhookData = {
        amount: parseFloat(amount),
        currency: 'VND',
        orderId,
        signature: 'MANUAL_VERIFICATION',
        status: 'success',
        timestamp: new Date().toISOString(),
        transactionId: transactionId || `MANUAL_${Date.now()}`, // Skip signature verification for manual
      };

      await handleSuccessfulPayment(webhookData);

      return NextResponse.json({
        message: 'Payment manually verified and processed',
        success: true
      });
    }

    // Parse webhook data from Sepay
    const webhookData: SepayWebhookData = await request.json();

    console.log('Sepay webhook received:', {
      amount: webhookData.amount,
      orderId: webhookData.orderId,
      status: webhookData.status,
      transactionId: webhookData.transactionId,
    });

    // Verify webhook signature (skip for manual verification)
    if (webhookData.signature !== 'MANUAL_VERIFICATION') {
      const isValidSignature = sepayGateway.verifyWebhookSignature(webhookData);

      if (!isValidSignature) {
        console.error('Invalid webhook signature:', webhookData.orderId);
        return NextResponse.json({ message: 'Invalid signature', success: false }, { status: 400 });
      }
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
