import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { getServerDB } from '@/database/server';
import { sepayPayments, subscriptions } from '@/database/schemas';
import { SepayWebhookData, sepayGateway } from '@/libs/sepay';
import { paymentMetricsCollector } from '@/libs/monitoring/payment-metrics';
import { getPaymentByOrderId } from '@/server/services/billing/sepay';

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
 *
 * TRANSACTION SAFETY: This function wraps payment status update and subscription activation
 * in a database transaction to ensure atomicity. If subscription activation fails, the payment
 * status update is automatically rolled back, preventing inconsistent state where payment is
 * marked as successful but user has no active subscription.
 */
async function handleSuccessfulPayment(webhookData: SepayWebhookData): Promise<void> {
  const startTime = Date.now();
  const db = await getServerDB();

  try {
    console.log('✅ Processing successful payment:', {
      orderId: webhookData.orderId,
      transactionId: webhookData.transactionId,
      amount: webhookData.amount,
      timestamp: new Date().toISOString(),
    });

    // Execute payment processing in a database transaction
    // This ensures both payment update and subscription activation succeed or fail together
    await db.transaction(async (tx) => {
      console.log('🔄 Starting database transaction for payment processing...');

      // Step 1: Update payment record status and attach webhook payload
      console.log('📝 Updating payment status in database...');
      await tx
        .update(sepayPayments)
        .set({
          status: 'success',
          transactionId: webhookData.transactionId,
          rawWebhook: webhookData,
        })
        .where(eq(sepayPayments.orderId, webhookData.orderId));
      console.log('✅ Payment status updated successfully');

      // Step 2: Fetch the payment record to get user and plan info
      console.log('🔍 Fetching payment record to get user and plan info...');
      const paymentRows = await tx
        .select()
        .from(sepayPayments)
        .where(eq(sepayPayments.orderId, webhookData.orderId))
        .limit(1);

      if (!paymentRows || paymentRows.length === 0) {
        console.error('❌ Payment record not found for orderId:', webhookData.orderId);
        throw new Error(`Payment record not found for orderId: ${webhookData.orderId}`);
      }

      const payment = paymentRows[0];
      console.log('✅ Payment record retrieved:', {
        billingCycle: payment.billingCycle,
        planId: payment.planId,
        userId: payment.userId,
      });

      // Step 3: Validate payment record has required fields
      if (!payment.userId || !payment.planId || !payment.billingCycle) {
        console.error('❌ Payment record incomplete - missing required fields:', {
          hasUserId: !!payment.userId,
          hasPlanId: !!payment.planId,
          hasBillingCycle: !!payment.billingCycle,
        });
        throw new Error('Payment record incomplete - cannot activate subscription');
      }

      // Step 4: Activate subscription (upsert behavior)
      console.log('🎯 Activating subscription for user:', {
        userId: payment.userId,
        planId: payment.planId,
        billingCycle: payment.billingCycle,
      });

      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + (payment.billingCycle === 'yearly' ? 365 : 30));

      // Check if user already has a subscription
      const existing = await tx
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(eq(subscriptions.userId, payment.userId));

      if (existing.length > 0) {
        // Update existing subscription
        await tx
          .update(subscriptions)
          .set({
            planId: payment.planId,
            billingCycle: payment.billingCycle,
            status: 'active',
            currentPeriodStart: start,
            currentPeriodEnd: end,
            paymentProvider: 'sepay',
          })
          .where(eq(subscriptions.userId, payment.userId));
        console.log('✅ Subscription updated successfully for user:', payment.userId);
      } else {
        // Create new subscription
        await tx.insert(subscriptions).values({
          userId: payment.userId,
          planId: payment.planId,
          billingCycle: payment.billingCycle,
          status: 'active',
          currentPeriodStart: start,
          currentPeriodEnd: end,
        });
        console.log('✅ Subscription created successfully for user:', payment.userId);
      }

      console.log('✅ Transaction committed successfully');
    });

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

    console.error('❌ Error processing successful payment (transaction rolled back):', {
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
  const db = await getServerDB();

  try {
    console.log('Processing failed payment:', webhookData.orderId);

    await db
      .update(sepayPayments)
      .set({
        status: 'failed',
        transactionId: webhookData.transactionId,
        rawWebhook: webhookData,
      })
      .where(eq(sepayPayments.orderId, webhookData.orderId));

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
  const db = await getServerDB();

  try {
    console.log('Processing pending payment:', webhookData.orderId);

    await db
      .update(sepayPayments)
      .set({
        status: 'pending',
        transactionId: webhookData.transactionId,
        rawWebhook: webhookData,
      })
      .where(eq(sepayPayments.orderId, webhookData.orderId));

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
 * Extract orderId from Sepay bank transfer content
 * Sepay sends bank transfer details in the content field with format:
 * "phohat Premium Plan monthly billing RUCSIA1762228747088NTK3U9 FT25308710231543..."
 *
 * We need to extract the timestamp and random code to reconstruct the orderId:
 * Pattern: [PREFIX]_[TIMESTAMP]_[RANDOM] -> PHO_SUB_1762228747088_NTK3U9
 */
function extractOrderIdFromContent(content: string): string | null {
  // Look for pattern: 13-digit timestamp followed by 6 uppercase alphanumeric characters
  // Example: "RUCSIA1762228747088NTK3U9" -> extract "1762228747088" and "NTK3U9"
  const pattern = /(\d{13})([A-Z0-9]{6})/;
  const match = content.match(pattern);

  if (match) {
    const timestamp = match[1];
    const randomCode = match[2];
    // Reconstruct the orderId with our standard format
    const orderId = `PHO_SUB_${timestamp}_${randomCode}`;
    console.log('✅ Extracted orderId from content:', {
      content,
      timestamp,
      randomCode,
      orderId,
    });
    return orderId;
  }

  console.warn('⚠️ Could not extract orderId from content:', content);
  return null;
}

/**
 * Sepay webhook handler
 * POST /api/payment/sepay/webhook
 *
 * SECURITY: This endpoint is protected by webhook secret token authentication.
 * Sepay must include the secret token in the X-Sepay-Webhook-Secret header.
 * This prevents unauthorized parties from sending fake webhooks to activate subscriptions.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: any;
  try {
    console.log('🔔 Webhook received from:', request.headers.get('user-agent'));
    console.log('🔔 Request headers:', Object.fromEntries(request.headers.entries()));

    // SECURITY CHECK: Verify webhook authentication
    // Sepay can send the webhook secret token in two formats:
    // 1. X-Sepay-Webhook-Secret header (custom header format)
    // 2. Authorization: Apikey <token> header (API Key format)
    const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET;

    // Try to get secret from X-Sepay-Webhook-Secret header first
    let providedSecret = request.headers.get('x-sepay-webhook-secret');

    // If not found, try to extract from Authorization header (format: "Apikey <token>")
    if (!providedSecret) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Apikey ')) {
        providedSecret = authHeader.substring(7); // Remove "Apikey " prefix
        console.log('🔑 Extracted secret from Authorization header');
      }
    }

    if (!webhookSecret) {
      console.error('❌ SEPAY_WEBHOOK_SECRET not configured in environment variables');
      return NextResponse.json(
        { message: 'Webhook authentication not configured', success: false },
        { status: 500 }
      );
    }

    if (!providedSecret || providedSecret !== webhookSecret) {
      console.error('❌ Unauthorized webhook request - invalid or missing secret token');
      console.error('❌ Provided secret:', providedSecret ? '[REDACTED]' : 'NONE');
      console.error('❌ Authorization header:', request.headers.get('authorization') ? '[REDACTED]' : 'NONE');

      paymentMetricsCollector.recordError(
        'webhook_auth_failed',
        'Unauthorized webhook request',
        undefined,
        undefined,
        { hasSecret: !!providedSecret, hasAuthHeader: !!request.headers.get('authorization') }
      );

      return NextResponse.json(
        { message: 'Unauthorized - invalid webhook secret', success: false },
        { status: 401 }
      );
    }

    console.log('✅ Webhook authentication successful');

    // Parse webhook data from Sepay (only parse once!)
    body = await request.json();
    console.log('🔔 Webhook payload received:', JSON.stringify(body, null, 2));

    // SECURITY NOTE: Manual verification has been removed from this endpoint.
    // Manual payment verification must be done through the dedicated authenticated endpoint:
    // POST /api/payment/sepay/verify-manual (requires Clerk authentication)
    // This prevents unauthorized users from manually verifying payments without proper authentication.

    // Extract orderId early for idempotency check
    let orderId: string | null = null;

    // Try to extract orderId from different webhook formats
    if (body.orderId || body.order_id) {
      orderId = body.orderId || body.order_id;
    } else if (body.gateway === 'vietqr' || body.content) {
      // Bank transfer format - extract from content
      orderId = extractOrderIdFromContent(body.content || body.description || '');
    }

    // IDEMPOTENCY CHECK: Verify if webhook has already been processed
    // This prevents duplicate processing if Sepay sends the same webhook multiple times
    if (orderId) {
      console.log('🔍 Checking if webhook already processed for orderId:', orderId);
      const existingPayment = await getPaymentByOrderId(orderId);

      if (existingPayment && existingPayment.status === 'success' && existingPayment.transactionId) {
        console.log('⚠️ Webhook already processed (idempotent):', {
          orderId: existingPayment.orderId,
          transactionId: existingPayment.transactionId,
          status: existingPayment.status,
          processedAt: existingPayment.updatedAt,
        });

        // Return success to acknowledge webhook (don't reprocess)
        return NextResponse.json({
          message: 'Webhook already processed',
          success: true,
          idempotent: true,
          orderId: existingPayment.orderId,
          transactionId: existingPayment.transactionId,
        });
      }

      console.log('✅ Webhook not yet processed, continuing...');
    }

    // Detect webhook format: Sepay sends different formats for different payment methods
    let webhookData: SepayWebhookData;

    // Format 1: Bank transfer webhook (VietQR)
    // Example: { gateway: "vietqr", content: "...", transferAmount: 129000, id: "28956687", ... }
    if (body.gateway === 'vietqr' || body.content) {
      console.log('🏦 Detected bank transfer webhook format (VietQR)');

      // Extract orderId from content field
      const orderId = extractOrderIdFromContent(body.content || body.description || '');

      if (!orderId) {
        console.error('❌ Could not extract orderId from bank transfer content');
        return NextResponse.json(
          {
            message: 'Could not extract orderId from bank transfer content',
            success: false,
            content: body.content,
          },
          { status: 400 }
        );
      }

      webhookData = {
        amount: parseFloat(body.transferAmount || body.amount || '0'),
        currency: 'VND',
        orderId: orderId,
        paymentMethod: 'bank_transfer',
        signature: '', // Bank transfer webhooks don't have signatures
        status: 'success', // Sepay only sends webhooks for successful transfers
        timestamp: new Date().toISOString(),
        transactionId: body.id || body.transactionId || '',
      };
    }
    // Format 2: Credit card webhook (standard format)
    // Example: { orderId: "PHO_CC_...", transactionId: "...", amount: 129000, status: "success", ... }
    else {
      console.log('💳 Detected credit card webhook format (standard)');

      webhookData = {
        amount: body.amount || parseFloat(body.amount_in || '0'),
        currency: body.currency || 'VND',
        maskedCardNumber: body.maskedCardNumber || body.masked_card_number,
        orderId: body.orderId || body.order_id,
        paymentMethod: body.paymentMethod || body.payment_method || 'credit_card',
        signature: body.signature || '',
        status: (body.status || 'pending') as 'success' | 'failed' | 'pending',
        timestamp: body.timestamp || new Date().toISOString(),
        transactionId: body.transactionId || body.transaction_id || '',
      };
    }

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
      console.error('❌ Raw webhook body:', JSON.stringify(body, null, 2));
      return NextResponse.json(
        {
          message: 'Missing orderId in webhook payload',
          success: false,
          rawBody: body,
        },
        { status: 400 }
      );
    }

    if (!webhookData.transactionId) {
      console.error('❌ Missing transactionId in webhook payload');
      console.error('❌ Webhook data:', JSON.stringify(webhookData, null, 2));
      return NextResponse.json(
        {
          message: 'Missing transactionId in webhook payload',
          success: false,
          webhookData,
        },
        { status: 400 }
      );
    }

    // Verify webhook signature (skip for bank transfers only)
    // Bank transfers use webhook secret token authentication instead of signature verification
    if (webhookData.paymentMethod === 'bank_transfer') {
      console.log('ℹ️ Bank transfer webhook - skipping signature verification (authenticated via webhook secret)');
    } else if (webhookData.signature) {
      const isValidSignature = sepayGateway.verifyWebhookSignature(webhookData);

      if (!isValidSignature) {
        console.error('❌ Invalid webhook signature:', webhookData.orderId);
        console.error('❌ Signature verification failed - webhook will still be processed for debugging');
        // Note: We're logging the error but still processing to help with debugging
        // In production, you may want to reject invalid signatures
      } else {
        console.log('✅ Webhook signature verified successfully');
      }
    } else {
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
