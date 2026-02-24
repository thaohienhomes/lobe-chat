import { NextResponse } from 'next/server';

import { sepayPayments, users } from '@/database/schemas';
import { getServerDB } from '@/database/server';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'users';

    try {
        const db = await getServerDB();

        if (type === 'users') {
            const allUsers = await db
                .select({
                    createdAt: users.createdAt,
                    currentPlanId: users.currentPlanId,
                    email: users.email,
                    fullName: users.fullName,
                    id: users.id,
                    phoPointsBalance: users.phoPointsBalance,
                    subscriptionStatus: users.subscriptionStatus,
                })
                .from(users)
                .limit(5000);

            const header = 'ID,Email,Full Name,Plan,Status,Phở Points,Created At';
            const rows = allUsers.map(u =>
                [
                    u.id,
                    u.email || '',
                    `"${(u.fullName || '').replaceAll('"', '""')}"`,
                    u.currentPlanId || '',
                    u.subscriptionStatus || '',
                    u.phoPointsBalance || 0,
                    u.createdAt ? new Date(u.createdAt).toISOString() : '',
                ].join(',')
            );

            const csv = [header, ...rows].join('\n');
            return new NextResponse(csv, {
                headers: {
                    'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`,
                    'Content-Type': 'text/csv; charset=utf-8',
                },
            });
        }

        if (type === 'transactions') {
            const txns = await db
                .select({
                    amountVnd: sepayPayments.amountVnd,
                    createdAt: sepayPayments.createdAt,
                    orderId: sepayPayments.orderId,
                    status: sepayPayments.status,
                    userId: sepayPayments.userId,
                })
                .from(sepayPayments)
                .limit(10_000);

            const header = 'Order ID,User ID,Amount (VND),Status,Created At';
            const rows = txns.map(t =>
                [
                    t.orderId,
                    t.userId || '',
                    t.amountVnd,
                    t.status || '',
                    t.createdAt ? new Date(t.createdAt).toISOString() : '',
                ].join(',')
            );

            const csv = [header, ...rows].join('\n');
            return new NextResponse(csv, {
                headers: {
                    'Content-Disposition': `attachment; filename="transactions_export_${new Date().toISOString().split('T')[0]}.csv"`,
                    'Content-Type': 'text/csv; charset=utf-8',
                },
            });
        }

        return NextResponse.json({ error: 'Invalid type. Use ?type=users or ?type=transactions' }, { status: 400 });
    } catch (error) {
        console.error('CSV Export Error:', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
