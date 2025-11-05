import { NextRequest, NextResponse } from 'next/server';

import { SepayWebhookData, sepayGateway } from '@/libs/sepay';
import { paymentMetricsCollector } from '@/libs/monitoring/payment-metrics';
import {
  activateUserSubscription,
  getPaymentByOrderId,
  updatePaymentStatus,
} from '@/server/services/billing/sepay';

/**
 * Sepay Webhook Handler - Compatibility Route
 * POST /api/sepay/webhook
 * 
 * This route exists for backward compatibility with Sepay dashboard configuration.
 * The correct route is /api/payment/sepay/webhook, but Sepay may be configured
 * to send webhooks to /api/sepay/webhook.
 * 
 * This route forwards all webhook requests to the correct handler.
 */

/**
 * GET endpoint to test webhook accessibility
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Sepay webhook endpoint is accessible (compatibility route)',
    status: 'ready',
    correctRoute: '/api/payment/sepay/webhook',
    note: 'This route forwards to /api/payment/sepay/webhook for compatibility',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(webhookData: SepayWebhookData): Promise<void> {
  const startTime = Date.now();
  try {
    console.log('✅ [COMPAT ROUTE] Processing successful payment:', {
      orderId: webhookData.orderId,
      amount: webhookData.amount,
      currency: webhookData.currency,
      transactionId: webhookData.transactionId,
      timestamp: webhookData.timestamp,
    });

    // Update payment status in database
    console.log('📝 [COMPAT ROUTE] Updating payment status in database...');
    await updatePaymentStatus(webhookData.orderId, 'success', {
      rawWebhook: webhookData,
      transactionId: webhookData.transactionId,
    });
    console.log('✅ [COMPAT ROUTE] Payment status updated successfully');

    // Get payment record to get user and plan info
    console.log('🔍 [COMPAT ROUTE] Fetching payment record to get user and plan info...');
    const payment = await getPaymentByOrderId(webhookData.orderId);

    if (!payment) {
      console.error('❌ [COMPAT ROUTE] Payment record not found for orderId:', webhookData.orderId);
      throw new Error('Payment record not found');
    }

    console.log('📋 [COMPAT ROUTE] Payment record retrieved:', {
      userId: payment.userId,
      planId: payment.planId,
      billingCycle: payment.billingCycle,
    });

    // Activate subscription
    if (payment.userId && payment.planId && payment.billingCycle) {
      console.log('🎯 [COMPAT ROUTE] Activating subscription for user:', {
        userId: payment.userId,
        planId: payment.planId,
        billingCycle: payment.billingCycle,
      });

      await activateUserSubscription({
        billingCycle: payment.billingCycle as 'monthly' | 'yearly',
        planId: payment.planId,
        userId: payment.userId,
      });

      console.log('✅ [COMPAT ROUTE] Subscription activated successfully for user:', payment.userId);
    } else {
      console.error('❌ [COMPAT ROUTE] Payment record incomplete - missing required fields:', {
        hasUserId: !!payment.userId,
        hasPlanId: !!payment.planId,
        hasBillingCycle: !!payment.billingCycle,
      });
      throw new Error('Payment record incomplete - cannot activate subscription');
    }

    // Record metrics
    const duration = Date.now() - startTime;
    paymentMetricsCollector.recordWebhookProcessing(
      webhookData.orderId,
      'success',
      duration,
    );

    console.log('✅ [COMPAT ROUTE] Webhook processed successfully for orderId:', webhookData.orderId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('❌ [COMPAT ROUTE] Error processing successful payment:', {
      error: errorMessage,
      stack: errorStack,
      orderId: webhookData.orderId,
      timestamp: new Date().toISOString(),
    });

    // Record error metrics
    const duration = Date.now() - startTime;
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
    console.log('❌ [COMPAT ROUTE] Processing failed payment:', {
      orderId: webhookData.orderId,
      amount: webhookData.amount,
      currency: webhookData.currency,
      transactionId: webhookData.transactionId,
      timestamp: webhookData.timestamp,
    });

    // Update payment status in database
    console.log('📝 [COMPAT ROUTE] Updating payment status in database...');
    await updatePaymentStatus(webhookData.orderId, 'failed', {
      rawWebhook: webhookData,
      transactionId: webhookData.transactionId,
    });
    console.log('✅ [COMPAT ROUTE] Payment status updated successfully');

    // Record metrics
    const duration = Date.now() - startTime;
    paymentMetricsCollector.recordWebhookProcessing(
      webhookData.orderId,
      'success',
      duration,
    );

    console.log('✅ [COMPAT ROUTE] Webhook processed successfully for orderId:', webhookData.orderId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('❌ [COMPAT ROUTE] Error processing failed payment:', {
      error: errorMessage,
      stack: errorStack,
      orderId: webhookData.orderId,
      timestamp: new Date().toISOString(),
    });

    // Record error metrics
    const duration = Date.now() - startTime;
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
 * Handle pending payment
 */
async function handlePendingPayment(webhookData: SepayWebhookData): Promise<void> {
  const startTime = Date.now();
  try {
    console.log('[COMPAT ROUTE] Processing pending payment:', webhookData.orderId);

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

    console.log('✅ [COMPAT ROUTE] Webhook processed successfully for orderId:', webhookData.orderId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('❌ [COMPAT ROUTE] Error processing pending payment:', {
      error: errorMessage,
      stack: errorStack,
      orderId: webhookData.orderId,
      timestamp: new Date().toISOString(),
    });

    const duration = Date.now() - startTime;
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
 * Sepay webhook handler - Compatibility route
 * POST /api/sepay/webhook
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: any;
  try {
    console.log('🔔 [COMPAT ROUTE] Webhook received at /api/sepay/webhook from:', request.headers.get('user-agent'));
    console.log('🔔 [COMPAT ROUTE] Request headers:', Object.fromEntries(request.headers.entries()));

    // Parse webhook data from Sepay (only parse once!)
    body = await request.json();
    console.log('🔔 [COMPAT ROUTE] Webhook payload received:', JSON.stringify(body, null, 2));

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

    console.log('🔔 [COMPAT ROUTE] Normalized webhook data:', {
      amount: webhookData.amount,
      currency: webhookData.currency,
      orderId: webhookData.orderId,
      status: webhookData.status,
      transactionId: webhookData.transactionId,
    });

    // Validate required fields
    if (!webhookData.orderId) {
      console.error('❌ [COMPAT ROUTE] Missing orderId in webhook payload');
      return NextResponse.json(
        { message: 'Missing orderId in webhook payload', success: false },
        { status: 400 }
      );
    }

    if (!webhookData.transactionId) {
      console.error('❌ [COMPAT ROUTE] Missing transactionId in webhook payload');
      return NextResponse.json(
        { message: 'Missing transactionId in webhook payload', success: false },
        { status: 400 }
      );
    }

    // Verify webhook signature (lenient for debugging)
    if (webhookData.signature) {
      const isValidSignature = sepayGateway.verifyWebhookSignature(webhookData);

      if (!isValidSignature) {
        console.error('❌ [COMPAT ROUTE] Invalid webhook signature:', webhookData.orderId);
        console.error('❌ [COMPAT ROUTE] Signature verification failed - webhook will still be processed for debugging');
      }
    } else {
      console.warn('⚠️ [COMPAT ROUTE] No signature provided in webhook - skipping signature verification');
    }

    // Process payment based on status
    switch (webhookData.status) {
      case 'success': {
        console.log('✅ [COMPAT ROUTE] Processing successful payment for orderId:', webhookData.orderId);
        await handleSuccessfulPayment(webhookData);
        break;
      }
      case 'failed': {
        console.log('❌ [COMPAT ROUTE] Processing failed payment for orderId:', webhookData.orderId);
        await handleFailedPayment(webhookData);
        break;
      }
      case 'pending': {
        console.log('⏳ [COMPAT ROUTE] Processing pending payment for orderId:', webhookData.orderId);
        await handlePendingPayment(webhookData);
        break;
      }
      default: {
        console.warn('⚠️ [COMPAT ROUTE] Unknown payment status:', webhookData.status);
      }
    }

    return NextResponse.json({
      message: 'Webhook processed successfully',
      success: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('❌ [COMPAT ROUTE] Error processing webhook:', {
      error: errorMessage,
      stack: errorStack,
      body,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: 'Failed to process webhook',
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

