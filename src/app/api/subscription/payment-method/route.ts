/**
 * Payment Method Preference Management Endpoint
 * Handles saving and retrieving user's preferred payment method
 * 
 * GET /api/subscription/payment-method - Get current payment preference
 * POST /api/subscription/payment-method - Save/update payment preference
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getServerDB } from '@/database/server';
import { subscriptions } from '@/database/schemas/billing';
import { eq, and } from 'drizzle-orm';
import { pino } from '@/libs/logger';

/**
 * Request body for updating payment method preference
 */
interface UpdatePaymentMethodRequest {
  autoRenewalEnabled?: boolean;
  paymentMethod: 'bank_transfer' | 'credit_card';
  paymentTokenId?: string; // Polar.sh payment method token (for credit card with auto-renewal)
}

/**
 * Response for payment method operations
 */
interface PaymentMethodResponse {
  data?: {
    autoRenewalEnabled: boolean;
    lastPaymentMethodUpdate: string | null;
    preferredPaymentMethod: string | null;
  };
  error?: string;
  message?: string;
  success: boolean;
}

/**
 * GET /api/subscription/payment-method
 * Retrieve current payment method preference
 */
export async function GET(): Promise<NextResponse<PaymentMethodResponse>> {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 },
      );
    }

    // Get database instance
    const db = await getServerDB();

    // Get current active subscription
    const currentSubscription = await db
      .select({
        autoRenewalEnabled: subscriptions.autoRenewalEnabled,
        lastPaymentMethodUpdate: subscriptions.lastPaymentMethodUpdate,
        preferredPaymentMethod: subscriptions.preferredPaymentMethod,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
        ),
      )
      .limit(1);

    if (!currentSubscription || currentSubscription.length === 0) {
      return NextResponse.json(
        {
          error: 'No active subscription found',
          success: false,
        },
        { status: 404 },
      );
    }

    const subscription = currentSubscription[0];

    pino.info(
      {
        autoRenewalEnabled: subscription.autoRenewalEnabled,
        preferredPaymentMethod: subscription.preferredPaymentMethod,
        userId,
      },
      'Payment method preference retrieved',
    );

    return NextResponse.json({
      data: {
        autoRenewalEnabled: subscription.autoRenewalEnabled || false,
        lastPaymentMethodUpdate: subscription.lastPaymentMethodUpdate?.toISOString() || null,
        preferredPaymentMethod: subscription.preferredPaymentMethod,
      },
      success: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    pino.error(
      {
        error: errorMessage,
      },
      'Failed to retrieve payment method preference',
    );

    return NextResponse.json(
      {
        error: 'Failed to retrieve payment method preference',
        message: errorMessage,
        success: false,
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/subscription/payment-method
 * Save or update payment method preference
 */
export async function POST(request: NextRequest): Promise<NextResponse<PaymentMethodResponse>> {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 },
      );
    }

    // Parse request body
    const body: UpdatePaymentMethodRequest = await request.json();
    const { paymentMethod, autoRenewalEnabled, paymentTokenId } = body;

    // Validate required fields
    if (!paymentMethod) {
      return NextResponse.json(
        {
          error: 'Missing required field: paymentMethod',
          success: false,
        },
        { status: 400 },
      );
    }

    // Validate payment method value
    if (!['bank_transfer', 'credit_card'].includes(paymentMethod)) {
      return NextResponse.json(
        {
          error: 'Invalid payment method. Must be "bank_transfer" or "credit_card"',
          success: false,
        },
        { status: 400 },
      );
    }

    // Validate auto-renewal logic
    if (paymentMethod === 'bank_transfer' && autoRenewalEnabled) {
      return NextResponse.json(
        {
          error: 'Auto-renewal is not supported for bank transfer payments',
          success: false,
        },
        { status: 400 },
      );
    }

    // Validate payment token for auto-renewal
    if (paymentMethod === 'credit_card' && autoRenewalEnabled && !paymentTokenId) {
      return NextResponse.json(
        {
          error: 'Payment token is required for credit card auto-renewal',
          success: false,
        },
        { status: 400 },
      );
    }

    // Get database instance
    const db = await getServerDB();

    // Check if user has active subscription
    const currentSubscription = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
        ),
      )
      .limit(1);

    if (!currentSubscription || currentSubscription.length === 0) {
      return NextResponse.json(
        {
          error: 'No active subscription found',
          success: false,
        },
        { status: 404 },
      );
    }

    const subscription = currentSubscription[0];

    // Update payment method preference
    const updateData: {
      autoRenewalEnabled: boolean;
      lastPaymentMethodUpdate: Date;
      paymentTokenId?: string | null;
      preferredPaymentMethod: string;
      updatedAt: Date;
    } = {
      autoRenewalEnabled: autoRenewalEnabled || false,
      lastPaymentMethodUpdate: new Date(),
      preferredPaymentMethod: paymentMethod,
      updatedAt: new Date(),
    };

    // Only update payment token if provided
    if (paymentMethod === 'credit_card' && paymentTokenId) {
      updateData.paymentTokenId = paymentTokenId;
    } else if (paymentMethod === 'bank_transfer') {
      // Clear payment token for bank transfer
      updateData.paymentTokenId = null;
    }

    await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.id, subscription.id));

    pino.info(
      {
        autoRenewalEnabled: autoRenewalEnabled || false,
        paymentMethod,
        subscriptionId: subscription.id,
        userId,
      },
      'Payment method preference updated successfully',
    );

    return NextResponse.json({
      data: {
        autoRenewalEnabled: autoRenewalEnabled || false,
        lastPaymentMethodUpdate: new Date().toISOString(),
        preferredPaymentMethod: paymentMethod,
      },
      message: 'Payment method preference updated successfully',
      success: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    pino.error(
      {
        error: errorMessage,
      },
      'Failed to update payment method preference',
    );

    return NextResponse.json(
      {
        error: 'Failed to update payment method preference',
        message: errorMessage,
        success: false,
      },
      { status: 500 },
    );
  }
}

