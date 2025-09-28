import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { sepayGateway, SepayPaymentGateway } from '@/libs/sepay';

export interface CreatePaymentRequest {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  customerInfo?: {
    email?: string;
    name?: string;
    phone?: string;
  };
}

export interface CreatePaymentResponse {
  success: boolean;
  paymentUrl?: string;
  orderId?: string;
  message: string;
  error?: string;
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
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreatePaymentRequest = await request.json();
    const { planId, billingCycle, amount, currency, customerInfo } = body;

    // Validate required fields
    if (!planId || !billingCycle || !amount || !currency) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate amount (minimum 1000 VND)
    if (amount < 1000) {
      return NextResponse.json(
        { success: false, message: 'Amount must be at least 1000 VND' },
        { status: 400 }
      );
    }

    // Generate unique order ID
    const orderId = SepayPaymentGateway.generateOrderId('PHO_SUB');

    // Create payment description
    const planNames = {
      starter: 'Starter Plan',
      premium: 'Premium Plan', 
      ultimate: 'Ultimate Plan',
    };
    const planName = planNames[planId as keyof typeof planNames] || 'Subscription Plan';
    const description = `pho.chat ${planName} - ${billingCycle} billing`;

    // Create payment request
    const paymentRequest = {
      orderId,
      amount,
      currency,
      description,
      customerEmail: customerInfo?.email,
      customerName: customerInfo?.name,
      customerPhone: customerInfo?.phone,
    };

    // Call Sepay API
    const paymentResponse = await sepayGateway.createPayment(paymentRequest);

    if (paymentResponse.success) {
      // TODO: Store payment record in database
      // await createPaymentRecord({
      //   orderId,
      //   userId,
      //   planId,
      //   billingCycle,
      //   amount,
      //   currency,
      //   status: 'pending',
      //   paymentMethod: 'sepay',
      // });

      return NextResponse.json({
        success: true,
        paymentUrl: paymentResponse.paymentUrl,
        orderId: paymentResponse.orderId,
        message: 'Payment created successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: paymentResponse.message,
          error: paymentResponse.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Sepay payment creation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
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
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get order ID from query params
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Query payment status
    const statusResponse = await sepayGateway.queryPaymentStatus(orderId);

    return NextResponse.json(statusResponse);
  } catch (error) {
    console.error('Sepay payment query error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
