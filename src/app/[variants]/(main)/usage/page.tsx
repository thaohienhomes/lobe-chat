import { and, desc, eq, gte, sql } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { usageLogs } from '@/database/schemas';
import { getServerDB } from '@/database/server';

// We use Clerk's server auth
async function getClerkUserId(): Promise<string | null> {
    try {
        const { auth } = await import('@clerk/nextjs/server');
        const session = await auth();
        return session.userId || null;
    } catch {
        return null;
    }
}

// Try to get phoWallet balance via Clerk id
async function getWalletBalance(clerkUserId: string): Promise<{ balance: number; tierCode: string } | null> {
    try {
        const db = await getServerDB();
        const { phoWallet } = await import('@/database/schemas') as any;
        const [wallet] = await db.select().from(phoWallet).where(eq(phoWallet.clerkUserId, clerkUserId)).limit(1);
        return wallet || null;
    } catch {
        return null;
    }
}

// Get the internal DB user id from clerkUserId
async function getDbUserId(clerkUserId: string): Promise<string | null> {
    try {
        const db = await getServerDB();
        const { users } = await import('@/database/schemas') as any;
        const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkUserId)).limit(1);
        return user?.id || null;
    } catch {
        return null;
    }
}

const TIER_LABELS: Record<string, string> = {
    free: 'VN Free',
    gl_starter: 'GL Starter',
    lifetime_early_bird: 'Lifetime Early Bird',
    lifetime_last_call: 'Lifetime Last Call',
    lifetime_standard: 'Lifetime Standard',
    medical_beta: 'Medical Beta',
    vn_creator: 'VN Creator',
    vn_free: 'VN Free',
    vn_pro: 'VN Pro',
};

export default async function UsagePage() {
    const clerkUserId = await getClerkUserId();

    if (!clerkUserId) {
        redirect('/login');
    }

    const dbUserId = await getDbUserId(clerkUserId);
    const wallet = await getWalletBalance(clerkUserId);

    if (!dbUserId) {
        return (
            <div style={{ alignItems: 'center', color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', minHeight: '50vh', textAlign: 'center' }}>
                <div style={{ fontSize: '48px' }}>👋</div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>No usage data yet</h2>
                <p style={{ color: '#A1A1AA' }}>Start a conversation to see your usage stats here.</p>
                <Link href="/" style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', borderRadius: '12px', color: '#FFFFFF', padding: '12px 24px', textDecoration: 'none' }}>
                    Start chatting →
                </Link>
            </div>
        );
    }

    const db = await getServerDB();

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Item 9: Wrap all queries in try/catch — if usageLogs table doesn't exist or any query fails, show empty state
    let totalPoints = 0;
    let totalMessages = 0;
    let monthPoints = 0;
    let topModels: { messages: number; model: string; pointsUsed: number }[] = [];
    let chartData: { day: string; label: string; messages: number; points: number }[] = [];
    let maxPoints = 1;

    try {
        // Total points used (all time)
        const [totalPointsResult] = await db
            .select({ total: sql<number>`COALESCE(SUM(${usageLogs.pointsDeducted}), 0)` })
            .from(usageLogs)
            .where(eq(usageLogs.userId, dbUserId));

        // Total messages
        const [totalMsgsResult] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(usageLogs)
            .where(eq(usageLogs.userId, dbUserId));

        // This month's points usage
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [monthPointsResult] = await db
            .select({ total: sql<number>`COALESCE(SUM(${usageLogs.pointsDeducted}), 0)` })
            .from(usageLogs)
            .where(and(eq(usageLogs.userId, dbUserId), gte(usageLogs.createdAt, startOfMonth)));

        // Top 5 models used (last 30 days)
        topModels = (await db
            .select({
                messages: sql<number>`COUNT(*)`,
                model: usageLogs.model,
                pointsUsed: sql<number>`COALESCE(SUM(${usageLogs.pointsDeducted}), 0)`,
            })
            .from(usageLogs)
            .where(and(eq(usageLogs.userId, dbUserId), gte(usageLogs.createdAt, thirtyDaysAgo)))
            .groupBy(usageLogs.model)
            .orderBy(desc(sql`COUNT(*)`))
            .limit(5)) as any;

        // Daily usage (last 14 days)
        const dailyUsage = await db
            .select({
                day: sql<string>`TO_CHAR(${usageLogs.createdAt}, 'YYYY-MM-DD')`,
                messages: sql<number>`COUNT(*)`,
                points: sql<number>`COALESCE(SUM(${usageLogs.pointsDeducted}), 0)`,
            })
            .from(usageLogs)
            .where(and(eq(usageLogs.userId, dbUserId), gte(usageLogs.createdAt, fourteenDaysAgo)))
            .groupBy(sql`TO_CHAR(${usageLogs.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`TO_CHAR(${usageLogs.createdAt}, 'YYYY-MM-DD')`);

        // Fill missing days
        const dayMap = new Map(dailyUsage.map(d => [d.day, Number(d.points)]));
        const msgMap = new Map(dailyUsage.map(d => [d.day, Number(d.messages)]));
        for (let i = 13; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const key = date.toISOString().split('T')[0];
            const label = `${date.getDate()}/${date.getMonth() + 1}`;
            chartData.push({ day: key, label, messages: msgMap.get(key) || 0, points: dayMap.get(key) || 0 });
        }
        maxPoints = Math.max(...chartData.map(d => d.points), 1);

        totalPoints = Number(totalPointsResult?.total || 0);
        totalMessages = Number(totalMsgsResult?.count || 0);
        monthPoints = Number(monthPointsResult?.total || 0);
    } catch (err) {
        console.error('[usage] Query failed, showing empty state:', err);
        // Fill chart with empty 14 days
        for (let i = 13; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const key = date.toISOString().split('T')[0];
            const label = `${date.getDate()}/${date.getMonth() + 1}`;
            chartData.push({ day: key, label, messages: 0, points: 0 });
        }
    }

    const currentBalance = wallet?.balance || 0;
    const tierCode = wallet?.tierCode || 'free';

    const maxTopModel = Math.max(...topModels.map(m => Number(m.messages)), 1);

    // Simple color palette for models
    const modelColors = ['#A78BFA', '#34D399', '#F59E0B', '#38BDF8', '#F87171'];

    return (
        <div style={{ color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '32px', margin: '0 auto', maxWidth: '900px', padding: '32px 20px' }}>
            {/* Header */}
            <div>
                <h1 style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
                    My Usage
                </h1>
                <p style={{ color: '#A1A1AA', fontSize: '15px', marginTop: '8px' }}>
                    Your personal AI usage stats and Phở Points breakdown.
                </p>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {[
                    {
                        color: '#A78BFA',
                        label: 'Current Balance',
                        sub: TIER_LABELS[tierCode] || tierCode,
                        unit: 'pts',
                        value: currentBalance.toLocaleString(),
                    },
                    {
                        color: '#34D399',
                        label: 'Used This Month',
                        sub: new Date().toLocaleString('vi-VN', { month: 'long', year: 'numeric' }),
                        unit: 'pts',
                        value: monthPoints.toLocaleString(),
                    },
                    {
                        color: '#FBBF24',
                        label: 'Total Messages',
                        sub: 'All time',
                        unit: 'msgs',
                        value: totalMessages.toLocaleString(),
                    },
                    {
                        color: '#38BDF8',
                        label: 'Total Points Used',
                        sub: 'All time',
                        unit: 'pts',
                        value: totalPoints.toLocaleString(),
                    },
                ].map(stat => (
                    <div key={stat.label} style={{
                        backdropFilter: 'blur(24px)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '20px 24px',
                    }}>
                        <span style={{ color: '#71717A', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</span>
                        <div style={{ alignItems: 'baseline', display: 'flex', gap: '6px' }}>
                            <span style={{ color: stat.color, fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{stat.value}</span>
                            <span style={{ color: '#71717A', fontSize: '13px' }}>{stat.unit}</span>
                        </div>
                        <span style={{ color: '#71717A', fontSize: '12px', marginTop: '2px' }}>{stat.sub}</span>
                    </div>
                ))}
            </div>

            {/* 14-Day Activity Chart */}
            <div style={{
                backdropFilter: 'blur(24px)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                padding: '0',
            }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>📈 Activity (Last 14 Days)</h2>
                    <p style={{ color: '#71717A', fontSize: '13px', marginTop: '4px' }}>Daily Phở Points usage</p>
                </div>
                <div style={{ padding: '24px' }}>
                    {chartData.every(d => d.points === 0) ? (
                        <div style={{ color: '#71717A', padding: '32px', textAlign: 'center' }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                            No activity in the last 14 days. <Link href="/" style={{ color: '#A78BFA', textDecoration: 'none' }}>Start a conversation →</Link>
                        </div>
                    ) : (
                        <div style={{ alignItems: 'flex-end', display: 'flex', gap: '4px', height: '150px', width: '100%' }}>
                            {chartData.map(d => {
                                const heightPct = maxPoints > 0 ? (d.points / maxPoints) * 100 : 0;
                                const isToday = d.day === new Date().toISOString().split('T')[0];
                                return (
                                    <div
                                        key={d.day}
                                        style={{ alignItems: 'center', display: 'flex', flex: 1, flexDirection: 'column', gap: '6px', height: '100%', justifyContent: 'flex-end' }}
                                        title={`${d.label}: ${d.points.toLocaleString()} pts, ${d.messages} messages`}
                                    >
                                        {d.points > 0 && (
                                            <span style={{ color: '#A1A1AA', fontSize: '9px' }}>
                                                {d.points > 999 ? `${(d.points / 1000).toFixed(0)}k` : d.points}
                                            </span>
                                        )}
                                        <div style={{
                                            background: isToday
                                                ? 'linear-gradient(180deg, #A78BFA 0%, #7C3AED 100%)'
                                                : 'linear-gradient(180deg, rgba(167, 139, 250, 0.5) 0%, rgba(124, 58, 237, 0.2) 100%)',
                                            borderRadius: '4px 4px 0 0',
                                            boxShadow: isToday ? '0 0 10px rgba(167, 139, 250, 0.4)' : 'none',
                                            height: `${Math.max(heightPct, d.points > 0 ? 3 : 0)}%`,
                                            minHeight: d.points > 0 ? '3px' : '0px',
                                            width: '100%',
                                        }} />
                                        <span style={{ color: isToday ? '#A78BFA' : '#52525B', fontSize: '9px', fontWeight: isToday ? 700 : 400 }}>
                                            {d.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Top Models */}
            {topModels.length > 0 && (
                <div style={{
                    backdropFilter: 'blur(24px)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    padding: '0',
                }}>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>🤖 Top Models (Last 30 Days)</h2>
                        <p style={{ color: '#71717A', fontSize: '13px', marginTop: '4px' }}>Your most-used AI models by message count</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', padding: '8px 0' }}>
                        {topModels.map((m, idx) => {
                            const messages = Number(m.messages);
                            const points = Number(m.pointsUsed);
                            const barWidth = (messages / maxTopModel) * 100;
                            const color = modelColors[idx] || '#A1A1AA';
                            return (
                                <div key={m.model} style={{ padding: '14px 24px' }}>
                                    <div style={{ alignItems: 'center', display: 'flex', gap: '12px', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ alignItems: 'center', display: 'flex', gap: '10px', minWidth: 0 }}>
                                            <span style={{
                                                alignItems: 'center',
                                                background: `${color}15`,
                                                border: `1px solid ${color}30`,
                                                borderRadius: '50%',
                                                color,
                                                display: 'inline-flex',
                                                fontWeight: 700,
                                                height: '28px',
                                                justifyContent: 'center',
                                                width: '28px',
                                            }}>
                                                {idx + 1}
                                            </span>
                                            <span style={{ color: '#E2E8F0', fontFamily: 'monospace', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {m.model}
                                            </span>
                                        </div>
                                        <div style={{ alignItems: 'center', display: 'flex', flexShrink: 0, gap: '16px' }}>
                                            <span style={{ color: '#71717A', fontSize: '12px' }}>{messages.toLocaleString()} msgs</span>
                                            <span style={{ color, fontSize: '12px', fontWeight: 600 }}>{points.toLocaleString()} pts</span>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            background: color,
                                            borderRadius: '3px',
                                            height: '100%',
                                            width: `${barWidth}%`,
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* CTA to upgrade */}
            {(currentBalance < 10_000 || ['free', 'vn_free', 'gl_starter'].includes(tierCode)) && (
                <div style={{
                    backdropFilter: 'blur(24px)',
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Upgrade your plan</h3>
                    <p style={{ color: '#A1A1AA', fontSize: '14px', margin: '0 0 16px' }}>
                        Get more Phở Points and access to premium AI models.
                    </p>
                    <Link
                        href="/settings/subscription"
                        style={{
                            background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                            borderRadius: '10px',
                            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                            color: '#FFFFFF',
                            display: 'inline-block',
                            fontSize: '14px',
                            fontWeight: 600,
                            padding: '10px 24px',
                            textDecoration: 'none',
                        }}
                    >
                        View Plans →
                    </Link>
                </div>
            )}
        </div>
    );
}
