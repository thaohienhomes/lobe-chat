import { and, count, eq, gte, lt, lte, ne, sql } from 'drizzle-orm';
import Link from 'next/link';

import { sepayPayments, supportTickets, users } from '@/database/schemas';
import { getServerDB } from '@/database/server';

import { AutoRefresh } from '@/features/Admin/AutoRefresh';

// Extracted style objects for Premium Glassmorphism
const cardStyle = {
    backdropFilter: 'blur(24px)',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
    padding: '24px',
    position: 'relative' as const,
    transition: 'all 0.3s ease',
};

const hoverGlow = (color: string) => ({
    background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
    height: '100%',
    opacity: 0.15,
    pointerEvents: 'none' as const,
    position: 'absolute' as const,
    right: '-50%',
    top: '-50%',
    width: '100%',
});

function TrendBadge({ current, previous }: { current: number; previous: number }) {
    if (previous === 0) return null;
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) return null;
    const isUp = pct > 0;
    return (
        <span style={{
            alignItems: 'center',
            background: isUp ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            borderRadius: '20px',
            color: isUp ? '#10B981' : '#EF4444',
            display: 'inline-flex',
            fontSize: '11px',
            fontWeight: 700,
            gap: '2px',
            padding: '3px 8px',
        }}>
            {isUp ? '↑' : '↓'} {Math.abs(pct)}%
        </span>
    );
}

export default async function AdminDashboardPage() {
    const db = await getServerDB();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // --- Current Week Stats ---
    const [totalUsersResult] = await db.select({ value: count() }).from(users);
    const [activeUsersResult] = await db
        .select({ value: count() })
        .from(users)
        .where(eq(users.subscriptionStatus, 'ACTIVE'));
    const [paidUsersResult] = await db
        .select({ value: count() })
        .from(users)
        .where(ne(users.currentPlanId, 'vn_free'));

    const [revenueResult] = await db
        .select({ value: sql<string>`COALESCE(SUM(${sepayPayments.amountVnd}), 0)` })
        .from(sepayPayments)
        .where(eq(sepayPayments.status, 'success'));

    const [openTicketsResult] = await db
        .select({ value: count() })
        .from(supportTickets)
        .where(eq(supportTickets.status, 'open'));

    // --- This Week Revenue ---
    const [thisWeekRevenue] = await db
        .select({ value: sql<string>`COALESCE(SUM(${sepayPayments.amountVnd}), 0)` })
        .from(sepayPayments)
        .where(and(eq(sepayPayments.status, 'success'), gte(sepayPayments.createdAt, sevenDaysAgo)));

    // --- Last Week Revenue ---
    const [lastWeekRevenue] = await db
        .select({ value: sql<string>`COALESCE(SUM(${sepayPayments.amountVnd}), 0)` })
        .from(sepayPayments)
        .where(and(eq(sepayPayments.status, 'success'), gte(sepayPayments.createdAt, fourteenDaysAgo), lt(sepayPayments.createdAt, sevenDaysAgo)));

    // --- This Week New Users ---
    const [thisWeekUsers] = await db
        .select({ value: count() })
        .from(users)
        .where(gte(users.createdAt, sevenDaysAgo));

    // --- Last Week New Users ---
    const [lastWeekUsers] = await db
        .select({ value: count() })
        .from(users)
        .where(and(gte(users.createdAt, fourteenDaysAgo), lt(users.createdAt, sevenDaysAgo)));

    // Anomalies
    const [anomalyResult] = await db
        .select({ value: count() })
        .from(users)
        .where(
            and(
                ne(users.currentPlanId, 'vn_free'),
                ne(users.currentPlanId, 'gl_starter'),
                eq(users.subscriptionStatus, 'FREE')
            )
        );

    const [negativePointsResult] = await db
        .select({ value: count() })
        .from(users)
        .where(lt(users.phoPointsBalance, 0));

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const [stuckPaymentsResult] = await db
        .select({ value: count() })
        .from(sepayPayments)
        .where(and(eq(sepayPayments.status, 'pending'), lte(sepayPayments.createdAt, twoHoursAgo)));

    const totalAnomalies =
        (anomalyResult?.value || 0) +
        (negativePointsResult?.value || 0) +
        (stuckPaymentsResult?.value || 0);

    const thisWeekRevenueNum = Number(thisWeekRevenue?.value || 0);
    const lastWeekRevenueNum = Number(lastWeekRevenue?.value || 0);
    const thisWeekUsersNum = thisWeekUsers?.value || 0;
    const lastWeekUsersNum = lastWeekUsers?.value || 0;

    const stats = [
        {
            description: 'Registered accounts',
            glowColor: 'rgba(56, 189, 248, 0.4)',
            icon: '👥',
            iconColor: '#38BDF8',
            label: 'Total Users',
            trend: { current: thisWeekUsersNum, previous: lastWeekUsersNum },
            value: totalUsersResult?.value || 0,
        },
        {
            description: 'Subscription active',
            glowColor: 'rgba(52, 211, 153, 0.4)',
            icon: '✅',
            iconColor: '#34D399',
            label: 'Active Users',
            trend: null,
            value: activeUsersResult?.value || 0,
        },
        {
            description: 'On a paid plan',
            glowColor: 'rgba(167, 139, 250, 0.4)',
            icon: '💎',
            iconColor: '#A78BFA',
            label: 'Paid Users',
            trend: null,
            value: paidUsersResult?.value || 0,
        },
        {
            description: 'Lifetime Sepay volume',
            glowColor: 'rgba(16, 185, 129, 0.4)',
            icon: '💰',
            iconColor: '#10B981',
            label: 'Total Revenue',
            trend: { current: thisWeekRevenueNum, previous: lastWeekRevenueNum },
            value: `${Number(revenueResult?.value || 0).toLocaleString('vi-VN')} ₫`,
        },
        {
            description: 'Awaiting resolution',
            glowColor: 'rgba(251, 146, 60, 0.4)',
            icon: '🎫',
            iconColor: '#FB923C',
            label: 'Open Tickets',
            trend: null,
            value: openTicketsResult?.value || 0,
        },
        {
            description: totalAnomalies > 0 ? 'Needs attention!' : 'All clear',
            glowColor: totalAnomalies > 0 ? 'rgba(248, 113, 113, 0.4)' : 'rgba(52, 211, 153, 0.4)',
            icon: totalAnomalies > 0 ? '🚨' : '🟢',
            iconColor: totalAnomalies > 0 ? '#F87171' : '#34D399',
            label: 'Anomalies',
            trend: null,
            value: totalAnomalies,
        },
    ];

    const quickLinks = [
        { emoji: '🔑', href: 'https://dashboard.clerk.com', label: 'Clerk Dashboard' },
        { emoji: '🗄️', href: 'https://console.neon.tech', label: 'Neon Console' },
        { emoji: '▲', href: 'https://vercel.com/dashboard', label: 'Vercel Deploy' },
        { emoji: '🎙️', href: 'https://dashboard.vapi.ai', label: 'Vapi Voice' },
        { emoji: '📊', href: 'https://us.posthog.com', label: 'PostHog Analytics' },
    ];

    return (
        <div style={{ color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '40px', margin: '0 auto', maxWidth: '1200px' }}>
            {/* Header */}
            <div>
                <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
                    <h1 style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
                        Overview
                    </h1>
                    <AutoRefresh />
                </div>
                <p style={{ color: '#A1A1AA', fontSize: '15px', marginTop: '8px' }}>
                    Centralized command center for Phở Platform operations and anomaly detection.
                </p>
            </div>

            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {stats.map((stat) => (
                    <div className="group hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:border-[rgba(255,255,255,0.12)] cursor-default" key={stat.label} style={cardStyle}>
                        <div className="group-hover:opacity-30 transition-opacity duration-500" style={hoverGlow(stat.glowColor)} />

                        <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', marginBottom: '16px', zIndex: 1 }}>
                            <div style={{ alignItems: 'center', display: 'flex', gap: '10px' }}>
                                <span style={{ color: '#A1A1AA', fontSize: '14px', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                                    {stat.label}
                                </span>
                                {stat.trend && <TrendBadge current={stat.trend.current} previous={stat.trend.previous} />}
                            </div>
                            <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', height: '36px', justifyContent: 'center', padding: '6px', width: '36px' }}>
                                <span style={{ fontSize: '20px' }}>{stat.icon}</span>
                            </div>
                        </div>

                        <div style={{ zIndex: 1 }}>
                            <div style={{ color: '#FFFFFF', fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                                {stat.value}
                            </div>
                            <p style={{ color: stat.iconColor, fontSize: '13px', fontWeight: 500, marginTop: '8px' }}>
                                {stat.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Navigation */}
            <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '20px' }}>Quick Navigation</h2>
                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                    <Link className="hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-all" href="/admin/users" style={{ ...cardStyle, padding: '20px', textDecoration: 'none' }}>
                        <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
                            <div style={{ background: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px', padding: '12px' }}>
                                <span style={{ fontSize: '24px' }}>👥</span>
                            </div>
                            <div>
                                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Users & CRM</div>
                                <div style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '2px' }}>Manage user accounts</div>
                            </div>
                        </div>
                    </Link>
                    <Link className="hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-all" href="/admin/revenue" style={{ ...cardStyle, padding: '20px', textDecoration: 'none' }}>
                        <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', padding: '12px' }}>
                                <span style={{ fontSize: '24px' }}>💰</span>
                            </div>
                            <div>
                                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Revenue</div>
                                <div style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '2px' }}>Track inbound payments</div>
                            </div>
                        </div>
                    </Link>
                    <Link className="hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-all" href="/admin/health" style={{ ...cardStyle, padding: '20px', textDecoration: 'none' }}>
                        <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
                            <div style={{ background: 'rgba(248, 113, 113, 0.1)', borderRadius: '12px', padding: '12px' }}>
                                <span style={{ fontSize: '24px' }}>🏥</span>
                            </div>
                            <div>
                                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Health Radar</div>
                                <div style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '2px' }}>Automated bug detection</div>
                            </div>
                        </div>
                    </Link>
                    <Link className="hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-all" href="/admin/tickets" style={{ ...cardStyle, padding: '20px', textDecoration: 'none' }}>
                        <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
                            <div style={{ background: 'rgba(251, 146, 60, 0.1)', borderRadius: '12px', padding: '12px' }}>
                                <span style={{ fontSize: '24px' }}>🎫</span>
                            </div>
                            <div>
                                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Support Tickets</div>
                                <div style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '2px' }}>Review voice escalations</div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* External Quick Links */}
            <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '20px' }}>External Tooling</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {quickLinks.map((link) => (
                        <a
                            className="hover:bg-[rgba(255,255,255,0.08)] hover:text-white hover:border-[rgba(255,255,255,0.15)]"
                            href={link.href}
                            key={link.label}
                            rel="noopener noreferrer"
                            style={{
                                alignItems: 'center',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '10px',
                                color: '#D4D4D8',
                                display: 'inline-flex',
                                fontSize: '14px',
                                fontWeight: 500,
                                gap: '10px',
                                padding: '10px 16px',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                            }}
                            target="_blank"
                        >
                            <span style={{ fontSize: '16px' }}>{link.emoji}</span>
                            {link.label}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
