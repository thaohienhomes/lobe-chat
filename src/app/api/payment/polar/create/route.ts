/**
 * Polar.sh Checkout Creation API
 * 
 * POST /api/payment/polar/create
 * 
 * Creates a Polar checkout session for international payments
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createCheckoutSession, getPolarProductIds } from '@/libs/polar';

// Request validation schema
const CreateCheckoutSchema = z.object({
  billingCycle: z.enum(['monthly', 'yearly']),
  cancelUrl: z.string().url().optional(),
  planId: z.enum(['starter', 'premium', 'ultimate']),
  successUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await req.json();
    const validation = CreateCheckoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { details: validation.error.errors, error: 'Invalid request' },
        { status: 400 }
      );
    }

    const { planId, billingCycle, successUrl, cancelUrl } = validation.data;

    // 3. Get Polar product and price IDs
    const { productId, priceId } = getPolarProductIds(planId, billingCycle);

    // 4. Get base URL for redirect URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pho.chat';

    // 5. Create checkout session
    const session = await createCheckoutSession({
      cancelUrl: cancelUrl || `${baseUrl}/settings/subscription?canceled=true`,
      metadata: {
        billingCycle,
        planId,
        source: 'pho.chat',
        userId,
      },
      priceId,
      productId,
      successUrl: successUrl || `${baseUrl}/settings/subscription?success=true`,
    });

    // 6. Return checkout URL
    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      success: true,
    });

  } catch (error) {
    console.error('Polar checkout creation error:', error);

    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
    },
    status: 200,
  });
}

