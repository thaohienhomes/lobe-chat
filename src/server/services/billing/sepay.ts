import { and, eq } from 'drizzle-orm';

import { getServerDB } from '@/database/core/db-adaptor';
import { sepayPayments, subscriptions } from '@/database/schemas';

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
  } catch (e) {
    console.warn('[sepay] Skipping DB insertion (likely DB not configured):', e);
  }
}

export async function updatePaymentStatus(
  orderId: string,
  status: 'success' | 'failed' | 'pending',
  opts?: { rawWebhook?: any; transactionId?: string; maskedCardNumber?: string },
) {
  try {
    const db = await getServerDB();
    await db
      .update(sepayPayments)
      .set({
        maskedCardNumber: opts?.maskedCardNumber,
        rawWebhook: opts?.rawWebhook,
        status,
        transactionId: opts?.transactionId,
      })
      .where(eq(sepayPayments.orderId, orderId));
  } catch (e) {
    console.warn('[sepay] Skipping DB update (likely DB not configured):', e);
  }
}

export async function activateUserSubscription(params: {
  billingCycle: 'monthly' | 'yearly';
  planId: string;
  userId: string;
}) {
  try {
    const db = await getServerDB();
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + (params.billingCycle === 'yearly' ? 365 : 30));

    // Upsert behavior: if user already has a subscription, update it; else insert
    const existing = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, params.userId)));

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
    } else {
      await db.insert(subscriptions).values({
        billingCycle: params.billingCycle,
        currentPeriodEnd: end,
        currentPeriodStart: start,
        planId: params.planId,
        status: 'active',
        userId: params.userId,
      });
    }
  } catch (e) {
    console.warn('[sepay] Skipping subscription upsert (likely DB not configured):', e);
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
    return rows[0];
  } catch (e) {
    console.warn('[sepay] Skipping DB select (likely DB not configured):', e);
    return undefined;
  }
}
