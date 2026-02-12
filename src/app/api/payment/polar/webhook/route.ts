import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getServerDB } from '@/database/server';

/**
 * Allocate Phở Points for lifetime members
 */
async function allocateLifetimePoints(db: any, userId: string, planId: string) {
  try {
    const schemas: any = await import('@lobechat/database/schemas');
    const { phoPointsBalances } = schemas;

    // Dynamic import config to avoid circular deps if needed, though type import is safe
    const { USD_PRICING_TIERS } = await import('@/server/modules/CostOptimization');

    const tierConfig = USD_PRICING_TIERS[planId as keyof typeof USD_PRICING_TIERS];
    const points = tierConfig?.monthlyPoints || 2_000_000;

    // Check if balance exists
    const [existing] = await db
      .select()
      .from(phoPointsBalances)
      .where(eq(phoPointsBalances.userId, userId))
      .limit(1);

    if (existing) {
      // Update existing balance
      await db
        .update(phoPointsBalances)
        .set({
          balance: points,
          lastResetAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(phoPointsBalances.userId, userId));
    } else {
      // Create new balance
      await db.insert(phoPointsBalances).values({
        balance: points,
        createdAt: new Date(),
        lastResetAt: new Date(),
        updatedAt: new Date(),
        userId,
      });
    }

    console.log(`✅ Allocated ${points.toLocaleString()} Phở Points to user ${userId}`);
  } catch (error) {
    console.error('❌ Failed to allocate points:', error);
    // Don't throw - subscription is already created
  }
}

export async function POST(req: Request) {
  try {
    const { serverAnalytics } = await import('@/libs/analytics');
    const body = await req.text();
    const event = JSON.parse(body);

    console.log('📥 Polar Webhook Event:', {
      email: event.data?.customer_email,
      productId: event.data?.product_id,
      type: event.type,
    });

    // Handle successful payment
    if (event.type === 'checkout.completed' || event.type === 'order.created') {
      const { customer_email, product_id } = event.data;

      if (!customer_email) {
        console.error('❌ No customer email in webhook data');
        return NextResponse.json({ error: 'No customer email' }, { status: 400 });
      }

      // Map Product ID → Plan ID
      let planId = 'lifetime_last_call'; // Default
      switch (product_id) {
        case '85158f39-dd9d-4ed9-b344-9afa5eba5080': {
          planId = 'lifetime_early_bird';
          break;
        }
        case '01faa30d-bfb7-4699-8916-4288591d3fa6': {
          planId = 'lifetime_standard';
          break;
        }
        case '646af452-89ad-439b-9109-8840320e2485': {
          planId = 'lifetime_last_call';
          break;
        }
      }

      const db: any = await getServerDB();
      const schemas: any = await import('@lobechat/database/schemas');
      const { users, subscriptions } = schemas;

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, customer_email)).limit(1);

      if (!user) {
        console.error('❌ User not found:', customer_email);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Create/Update subscription
      const start = new Date();
      const end = new Date('2099-12-31'); // Lifetime

      // Check if subscription exists
      const [existing] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, user.id))
        .limit(1);

      if (existing) {
        // Update existing subscription
        await db
          .update(subscriptions)
          .set({
            billingCycle: 'lifetime',
            cancelAtPeriodEnd: false,
            currentPeriodEnd: end,
            currentPeriodStart: start,
            paymentProvider: 'polar',
            planId,
            status: 'active',
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.userId, user.id));
      } else {
        // Create new subscription
        await db.insert(subscriptions).values({
          billingCycle: 'lifetime',
          cancelAtPeriodEnd: false,
          currentPeriodEnd: end,
          currentPeriodStart: start,
          paymentProvider: 'polar',
          planId,
          status: 'active',
          userId: user.id,
        });
      }

      // Allocate Phở Points
      await allocateLifetimePoints(db, user.id, planId);

      // Sync wallet tier based on plan
      try {
        const { syncWalletTier } = await import('@/libs/wallet/tierSync');
        await syncWalletTier(db, user.id, planId);
      } catch (walletError) {
        console.error('⚠️ Failed to sync wallet tier (non-critical):', walletError);
      }

      console.log('✅ User activated:', {
        email: customer_email,
        planId,
        productId: product_id,
        userId: user.id,
      });

      // PostHog Revenue Tracking - Source of Truth
      // Polar sends amounts in cents (e.g. 2900 = $29.00) if using USD
      // We assume USD for now based on Polar context
      const amountUSD = (event.data.amount || 0) / 100;

      serverAnalytics.track({
        name: 'payment_succeeded',
        properties: {
          $currency: event.data.currency || 'USD',
          $revenue: amountUSD, // Special PostHog property for Revenue charts
          billing_period: 'lifetime',
          payment_provider: 'polar',
          plan_id: planId,
          product_id: product_id,
        },
        userId: user.id,
      });

      serverAnalytics.track({
        name: 'subscription_created',
        properties: {
          plan_id: planId,
          status: 'active',
          type: 'lifetime',
        },
        userId: user.id,
      });

      // Send welcome email (non-blocking — failures don't affect webhook)
      try {
        const { sendWelcomeEmail } = await import('@/libs/email');
        await sendWelcomeEmail({
          email: customer_email,
          name: user.fullName || user.firstName || customer_email.split('@')[0] || 'there',
          planId,
        });
      } catch (emailError) {
        console.error('⚠️ Welcome email failed (non-critical):', emailError);
      }

      return NextResponse.json({ planId, success: true, userId: user.id });
    }

    // Handle refund
    if (event.type === 'order.refunded') {
      const { customer_email } = event.data;

      if (!customer_email) {
        return NextResponse.json({ error: 'No customer email' }, { status: 400 });
      }

      const db: any = await getServerDB();
      const schemas: any = await import('@lobechat/database/schemas');
      const { users, subscriptions } = schemas;

      const [user] = await db.select().from(users).where(eq(users.email, customer_email)).limit(1);

      if (user) {
        // Revoke subscription
        await db
          .update(subscriptions)
          .set({
            planId: 'gl_starter', // Downgrade to free
            status: 'canceled',
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.userId, user.id));

        // Sync wallet tier to free
        try {
          const { syncWalletTier } = await import('@/libs/wallet/tierSync');
          await syncWalletTier(db, user.id, 'gl_starter');
        } catch (walletError) {
          console.error('⚠️ Failed to sync wallet tier on refund:', walletError);
        }

        console.log('⚠️ User plan revoked due to refund:', customer_email);
      }

      return NextResponse.json({ success: true });
    }

    // Other events - just acknowledge
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        error: 'Webhook processing failed',
      },
      { status: 500 },
    );
  }
}
