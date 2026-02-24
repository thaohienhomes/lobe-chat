import { and, count, desc, eq, gte, sql } from 'drizzle-orm';

import { sepayPayments, subscriptions, users } from '@/database/schemas';
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

// Polar plan → USD price mapping (from CostOptimization)
const POLAR_PLAN_PRICES_USD: Record<string, number> = {
    lifetime_early_bird: 29,
    lifetime_last_call: 69,
    lifetime_standard: 49,
};

export default async function AdminRevenuePage() {
    const db = await getServerDB();

    // --- Sepay Revenue ---
    const [totalSepayResult] = await db
        .select({ value: sql<string>`COALESCE(SUM(${sepayPayments.amountVnd}), 0)` })
        .from(sepayPayments)
        .where(eq(sepayPayments.status, 'success'));

    const [sepayTxCount] = await db
        .select({ value: count() })
        .from(sepayPayments)
        .where(eq(sepayPayments.status, 'success'));

    const [pendingResult] = await db
        .select({ value: sql<string>`COALESCE(SUM(${sepayPayments.amountVnd}), 0)` })
        .from(sepayPayments)
        .where(eq(sepayPayments.status, 'pending'));

    // --- Polar Revenue (from subscriptions table) ---
    const polarSubs = await db
        .select({ planId: subscriptions.planId })
        .from(subscriptions)
        .where(eq(subscriptions.paymentProvider, 'polar'));

    let polarRevenueUSD = 0;
    let polarTxCount = 0;
    for (const sub of polarSubs) {
        const price = POLAR_PLAN_PRICES_USD[sub.planId || ''] || 0;
        if (price > 0) {
            polarRevenueUSD += price;
            polarTxCount++;
        }
    }

    // --- Daily Revenue Trend (last 14 days) ---
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const dailyRevenue = await db
        .select({
            day: sql<string>`TO_CHAR(${sepayPayments.createdAt}, 'YYYY-MM-DD')`,
            total: sql<string>`COALESCE(SUM(${sepayPayments.amountVnd}), 0)`,
            txCount: count(),
        })
        .from(sepayPayments)
        .where(and(eq(sepayPayments.status, 'success'), gte(sepayPayments.createdAt, fourteenDaysAgo)))
        .groupBy(sql`TO_CHAR(${sepayPayments.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`TO_CHAR(${sepayPayments.createdAt}, 'YYYY-MM-DD')`);

    // Fill in missing days with 0 so the chart looks continuous
    const dayMap = new Map(dailyRevenue.map(d => [d.day, Number(d.total)]));
    const chartData: { day: string; label: string; value: number }[] = [];
    for (let i = 13; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = date.toISOString().split('T')[0];
        const label = `${date.getDate()}/${date.getMonth() + 1}`;
        chartData.push({ day: key, label, value: dayMap.get(key) || 0 });
    }
    const maxChartValue = Math.max(...chartData.map(d => d.value), 1);

    // Plan breakdown
    const planBreakdown = await db
        .select({
            planId: users.currentPlanId,
            userCount: count(),
        })
        .from(users)
        .groupBy(users.currentPlanId)
        .orderBy(desc(count()));

    // Recent transactions (last 20)
    const recentTransactions = await db
        .select({
            amount: sepayPayments.amountVnd,
            createdAt: sepayPayments.createdAt,
            orderId: sepayPayments.orderId,
            status: sepayPayments.status,
            userId: sepayPayments.userId,
        })
        .from(sepayPayments)
        .orderBy(desc(sepayPayments.createdAt))
        .limit(20);

    const totalVnd = Number(totalSepayResult?.value || 0);
    const pendingVnd = Number(pendingResult?.value || 0);
    const avgSepay = sepayTxCount?.value ? Math.round(totalVnd / sepayTxCount.value) : 0;

    const planColors: Record<string, any> = {
        gl_starter: { bg: 'rgba(161, 161, 170, 0.15)', border: 'rgba(161, 161, 170, 0.2)', text: '#A1A1AA' },
        lifetime_early_bird: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.2)', text: '#FBBF24' },
        lifetime_last_call: { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.2)', text: '#EC4899' },
        lifetime_standard: { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.2)', text: '#FB923C' },
        medical_beta: { bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.2)', text: '#A78BFA' },
        vn_free: { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.08)', text: '#A1A1AA' },
    };

    const statusColors: Record<string, string> = {
        failed: '#EF4444',
        pending: '#EAB308',
        success: '#10B981',
    };

    return (
        <div style={{ color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '40px', margin: '0 auto', maxWidth: '1200px' }}>
            <div>
                <h1 style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
                    Revenue Dashboard
                </h1>
                <p style={{ color: '#A1A1AA', fontSize: '15px', marginTop: '8px' }}>
                    Real-time financial tracking across Sepay (VND) and Polar (USD).
                </p>
            </div>

            {/* === Sepay Revenue === */}
            <div>
                <h2 style={{ alignItems: 'center', color: '#D4D4D8', display: 'flex', fontSize: '18px', fontWeight: 700, gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '22px' }}>🇻🇳</span> Sepay Revenue (VND)
                </h2>
                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    {[
                        { glowColor: 'rgba(16, 185, 129, 0.4)', iconColor: '#10B981', label: 'Total Revenue', value: `${totalVnd.toLocaleString('vi-VN')} ₫` },
                        { glowColor: 'rgba(56, 189, 248, 0.4)', iconColor: '#38BDF8', label: 'Transactions', value: sepayTxCount?.value || 0 },
                        { glowColor: 'rgba(167, 139, 250, 0.4)', iconColor: '#A78BFA', label: 'Avg. Transaction', value: `${avgSepay.toLocaleString('vi-VN')} ₫` },
                        { glowColor: 'rgba(234, 179, 8, 0.4)', iconColor: '#EAB308', label: 'Pending', value: `${pendingVnd.toLocaleString('vi-VN')} ₫` },
                    ].map((stat) => (
                        <div key={stat.label} style={cardStyle}>
                            <div style={hoverGlow(stat.glowColor)} />
                            <span style={{ color: '#A1A1AA', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '12px', textTransform: 'uppercase', zIndex: 1 }}>{stat.label}</span>
                            <div style={{ color: stat.iconColor, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2, zIndex: 1 }}>{stat.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* === Polar Revenue === */}
            <div>
                <h2 style={{ alignItems: 'center', color: '#D4D4D8', display: 'flex', fontSize: '18px', fontWeight: 700, gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '22px' }}>🌍</span> Polar Revenue (USD)
                </h2>
                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    {[
                        { glowColor: 'rgba(99, 102, 241, 0.4)', iconColor: '#818CF8', label: 'Est. Revenue', value: `$${polarRevenueUSD.toLocaleString()}` },
                        { glowColor: 'rgba(52, 211, 153, 0.4)', iconColor: '#34D399', label: 'Polar Subs', value: polarTxCount },
                    ].map((stat) => (
                        <div key={stat.label} style={cardStyle}>
                            <div style={hoverGlow(stat.glowColor)} />
                            <span style={{ color: '#A1A1AA', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '12px', textTransform: 'uppercase', zIndex: 1 }}>{stat.label}</span>
                            <div style={{ color: stat.iconColor, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2, zIndex: 1 }}>{stat.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* === Revenue Trend (14 days) === */}
            <div style={{ ...cardStyle, padding: '0' }}>
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>📈 Revenue Trend (14 days)</h3>
                    <p style={{ color: '#A1A1AA', fontSize: '14px', marginTop: '4px' }}>Daily Sepay revenue over the past two weeks</p>
                </div>
                <div style={{ padding: '24px', paddingTop: '16px' }}>
                    <div style={{ alignItems: 'flex-end', display: 'flex', gap: '6px', height: '180px', width: '100%' }}>
                        {chartData.map((d) => {
                            const heightPct = maxChartValue > 0 ? (d.value / maxChartValue) * 100 : 0;
                            const isToday = d.day === new Date().toISOString().split('T')[0];
                            return (
                                <div
                                    key={d.day}
                                    style={{
                                        alignItems: 'center',
                                        display: 'flex',
                                        flex: 1,
                                        flexDirection: 'column',
                                        gap: '8px',
                                        height: '100%',
                                        justifyContent: 'flex-end',
                                    }}
                                    title={`${d.label}: ${d.value.toLocaleString('vi-VN')} ₫`}
                                >
                                    {/* Value label on top */}
                                    {d.value > 0 && (
                                        <span style={{ color: '#A1A1AA', fontSize: '10px', whiteSpace: 'nowrap' }}>
                                            {(d.value / 1000).toFixed(0)}k
                                        </span>
                                    )}
                                    {/* Bar */}
                                    <div
                                        style={{
                                            background: isToday
                                                ? 'linear-gradient(180deg, #7C3AED 0%, #4F46E5 100%)'
                                                : 'linear-gradient(180deg, rgba(124, 58, 237, 0.4) 0%, rgba(79, 70, 229, 0.2) 100%)',
                                            borderRadius: '4px 4px 0 0',
                                            boxShadow: isToday ? '0 0 12px rgba(124, 58, 237, 0.4)' : 'none',
                                            height: `${Math.max(heightPct, d.value > 0 ? 4 : 0)}%`,
                                            minHeight: d.value > 0 ? '4px' : '0px',
                                            transition: 'height 0.3s ease',
                                            width: '100%',
                                        }}
                                    />
                                    {/* Day label */}
                                    <span style={{ color: isToday ? '#A78BFA' : '#71717A', fontSize: '10px', fontWeight: isToday ? 600 : 400 }}>
                                        {d.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Plan Distribution */}
            <div style={{ ...cardStyle, padding: '0' }}>
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>📊 Plan Distribution</h3>
                    <p style={{ color: '#A1A1AA', fontSize: '14px', marginTop: '4px' }}>Breakdown of users by active subscription tier</p>
                </div>
                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        {planBreakdown.map((plan) => {
                            const pId = plan.planId || 'unknown';
                            const colors = planColors[pId] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: '#A1A1AA' };
                            return (
                                <div key={pId} style={{ alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
                                    <span style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '6px', color: colors.text, fontSize: '12px', fontWeight: 600, padding: '4px 8px' }}>
                                        {pId}
                                    </span>
                                    <span style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 700 }}>{plan.userCount}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Revenue Breakdown by Plan (12B) */}
            {(() => {
                const PLAN_REVENUE_USD: Record<string, { color: string; label: string; priceUsd: number }> = {
                    gl_starter: { color: '#71717A', label: 'GL Starter (Free)', priceUsd: 0 },
                    lifetime_early_bird: { color: '#FBBF24', label: 'Lifetime Early Bird', priceUsd: 29 },
                    lifetime_last_call: { color: '#EC4899', label: 'Lifetime Last Call', priceUsd: 69 },
                    lifetime_standard: { color: '#FB923C', label: 'Lifetime Standard', priceUsd: 49 },
                    medical_beta: { color: '#A78BFA', label: 'Medical Beta', priceUsd: 9 },
                    vn_free: { color: '#52525B', label: 'VN Free', priceUsd: 0 },
                };

                const planRevData = planBreakdown
                    .map(p => {
                        const pId = p.planId || 'unknown';
                        const config = PLAN_REVENUE_USD[pId] || { color: '#A1A1AA', label: pId, priceUsd: 0 };
                        const totalUsd = config.priceUsd * p.userCount;
                        return { color: config.color, count: p.userCount, label: config.label, planId: pId, totalUsd };
                    })
                    .filter(p => p.totalUsd > 0)
                    .sort((a, b) => b.totalUsd - a.totalUsd);

                const maxRevenue = Math.max(...planRevData.map(p => p.totalUsd), 1);

                if (planRevData.length === 0) return null;

                return (
                    <div style={{ ...cardStyle, padding: '0' }}>
                        <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', padding: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>💹 Revenue by Plan</h3>
                            <p style={{ color: '#A1A1AA', fontSize: '14px', marginTop: '4px' }}>Estimated lifetime USD contribution per subscription tier</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px' }}>
                            {planRevData.map(plan => {
                                const barWidth = (plan.totalUsd / maxRevenue) * 100;
                                return (
                                    <div key={plan.planId}>
                                        <div style={{ alignItems: 'center', display: 'flex', gap: '12px', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
                                                <span style={{ background: `${plan.color}25`, border: `1px solid ${plan.color}40`, borderRadius: '4px', color: plan.color, fontSize: '11px', fontWeight: 700, padding: '2px 7px' }}>
                                                    {plan.label}
                                                </span>
                                                <span style={{ color: '#71717A', fontSize: '12px' }}>{plan.count} users</span>
                                            </div>
                                            <span style={{ color: '#FFFFFF', fontWeight: 700, minWidth: '80px', textAlign: 'right' }}>
                                                ${plan.totalUsd.toLocaleString()}
                                            </span>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '4px', height: '8px', overflow: 'hidden', width: '100%' }}>
                                            <div style={{
                                                background: `linear-gradient(90deg, ${plan.color} 0%, ${plan.color}80 100%)`,
                                                borderRadius: '4px',
                                                height: '100%',
                                                transition: 'width 0.6s ease',
                                                width: `${barWidth}%`,
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* Recent Transactions (Sepay) */}
            <div style={{ ...cardStyle, padding: '0' }}>
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>🕐 Recent Sepay Transactions</h3>
                    <p style={{ color: '#A1A1AA', fontSize: '14px', marginTop: '4px' }}>Last 20 payments via Sepay (VND)</p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left', width: '100%' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Order ID</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Amount</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Status</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ color: '#A1A1AA', padding: '32px', textAlign: 'center' }}>No transactions found</td>
                                </tr>
                            ) : (
                                recentTransactions.map((tx) => (
                                    <tr className="hover:bg-[rgba(255,255,255,0.02)] transition-colors" key={tx.orderId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                        <td style={{ color: '#D4D4D8', fontFamily: 'monospace', padding: '16px 24px' }}>{tx.orderId}</td>
                                        <td style={{ color: '#FFFFFF', fontWeight: 600, padding: '16px 24px' }}>{tx.amount.toLocaleString('vi-VN')} ₫</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                alignItems: 'center',
                                                background: `rgba(${tx.status === 'success' ? '16, 185, 129' : tx.status === 'pending' ? '234, 179, 8' : '239, 68, 68'}, 0.15)`,
                                                border: `1px solid rgba(${tx.status === 'success' ? '16, 185, 129' : tx.status === 'pending' ? '234, 179, 8' : '239, 68, 68'}, 0.2)`,
                                                borderRadius: '20px',
                                                color: statusColors[tx.status || 'failed'],
                                                display: 'inline-flex',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                gap: '6px',
                                                padding: '4px 10px'
                                            }}>
                                                <span style={{ backgroundColor: statusColors[tx.status || 'failed'], borderRadius: '50%', height: '6px', width: '6px' }} />
                                                {tx.status?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ color: '#A1A1AA', fontSize: '13px', padding: '16px 24px' }}>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}</td>
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
