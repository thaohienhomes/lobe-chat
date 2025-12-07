import { and, eq } from 'drizzle-orm';

import { sepayPayments, subscriptions } from '@/database/schemas';
import { getServerDB } from '@/database/server';

export type CreatePaymentRecordParams = {
  amountVnd: number;
  billingCycle: 'monthly' | 'yearly';
  currency: string;
  orderId: string;
  planId: string;
  userId: string;
};

export async function createPaymentRecord(params: CreatePaymentRecordParams) {
  try {
    const db = await getServerDB();
    await db.insert(sepayPayments).values({
      amountVnd: params.amountVnd,
      billingCycle: params.billingCycle,
      currency: params.currency,
      orderId: params.orderId,
      planId: params.planId,
      status: 'pending',
      userId: params.userId,
    });
    console.log('✅ Payment record created successfully:', {
      orderId: params.orderId,
      userId: params.userId,
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('❌ Failed to create payment record:', {
      error: errorMessage,
      orderId: params.orderId,
      timestamp: new Date().toISOString(),
      userId: params.userId,
    });
    // Re-throw to allow caller to handle
    throw new Error(`Failed to create payment record: ${errorMessage}`);
  }
}

export async function updatePaymentStatus(
  orderId: string,
  status: 'success' | 'failed' | 'pending',
  opts?: { maskedCardNumber?: string; rawWebhook?: any; transactionId?: string },
) {
  try {
    const db = await getServerDB();
    await db
      .update(sepayPayments)
      .set({
        // maskedCardNumber: opts?.maskedCardNumber, // TODO: Add after migration 0037
        rawWebhook: opts?.rawWebhook,
        status,
        transactionId: opts?.transactionId,
      })
      .where(eq(sepayPayments.orderId, orderId));
    console.log('✅ Payment status updated successfully:', {
      orderId,
      status,
      transactionId: opts?.transactionId,
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('❌ Failed to update payment status:', {
      error: errorMessage,
      orderId,
      status,
      timestamp: new Date().toISOString(),
    });
    // Re-throw to allow caller to handle
    throw new Error(`Failed to update payment status: ${errorMessage}`);
  }
}

export async function activateUserSubscription(params: {
  billingCycle: 'monthly' | 'yearly';
  /** If true, this is an upgrade payment - preserve existing period dates */
  isUpgrade?: boolean;
  planId: string;
  userId: string;
}) {
  try {
    const db = await getServerDB();

    // Upsert behavior: if user already has a subscription, update it; else insert
    const existing = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, params.userId)));

    if (params.isUpgrade && existing.length > 0) {
      // UPGRADE: Preserve existing period dates, only update plan
      const existingSubscription = existing[0];
      console.log('🔄 Processing upgrade - preserving existing period:', {
        currentPeriodEnd: existingSubscription.currentPeriodEnd,
        currentPeriodStart: existingSubscription.currentPeriodStart,
        newPlanId: params.planId,
        oldPlanId: existingSubscription.planId,
      });

      await db
        .update(subscriptions)
        .set({
          billingCycle: params.billingCycle,
          currentPeriodEnd: existingSubscription.currentPeriodEnd,
          currentPeriodStart: existingSubscription.currentPeriodStart,
          paymentProvider: 'sepay',
          planId: params.planId,
          status: 'active',
        })
        .where(eq(subscriptions.userId, params.userId));
      console.log('✅ Subscription upgraded successfully:', {
        billingCycle: params.billingCycle,
        currentPeriodEnd: existingSubscription.currentPeriodEnd.toISOString(),
        planId: params.planId,
        userId: params.userId,
      });
    } else {
      // NEW SUBSCRIPTION or RENEWAL: Create new billing period
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + (params.billingCycle === 'yearly' ? 365 : 30));

      if (existing.length > 0) {
        await db
          .update(subscriptions)
          .set({
            billingCycle: params.billingCycle,
            currentPeriodEnd: end,
            currentPeriodStart: start,
            paymentProvider: 'sepay',
            planId: params.planId,
            status: 'active',
          })
          .where(eq(subscriptions.userId, params.userId));
        console.log('✅ Subscription renewed successfully:', {
          billingCycle: params.billingCycle,
          currentPeriodEnd: end.toISOString(),
          planId: params.planId,
          userId: params.userId,
        });
      } else {
        await db.insert(subscriptions).values({
          billingCycle: params.billingCycle,
          currentPeriodEnd: end,
          currentPeriodStart: start,
          planId: params.planId,
          status: 'active',
          userId: params.userId,
        });
        console.log('✅ Subscription created successfully:', {
          billingCycle: params.billingCycle,
          currentPeriodEnd: end.toISOString(),
          planId: params.planId,
          userId: params.userId,
        });
      }
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('❌ Failed to activate subscription:', {
      error: errorMessage,
      planId: params.planId,
      timestamp: new Date().toISOString(),
      userId: params.userId,
    });
    // Re-throw to allow caller to handle
    throw new Error(`Failed to activate subscription: ${errorMessage}`);
  }
}

export async function getPaymentByOrderId(orderId: string) {
  try {
    const db = await getServerDB();
    const rows = await db
      .select()
      .from(sepayPayments)
      .where(eq(sepayPayments.orderId, orderId))
      .limit(1);
    if (rows.length > 0) {
      console.log('✅ Payment record retrieved successfully:', {
        orderId,
        status: rows[0].status,
      });
    } else {
      console.warn('⚠️ Payment record not found:', { orderId });
    }
    return rows[0];
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('❌ Failed to retrieve payment record:', {
      error: errorMessage,
      orderId,
      timestamp: new Date().toISOString(),
    });
    return undefined;
  }
}
