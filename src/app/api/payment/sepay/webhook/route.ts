import { NextRequest, NextResponse } from 'next/server';

import { sepayGateway, SepayWebhookData } from '@/libs/sepay';

/**
 * Sepay webhook handler for payment notifications
 * POST /api/payment/sepay/webhook
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse webhook data
    const webhookData: SepayWebhookData = await request.json();
    
    console.log('Sepay webhook received:', {
      orderId: webhookData.orderId,
      transactionId: webhookData.transactionId,
      status: webhookData.status,
      amount: webhookData.amount,
    });

    // Verify webhook signature
    const isValidSignature = sepayGateway.verifyWebhookSignature(webhookData);
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature:', webhookData.orderId);
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Process payment based on status
    switch (webhookData.status) {
      case 'success':
        await handleSuccessfulPayment(webhookData);
        break;
      case 'failed':
        await handleFailedPayment(webhookData);
        break;
      case 'pending':
        await handlePendingPayment(webhookData);
        break;
      default:
        console.warn('Unknown payment status:', webhookData.status);
    }

    // Return success response to Sepay
    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Sepay webhook processing error:', error);
    return NextResponse.json(
      { success: false, message: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(webhookData: SepayWebhookData): Promise<void> {
  try {
    console.log('Processing successful payment:', webhookData.orderId);

    // TODO: Implement database operations
    // 1. Update payment record status to 'completed'
    // 2. Create or update user subscription
    // 3. Send confirmation email
    // 4. Update user's subscription status
    
    // Example implementation:
    // await updatePaymentStatus(webhookData.orderId, 'completed', webhookData.transactionId);
    // await activateUserSubscription(webhookData.orderId);
    // await sendPaymentConfirmationEmail(webhookData.orderId);

    console.log('Payment processed successfully:', webhookData.orderId);
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

    // TODO: Implement database operations
    // 1. Update payment record status to 'failed'
    // 2. Send failure notification email
    // 3. Log failure reason
    
    // Example implementation:
    // await updatePaymentStatus(webhookData.orderId, 'failed', webhookData.transactionId);
    // await sendPaymentFailureEmail(webhookData.orderId);

    console.log('Failed payment processed:', webhookData.orderId);
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

    // TODO: Implement database operations
    // 1. Update payment record status to 'pending'
    // 2. Set up monitoring for status changes
    
    // Example implementation:
    // await updatePaymentStatus(webhookData.orderId, 'pending', webhookData.transactionId);

    console.log('Pending payment processed:', webhookData.orderId);
  } catch (error) {
    console.error('Error processing pending payment:', error);
    throw error;
  }
}

/**
 * Verify webhook authenticity by checking IP whitelist (optional)
 */
function verifyWebhookSource(request: NextRequest): boolean {
  // Sepay webhook IP addresses (example - replace with actual IPs)
  const allowedIPs = [
    '103.74.123.45',  // Example Sepay IP
    '103.74.123.46',  // Example Sepay IP
    // Add actual Sepay webhook IPs here
  ];

  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';

  // In development, allow all IPs
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return allowedIPs.some(ip => clientIP.includes(ip));
}

/**
 * Handle GET requests (for webhook verification)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Some payment gateways require GET endpoint for webhook verification
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ 
    message: 'Sepay webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
