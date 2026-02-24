import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getServerDB } from '@/database/server';
import { users, sepayPayments, supportTickets } from '@/database/schemas';

/**
 * Unified endpoint for Vapi.ai / Retell AI Tool Calling.
 * Handles: get_user_context, sync_subscription, create_ticket
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Vapi sends tool calls in message.toolCalls or similar structure
        // We'll support a generic structure: { functionName: string, arguments: object }
        // Or Vapi's specific: { message: { toolCalls: [ { function: { name, arguments } } ] } }

        const toolCall = body.message?.toolCalls?.[0] || body;
        const functionName = toolCall.function?.name || body.functionName;
        const args = toolCall.function?.arguments || body.arguments || {};

        console.log(`[Voice API] Tool Call: ${functionName}`, args);

        const db = await getServerDB();

        if (functionName === 'get_user_context') {
            const { userId } = args;
            if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

            const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            if (!user) return NextResponse.json({ result: 'User not found' });

            // Fetch last 3 payments to see if any are stuck
            const lastPayments = await db
                .select()
                .from(sepayPayments)
                .where(eq(sepayPayments.userId, userId))
                .orderBy(desc(sepayPayments.createdAt))
                .limit(3);

            return NextResponse.json({
                result: {
                    context: `User is on ${user.currentPlanId} plan. Status is ${user.subscriptionStatus}. ` +
                        (lastPayments.some(p => p.status === 'pending') ? 'WARNING: There is a pending payment that might be stuck.' : ''),
                    recentPayments: lastPayments.map(p => ({
                        amount: p.amountVnd,
                        date: p.createdAt,
                        id: p.orderId,
                        status: p.status,
                    })),
                    user: {
                        email: user.email,
                        id: user.id,
                        name: user.fullName,
                        plan: user.currentPlanId,
                        points: user.phoPointsBalance,
                        status: user.subscriptionStatus,
                    }
                }
            });
        }

        if (functionName === 'sync_subscription') {
            const { userId } = args;
            if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

            const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            if (!user) return NextResponse.json({ result: 'User not found in DB' });

            const now = new Date();
            const pointsResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            // Same logic as Telegram Bot: Upgrade to medical_beta and set ACTIVE
            await db.update(users)
                .set({
                    currentPlanId: 'medical_beta',
                    phoPointsBalance: Math.max(user.phoPointsBalance || 0, 500_000),
                    pointsResetDate: pointsResetDate,
                    subscriptionStatus: 'ACTIVE'
                })
                .where(eq(users.id, userId));

            return NextResponse.json({
                result: `Successfully synced subscription for ${user.email}. Plan set to medical_beta, status set to ACTIVE, and points topped up to 500k.`
            });
        }

        if (functionName === 'create_ticket') {
            const { userId, subject, description, transcript, priority = 'medium' } = args;

            const [ticket] = await db.insert(supportTickets).values({
                description: description || 'User requested escalation or human assistance during voice call.',
                priority,
                source: 'voice',
                status: 'open',
                subject: subject || 'Unresolved Voice Support Call',
                transcript,
                userId
            }).returning();

            return NextResponse.json({
                result: `Ticket created successfully with ID: ${ticket.id}. A human admin will review this shortly.`
            });
        }

        return NextResponse.json({ error: `Unknown function: ${functionName}` }, { status: 400 });

    } catch (error) {
        console.error('[Voice API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
