import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { CreditCardPaymentRequest, SepayPaymentGateway, sepayGateway } from '@/libs/sepay';
import { createPaymentRecord } from '@/server/services/billing/sepay';
import { checkPaymentRateLimit } from '@/middleware/rate-limit';

export interface CreateCreditCardPaymentRequest {
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  cardCvv: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardHolderName: string;
  cardNumber: string;
  currency: string;
  customerInfo?: {
    email?: string;
    name?: string;
    phone?: string;
  };
  planId: string;
}

export interface CreatePaymentResponse {
  error?: string;
  message: string;
  orderId?: string;
  paymentUrl?: string;
  success: boolean;
  transactionId?: string;
}

/**
 * Create Sepay credit card payment for subscription
 * POST /api/payment/sepay/create-credit-card
 *
 * This endpoint handles credit card payments through Sepay.
 * Card data is validated on the client side and never stored on the server.
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreatePaymentResponse>> {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized', success: false }, { status: 401 });
    }

    // Check rate limits (per-IP and per-user)
    const rateLimitResult = await checkPaymentRateLimit(request, userId);
    if (!rateLimitResult.allowed) {
      console.warn('💳 Rate limit exceeded:', {
        reason: rateLimitResult.reason,
        resetTime: rateLimitResult.resetTime,
        userId,
      });

      return NextResponse.json(
        {
          message: rateLimitResult.reason || 'Too many payment attempts. Please try again later.',
          success: false,
        },
        {
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000)),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
          },
          status: 429,
        },
      );
    }

    // Parse request body
    const body: CreateCreditCardPaymentRequest = await request.json();
    const {
      planId,
      billingCycle,
      amount,
      currency,
      cardNumber,
      cardCvv,
      cardExpiryMonth,
      cardExpiryYear,
      cardHolderName,
      customerInfo,
    } = body;

    // Validate required fields
    if (
      !planId ||
      !billingCycle ||
      !amount ||
      !currency ||
      !cardNumber ||
      !cardCvv ||
      !cardExpiryMonth ||
      !cardExpiryYear ||
      !cardHolderName
    ) {
      return NextResponse.json(
        { message: 'Missing required fields', success: false },
        { status: 400 },
      );
    }

    // Validate amount (minimum 1000 VND)
    if (amount < 1000) {
      return NextResponse.json(
        { message: 'Amount must be at least 1000 VND', success: false },
        { status: 400 },
      );
    }

    // Generate unique order ID with credit card prefix
    const orderId = SepayPaymentGateway.generateOrderId('PHO_CC');

    // Create payment description
    const planNames: Record<string, string> = {
      premium: 'Premium Plan',
      starter: 'Starter Plan',
      ultimate: 'Ultimate Plan',
    };
    const planName = planNames[planId] || 'Subscription Plan';
    const description = `pho.chat ${planName} - ${billingCycle} billing`;

    console.log('💳 Processing credit card payment:', {
      amount,
      billingCycle,
      orderId,
      planId,
      userId,
    });

    // Create credit card payment request
    const paymentRequest: CreditCardPaymentRequest = {
      amount,
      cardCvv,
      cardExpiryMonth,
      cardExpiryYear,
      cardHolderName,
      cardNumber,
      currency,
      customerEmail: customerInfo?.email,
      customerName: customerInfo?.name,
      customerPhone: customerInfo?.phone,
      description,
      orderId,
    };

    // Call Sepay API to process credit card payment
    const paymentResponse = await sepayGateway.createCreditCardPayment(paymentRequest);

    if (paymentResponse.success) {
      // Persist payment record (best-effort)
      await createPaymentRecord({
        amountVnd: amount,
        billingCycle,
        currency,
        orderId,
        planId,
        userId,
      });

      console.log('✅ Credit card payment created successfully:', {
        orderId,
        transactionId: paymentResponse.transactionId,
      });

      return NextResponse.json({
        message: 'Credit card payment created successfully',
        orderId: paymentResponse.orderId,
        paymentUrl: paymentResponse.paymentUrl,
        success: true,
        transactionId: paymentResponse.transactionId,
      });
    } else {
      console.warn('❌ Credit card payment failed:', {
        error: paymentResponse.error,
        orderId,
      });

      return NextResponse.json(
        {
          error: paymentResponse.error,
          message: paymentResponse.message,
          success: false,
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('❌ Sepay credit card payment creation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Internal server error',
        success: false,
      },
      { status: 500 },
    );
  }
}

