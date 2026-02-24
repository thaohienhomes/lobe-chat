import { and, eq, lte, ne, desc, lt } from 'drizzle-orm';
import Link from 'next/link';

import { sepayPayments, users } from '@/database/schemas';
import { getServerDB } from '@/database/server';

const cardStyle = {
    backdropFilter: 'blur(24px)',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
    position: 'relative' as const,
};

const headerGlow = (color: string) => ({
    background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`,
    bottom: 0,
    left: 0,
    opacity: 0.1,
    pointerEvents: 'none' as const,
    position: 'absolute' as const,
    right: 0,
    top: 0,
});

export default async function AdminHealthPage() {
    const db = await getServerDB();

    // 1. Detect Desync: Users on paid plans but stuck with 'FREE' status.
    const subscriptionAnomalies = await db
        .select()
        .from(users)
        .where(
            and(
                ne(users.currentPlanId, 'vn_free'),
                ne(users.currentPlanId, 'gl_starter'),
                eq(users.subscriptionStatus, 'FREE')
            )
        );

    // 2. Negative Balance Anomalies
    const negativePointsAnomalies = await db
        .select()
        .from(users)
        .where(lt(users.phoPointsBalance, 0));

    // 3. Stuck Pending Payments (Older than 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const stuckPayments = await db
        .select()
        .from(sepayPayments)
        .where(
            and(
                eq(sepayPayments.status, 'pending'),
                lte(sepayPayments.createdAt, twoHoursAgo)
            )
        )
        .orderBy(desc(sepayPayments.createdAt))
        .limit(20);

    return (
        <div style={{ color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '32px', margin: '0 auto', maxWidth: '1000px' }}>
            <div>
                <h1 style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
                    Anomaly Radar
                </h1>
                <p style={{ color: '#A1A1AA', fontSize: '15px', marginTop: '8px' }}>
                    Agentic AI scanner looking for database desyncs and billing issues automatically.
                </p>
            </div>

            {/* Subscription Desync Anomalies */}
            <div style={{ ...cardStyle, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', padding: '24px', position: 'relative' }}>
                    <div style={headerGlow('rgba(239, 68, 68, 1)')} />
                    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                        <h3 style={{ color: '#FCA5A5', fontSize: '18px', fontWeight: 600, margin: 0 }}>🚨 Subscription Sync Failures</h3>
                        <span style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#FCA5A5', fontFamily: 'monospace', fontSize: '13px', padding: '4px 12px' }}>
                            {subscriptionAnomalies.length} found
                        </span>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left', width: '100%' }}>
                        <thead style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Identity</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Corrupted State</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px', textAlign: 'right' }}>Resolution</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptionAnomalies.length === 0 ? (
                                <tr>
                                    <td colSpan={3} style={{ color: '#10B981', fontWeight: 500, padding: '32px', textAlign: 'center' }}>
                                        ✅ System stable. No synchronization anomalies detected.
                                    </td>
                                </tr>
                            ) : (
                                subscriptionAnomalies.map(user => (
                                    <tr className="hover:bg-[rgba(255,255,255,0.02)] transition-colors" key={user.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ color: '#FFFFFF', fontWeight: 600 }}>{user.email}</div>
                                            <div style={{ color: '#71717A', fontFamily: 'monospace', fontSize: '12px' }}>{user.id}</div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', color: '#FCA5A5', fontSize: '13px', fontWeight: 600, padding: '4px 8px' }}>
                                                {user.currentPlanId} → FREE
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <Link
                                                className="hover:bg-red-500/20"
                                                href={`/admin/users/${user.id}`}
                                                style={{
                                                    alignItems: 'center',
                                                    background: 'rgba(239, 68, 68, 0.15)',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    borderRadius: '8px',
                                                    color: '#FCA5A5',
                                                    display: 'inline-flex',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    height: '32px',
                                                    justifyContent: 'center',
                                                    padding: '0 16px',
                                                    textDecoration: 'none',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                Fix Manually
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stuck Payments */}
            <div style={{ ...cardStyle, border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', padding: '24px', position: 'relative' }}>
                    <div style={headerGlow('rgba(234, 179, 8, 1)')} />
                    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                        <h3 style={{ color: '#FDE047', fontSize: '18px', fontWeight: 600, margin: 0 }}>⏳ Stalled Payments (&gt;2hrs)</h3>
                        <span style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '6px', color: '#FDE047', fontFamily: 'monospace', fontSize: '13px', padding: '4px 12px' }}>
                            {stuckPayments.length} found
                        </span>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left', width: '100%' }}>
                        <thead style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Order ID</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Amount</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Timeline</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stuckPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={3} style={{ color: '#10B981', fontWeight: 500, padding: '32px', textAlign: 'center' }}>
                                        ✅ All pending payments are resolving normally.
                                    </td>
                                </tr>
                            ) : (
                                stuckPayments.map(tx => (
                                    <tr className="hover:bg-[rgba(255,255,255,0.02)] transition-colors" key={tx.orderId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                        <td style={{ color: '#FFFFFF', fontFamily: 'monospace', padding: '16px 24px' }}>{tx.orderId}</td>
                                        <td style={{ color: '#FDE047', fontWeight: 600, padding: '16px 24px' }}>
                                            {tx.amountVnd.toLocaleString('vi-VN')} ₫
                                        </td>
                                        <td style={{ color: '#A1A1AA', fontSize: '13px', padding: '16px 24px' }}>
                                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Negative Points */}
            <div style={{ ...cardStyle, border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', padding: '24px', position: 'relative' }}>
                    <div style={headerGlow('rgba(168, 85, 247, 1)')} />
                    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                        <h3 style={{ color: '#D8B4FE', fontSize: '18px', fontWeight: 600, margin: 0 }}>💸 Negative Balance Detection</h3>
                        <span style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '6px', color: '#D8B4FE', fontFamily: 'monospace', fontSize: '13px', padding: '4px 12px' }}>
                            {negativePointsAnomalies.length} found
                        </span>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left', width: '100%' }}>
                        <thead style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Identity</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Deficit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {negativePointsAnomalies.length === 0 ? (
                                <tr>
                                    <td colSpan={2} style={{ color: '#10B981', fontWeight: 500, padding: '32px', textAlign: 'center' }}>
                                        ✅ No users with negative token balances.
                                    </td>
                                </tr>
                            ) : (
                                negativePointsAnomalies.map(user => (
                                    <tr className="hover:bg-[rgba(255,255,255,0.02)] transition-colors" key={user.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                        <td style={{ padding: '16px 24px' }}>{user.email || user.id}</td>
                                        <td style={{ color: '#D8B4FE', fontFamily: 'monospace', fontWeight: 600, padding: '16px 24px' }}>
                                            {user.phoPointsBalance}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
