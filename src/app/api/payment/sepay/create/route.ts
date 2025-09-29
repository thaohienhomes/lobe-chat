import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { SepayPaymentGateway, sepayGateway } from '@/libs/sepay';
import { createPaymentRecord } from '@/server/services/billing/sepay';

export interface CreatePaymentRequest {
  amount: number;
  billingCycle: 'monthly' | 'yearly';
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
}

/**
 * Create Sepay payment for subscription
 * POST /api/payment/sepay/create
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreatePaymentResponse>> {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized', success: false }, { status: 401 });
    }

    // Parse request body
    const body: CreatePaymentRequest = await request.json();
    const { planId, billingCycle, amount, currency, customerInfo } = body;

    // Validate required fields
    if (!planId || !billingCycle || !amount || !currency) {
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

    // Generate unique order ID
    const orderId = SepayPaymentGateway.generateOrderId('PHO_SUB');

    // Create payment description
    const planNames = {
      premium: 'Premium Plan',
      starter: 'Starter Plan',
      ultimate: 'Ultimate Plan',
    };
    const planName = planNames[planId as keyof typeof planNames] || 'Subscription Plan';
    const description = `pho.chat ${planName} - ${billingCycle} billing`;

    // Create payment request
    const paymentRequest = {
      amount,
      currency,
      customerEmail: customerInfo?.email,
      customerName: customerInfo?.name,
      customerPhone: customerInfo?.phone,
      description,
      orderId,
    };

    // Call Sepay API
    const paymentResponse = await sepayGateway.createPayment(paymentRequest);

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

      return NextResponse.json({
        message: 'Payment created successfully',
        orderId: paymentResponse.orderId,
        paymentUrl: paymentResponse.paymentUrl,
        success: true,
      });
    } else {
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
    console.error('Sepay payment creation error:', error);
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

/**
 * Query payment status
 * GET /api/payment/sepay/create?orderId=xxx
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized', success: false }, { status: 401 });
    }

    // Get order ID from query params
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { message: 'Order ID is required', success: false },
        { status: 400 },
      );
    }

    // Query payment status
    const statusResponse = await sepayGateway.queryPaymentStatus(orderId);

    return NextResponse.json(statusResponse);
  } catch (error) {
    console.error('Sepay payment query error:', error);
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
