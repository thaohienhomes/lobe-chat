import { NextRequest, NextResponse } from 'next/server';

import { SepayWebhookData, sepayGateway } from '@/libs/sepay';
import { paymentMetricsCollector } from '@/libs/monitoring/payment-metrics';
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
  const startTime = Date.now();
  try {
    console.log('✅ Processing successful payment:', {
      orderId: webhookData.orderId,
      transactionId: webhookData.transactionId,
      amount: webhookData.amount,
      timestamp: new Date().toISOString(),
    });

    // Update payment record status and attach webhook payload
    console.log('📝 Updating payment status in database...');
    await updatePaymentStatus(webhookData.orderId, 'success', {
      maskedCardNumber: extractMaskedCardNumber(webhookData),
      rawWebhook: webhookData,
      transactionId: webhookData.transactionId,
    });
    console.log('✅ Payment status updated successfully');

    // Fetch the original payment record to determine userId/plan/billingCycle
    console.log('🔍 Fetching payment record to get user and plan info...');
    const payment = await getPaymentByOrderId(webhookData.orderId);

    if (!payment) {
      console.error('❌ Payment record not found for orderId:', webhookData.orderId);
      throw new Error(`Payment record not found for orderId: ${webhookData.orderId}`);
    }

    console.log('✅ Payment record retrieved:', {
      billingCycle: payment.billingCycle,
      planId: payment.planId,
      userId: payment.userId,
    });

    if (payment.userId && payment.planId && payment.billingCycle) {
      console.log('🎯 Activating subscription for user:', {
        userId: payment.userId,
        planId: payment.planId,
        billingCycle: payment.billingCycle,
      });

      await activateUserSubscription({
        billingCycle: payment.billingCycle as 'monthly' | 'yearly',
        planId: payment.planId,
        userId: payment.userId,
      });

      console.log('✅ Subscription activated successfully for user:', payment.userId);
    } else {
      console.error('❌ Payment record incomplete - missing required fields:', {
        hasUserId: !!payment.userId,
        hasPlanId: !!payment.planId,
        hasBillingCycle: !!payment.billingCycle,
      });
      throw new Error('Payment record incomplete - cannot activate subscription');
    }

    const duration = Date.now() - startTime;
    paymentMetricsCollector.recordWebhookProcessing(
      webhookData.orderId,
      'success',
      duration,
    );

    console.log('✅ Successfully processed payment:', {
      duration: `${duration}ms`,
      orderId: webhookData.orderId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('❌ Error processing successful payment:', {
      duration: `${duration}ms`,
      error: errorMessage,
      orderId: webhookData.orderId,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    paymentMetricsCollector.recordWebhookProcessing(
      webhookData.orderId,
      'failure',
      duration,
      errorMessage,
    );
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handleFailedPayment(webhookData: SepayWebhookData): Promise<void> {
  const startTime = Date.now();
  try {
    console.log('Processing failed payment:', webhookData.orderId);

    await updatePaymentStatus(webhookData.orderId, 'failed', {
      rawWebhook: webhookData,
      transactionId: webhookData.transactionId,
    });

    const duration = Date.now() - startTime;
    paymentMetricsCollector.recordWebhookProcessing(
      webhookData.orderId,
      'success',
      duration,
    );

    console.log('Successfully processed failed payment:', webhookData.orderId);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    paymentMetricsCollector.recordWebhookProcessing(
      webhookData.orderId,
      'failure',
      duration,
      errorMessage,
    );
    console.error('Error processing failed payment:', error);
    throw error;
  }
}

/**
 * Handle pending payment
 */
async function handlePendingPayment(webhookData: SepayWebhookData): Promise<void> {
  const startTime = Date.now();
  try {
    console.log('Processing pending payment:', webhookData.orderId);

    await updatePaymentStatus(webhookData.orderId, 'pending', {
      rawWebhook: webhookData,
      transactionId: webhookData.transactionId,
    });

    const duration = Date.now() - startTime;
    paymentMetricsCollector.recordWebhookProcessing(
      webhookData.orderId,
      'success',
      duration,
    );

    console.log('Successfully processed pending payment:', webhookData.orderId);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    paymentMetricsCollector.recordWebhookProcessing(
      webhookData.orderId,
      'failure',
      duration,
      errorMessage,
    );
    console.error('Error processing pending payment:', error);
    throw error;
  }
}

/**
 * Sepay webhook handler and manual payment verification endpoint
 * POST /api/payment/sepay/webhook
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: any;
  try {
    console.log('🔔 Webhook received from:', request.headers.get('user-agent'));
    console.log('🔔 Request headers:', Object.fromEntries(request.headers.entries()));

    // Parse webhook data from Sepay (only parse once!)
    body = await request.json();
    console.log('🔔 Webhook payload received:', JSON.stringify(body, null, 2));

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

    // Normalize webhook data - handle different payload structures from Sepay
    const webhookData: SepayWebhookData = {
      amount: body.amount || parseFloat(body.amount_in || '0'),
      currency: body.currency || 'VND',
      maskedCardNumber: body.maskedCardNumber || body.masked_card_number,
      orderId: body.orderId || body.order_id,
      paymentMethod: body.paymentMethod || body.payment_method,
      signature: body.signature || '',
      status: (body.status || 'pending') as 'success' | 'failed' | 'pending',
      timestamp: body.timestamp || new Date().toISOString(),
      transactionId: body.transactionId || body.transaction_id || '',
    };

    console.log('🔔 Normalized webhook data:', {
      amount: webhookData.amount,
      currency: webhookData.currency,
      orderId: webhookData.orderId,
      paymentMethod: webhookData.paymentMethod,
      status: webhookData.status,
      transactionId: webhookData.transactionId,
    });

    // Validate required fields
    if (!webhookData.orderId) {
      console.error('❌ Missing orderId in webhook payload');
      return NextResponse.json(
        { message: 'Missing orderId in webhook payload', success: false },
        { status: 400 }
      );
    }

    if (!webhookData.transactionId) {
      console.error('❌ Missing transactionId in webhook payload');
      return NextResponse.json(
        { message: 'Missing transactionId in webhook payload', success: false },
        { status: 400 }
      );
    }

    // Verify webhook signature (skip for manual verification)
    if (webhookData.signature !== 'MANUAL_VERIFICATION' && webhookData.signature) {
      const isValidSignature = sepayGateway.verifyWebhookSignature(webhookData);

      if (!isValidSignature) {
        console.error('❌ Invalid webhook signature:', webhookData.orderId);
        console.error('❌ Signature verification failed - webhook will still be processed for debugging');
        // Note: We're logging the error but still processing to help with debugging
        // In production, you may want to reject invalid signatures
      }
    } else if (!webhookData.signature) {
      console.warn('⚠️ No signature provided in webhook - skipping signature verification');
    }

    // Process payment based on status
    switch (webhookData.status) {
      case 'success': {
        console.log('✅ Processing successful payment for orderId:', webhookData.orderId);
        await handleSuccessfulPayment(webhookData);
        break;
      }
      case 'failed': {
        console.log('❌ Processing failed payment for orderId:', webhookData.orderId);
        await handleFailedPayment(webhookData);
        break;
      }
      case 'pending': {
        console.log('⏳ Processing pending payment for orderId:', webhookData.orderId);
        await handlePendingPayment(webhookData);
        break;
      }
      default: {
        console.warn('⚠️ Unknown payment status:', webhookData.status);
      }
    }

    // Return success response to Sepay
    console.log('✅ Webhook processed successfully for orderId:', webhookData.orderId);
    return NextResponse.json({ message: 'Webhook processed', success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('❌ Sepay webhook processing error:', {
      error: errorMessage,
      stack: errorStack,
      body: body ? JSON.stringify(body) : 'No body parsed',
      timestamp: new Date().toISOString(),
    });

    paymentMetricsCollector.recordError(
      'webhook_processing_error',
      errorMessage,
      undefined,
      undefined,
      { error: String(error), stack: errorStack },
    );

    return NextResponse.json(
      { message: 'Webhook processing failed', success: false, error: errorMessage },
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
    },
    status: 200,
  });
}
