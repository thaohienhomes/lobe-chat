import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { sepayPayments, subscriptions, users } from '@/database/schemas';
import { getServerDB } from '@/database/server';

import { addPhoPoints, changeSubscriptionStatus, changeUserPlan } from './actions';

const cardStyle = {
    backdropFilter: 'blur(24px)',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
};

const planColors: Record<string, any> = {
    gl_starter: { bg: 'rgba(161, 161, 170, 0.15)', border: 'rgba(161, 161, 170, 0.2)', text: '#A1A1AA' },
    lifetime_early_bird: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.2)', text: '#FBBF24' },
    lifetime_last_call: { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.2)', text: '#EC4899' },
    lifetime_standard: { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.2)', text: '#FB923C' },
    medical_beta: { bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.2)', text: '#A78BFA' },
    vn_free: { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.08)', text: '#A1A1AA' },
};

const inputStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    color: '#FFFFFF',
    flex: 1,
    fontSize: '14px',
    height: '40px',
    outline: 'none',
    padding: '0 12px',
};

const btnOutline = {
    alignItems: 'center' as const,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    color: '#E2E8F0',
    cursor: 'pointer' as const,
    display: 'inline-flex',
    fontSize: '13px',
    fontWeight: 600 as const,
    height: '40px',
    justifyContent: 'center' as const,
    padding: '0 16px',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
};

const btnPrimary = {
    ...btnOutline,
    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    border: '1px solid rgba(124, 58, 237, 0.5)',
    color: '#FFFFFF',
};

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
    const db = await getServerDB();
    const userId = params.id;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return notFound();

    const userSubs = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(5);

    const userPayments = await db
        .select()
        .from(sepayPayments)
        .where(eq(sepayPayments.userId, userId))
        .orderBy(desc(sepayPayments.createdAt))
        .limit(5);

    const isStatusActive = user.subscriptionStatus === 'ACTIVE';
    const pId = user.currentPlanId || 'unknown';
    const pColors = planColors[pId] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)', text: '#A1A1AA' };

    return (
        <div style={{ color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '32px', margin: '0 auto', maxWidth: '1000px' }}>
            {/* Header */}
            <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
                <Link
                    className="hover:bg-[rgba(255,255,255,0.1)] hover:text-white"
                    href="/admin/users"
                    style={{
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        color: '#A1A1AA',
                        display: 'inline-flex',
                        fontSize: '14px',
                        height: '40px',
                        justifyContent: 'center',
                        padding: '0 16px',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                    }}
                >
                    ← Back
                </Link>
                <div>
                    <h1 style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
                        {user.fullName || 'User Profile'}
                    </h1>
                    <p style={{ color: '#71717A', fontFamily: 'monospace', fontSize: '13px', marginTop: '4px' }}>{user.id}</p>
                </div>
            </div>

            {/* Profile + Actions Grid */}
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
                {/* Profile Card */}
                <div style={cardStyle}>
                    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', padding: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>👤 Profile Details</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
                        {/* Avatar + Email */}
                        <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
                            <div style={{
                                alignItems: 'center', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.3), rgba(124, 58, 237, 0.3))', border: '2px solid rgba(124, 58, 237, 0.4)',
                                borderRadius: '50%',
                                color: '#fff',
                                display: 'flex', fontSize: '24px', fontWeight: 700,
                                height: '56px', justifyContent: 'center', width: '56px',
                            }}>
                                {(user.email || '?')[0].toUpperCase()}
                            </div>
                            <div>
                                <div style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 600 }}>{user.email || 'No Email'}</div>
                                <div style={{ color: '#71717A', fontSize: '13px', marginTop: '2px' }}>
                                    Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                        </div>

                        {/* Key Stats */}
                        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
                                <div style={{ color: '#A1A1AA', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px', textTransform: 'uppercase' }}>Plan</div>
                                <span style={{ background: pColors.bg, border: `1px solid ${pColors.border}`, borderRadius: '8px', color: pColors.text, fontSize: '13px', fontWeight: 600, padding: '4px 10px' }}>
                                    {user.currentPlanId}
                                </span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
                                <div style={{ color: '#A1A1AA', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px', textTransform: 'uppercase' }}>Status</div>
                                <span style={{
                                    alignItems: 'center', background: isStatusActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(161, 161, 170, 0.15)', border: `1px solid ${isStatusActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(161, 161, 170, 0.2)'}`,
                                    borderRadius: '20px', color: isStatusActive ? '#10B981' : '#A1A1AA', display: 'inline-flex', fontSize: '13px',
                                    fontWeight: 600,
                                    gap: '6px',
                                    padding: '4px 10px',
                                }}>
                                    <span style={{ backgroundColor: isStatusActive ? '#10B981' : '#A1A1AA', borderRadius: '50%', height: '6px', width: '6px' }} />
                                    {user.subscriptionStatus}
                                </span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', gridColumn: '1 / -1', padding: '16px' }}>
                                <div style={{ color: '#A1A1AA', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px', textTransform: 'uppercase' }}>Phở Points Balance</div>
                                <div style={{ color: '#A78BFA', fontFamily: 'monospace', fontSize: '28px', fontWeight: 700 }}>
                                    {user.phoPointsBalance?.toLocaleString() || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Super Actions Card */}
                <div style={{ ...cardStyle, border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', padding: '24px', position: 'relative' }}>
                        <div style={{ background: 'linear-gradient(90deg, rgba(124, 58, 237, 1) 0%, transparent 100%)', bottom: 0, left: 0, opacity: 0.08, pointerEvents: 'none', position: 'absolute', right: 0, top: 0 }} />
                        <h3 style={{ color: '#D8B4FE', fontSize: '16px', fontWeight: 600, margin: 0, position: 'relative', zIndex: 1 }}>⚡ Super Actions</h3>
                        <p style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '4px', position: 'relative', zIndex: 1 }}>Quick fixes and administrative overrides</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
                        {/* Top Up Points */}
                        <form action={addPhoPoints.bind(null, userId, 100_000)} style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>Add 100,000 Points</span>
                            <button style={btnPrimary} type="submit">
                                Top-up
                            </button>
                        </form>

                        <div style={{ background: 'rgba(255, 255, 255, 0.06)', height: '1px' }} />

                        {/* Change Status */}
                        <form action={changeSubscriptionStatus.bind(null, userId)} style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
                            <select
                                defaultValue={user.subscriptionStatus || 'FREE'}
                                name="status"
                                style={{ ...inputStyle, appearance: 'none', paddingRight: '32px' } as any}
                            >
                                <option value="FREE">FREE</option>
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="PAST_DUE">PAST_DUE</option>
                                <option value="CANCELLED">CANCELLED</option>
                            </select>
                            <button style={btnOutline} type="submit">
                                Set Status
                            </button>
                        </form>

                        {/* Change Plan */}
                        <form action={changeUserPlan.bind(null, userId)} style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
                            <input
                                defaultValue={user.currentPlanId || 'vn_free'}
                                name="planId"
                                style={inputStyle}
                            />
                            <button style={btnOutline} type="submit">
                                Set Plan
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* History Grid */}
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
                {/* Sepay Payments History */}
                <div style={cardStyle}>
                    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', padding: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>💳 Recent Sepay TXNs</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', width: '100%' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '12px 20px' }}>Order ID</th>
                                    <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '12px 20px' }}>Amount</th>
                                    <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '12px 20px' }}>Status</th>
                                    <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '12px 20px' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userPayments.length === 0 ? (
                                    <tr><td colSpan={4} style={{ color: '#A1A1AA', padding: '24px', textAlign: 'center' }}>No records</td></tr>
                                ) : (
                                    userPayments.map(p => (
                                        <tr className="hover:bg-[rgba(255,255,255,0.02)] transition-colors" key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ color: '#D4D4D8', fontFamily: 'monospace', fontSize: '12px', padding: '12px 20px' }}>{p.orderId}</td>
                                            <td style={{ color: '#FFFFFF', fontWeight: 600, padding: '12px 20px' }}>{p.amountVnd.toLocaleString()} ₫</td>
                                            <td style={{ padding: '12px 20px' }}>
                                                <span style={{
                                                    background: p.status === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(234,179,8,0.15)', border: `1px solid ${p.status === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(234,179,8,0.2)'}`, borderRadius: '12px', color: p.status === 'success' ? '#10B981' : '#EAB308',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    padding: '3px 8px',
                                                }}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td style={{ color: '#A1A1AA', fontSize: '12px', padding: '12px 20px' }}>{p.createdAt?.toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Subscriptions Log */}
                <div style={cardStyle}>
                    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', padding: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>📋 Subscriptions Log</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', width: '100%' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '12px 20px' }}>Plan ID</th>
                                    <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '12px 20px' }}>Cycle</th>
                                    <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '12px 20px' }}>Status</th>
                                    <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '12px 20px' }}>End Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userSubs.length === 0 ? (
                                    <tr><td colSpan={4} style={{ color: '#A1A1AA', padding: '24px', textAlign: 'center' }}>No records</td></tr>
                                ) : (
                                    userSubs.map(s => (
                                        <tr className="hover:bg-[rgba(255,255,255,0.02)] transition-colors" key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ color: '#FFFFFF', fontWeight: 600, padding: '12px 20px' }}>{s.planId}</td>
                                            <td style={{ color: '#A1A1AA', padding: '12px 20px' }}>{s.billingCycle}</td>
                                            <td style={{ padding: '12px 20px' }}>
                                                <span style={{
                                                    background: s.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(161,161,170,0.15)', border: `1px solid ${s.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(161,161,170,0.2)'}`, borderRadius: '12px', color: s.status === 'active' ? '#10B981' : '#A1A1AA',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    padding: '3px 8px',
                                                }}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td style={{ color: '#A1A1AA', fontSize: '12px', padding: '12px 20px' }}>{s.currentPeriodEnd.toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
