import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { PAYMENT_CONFIG } from '@/config/customizations';
import { getPaymentByOrderId } from '@/server/services/billing/sepay';

const manualVerificationEnabled =
  process.env.MANUAL_PAYMENT_VERIFY_ENABLED === 'true' ||
  process.env.NEXT_PUBLIC_ENABLE_MANUAL_PAYMENT_VERIFY === 'true';

const getPlanName = (planId: string): string => {
  const planNames: Record<string, string> = {
    premium: 'Premium Plan',
    starter: 'Starter Plan',
    ultimate: 'Ultimate Plan',
  };

  return planNames[planId] || 'Subscription Plan';
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized', success: false }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { message: 'Order ID is required', success: false },
        { status: 400 },
      );
    }

    const payment = await getPaymentByOrderId(orderId);

    if (!payment) {
      return NextResponse.json(
        { message: 'Payment record not found', success: false },
        { status: 404 },
      );
    }

    if (payment.userId !== userId) {
      return NextResponse.json(
        { message: 'Payment does not belong to authenticated user', success: false },
        { status: 403 },
      );
    }

    const bankAccount = PAYMENT_CONFIG.sepay.bankAccount;
    const bankName = PAYMENT_CONFIG.sepay.bankName;

    if (!bankAccount || !bankName) {
      console.error('Bank account information not configured for Sepay payment flow.');
      return NextResponse.json(
        { message: 'Payment configuration incomplete', success: false },
        { status: 500 },
      );
    }

    const description = `pho.chat ${getPlanName(payment.planId)} - ${payment.billingCycle} billing`;

    const qrParams = new URLSearchParams({
      acc: bankAccount,
      amount: payment.amountVnd.toString(),
      bank: bankName,
      des: `${description} - ${payment.orderId}`,
    });

    const qrCodeUrl = `https://qr.sepay.vn/img?${qrParams.toString()}`;

    return NextResponse.json({
      amount: payment.amountVnd,
      bankAccount,
      bankName,
      billingCycle: payment.billingCycle,
      currency: payment.currency,
      manualVerificationEnabled,
      message: 'Payment session details loaded',
      orderId: payment.orderId,
      planId: payment.planId,
      qrCodeUrl,
      status: payment.status,
      success: true,
      transactionId: payment.transactionId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('Failed to load Sepay order details:', {
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: errorMessage,
        message: 'Failed to load payment session details',
        success: false,
      },
      { status: 500 },
    );
  }
}
