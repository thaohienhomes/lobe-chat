import { NextResponse } from 'next/server';

import { createCheckoutSession } from '@/libs/polar';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const email = searchParams.get('email');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Create Polar checkout session
    const checkoutSession = await createCheckoutSession({
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3010'}/lifetime`,
      customerEmail: email,
      metadata: {
        planType: 'lifetime',
      },
      productId,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3010'}/lifetime/success`,
    });

    // Redirect to Polar checkout
    return NextResponse.redirect(checkoutSession.url);
  } catch (error) {
    console.error('❌ Checkout creation failed:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
