'use client';

import React, { useCallback, useEffect, useState } from 'react';

/**
 * Rate Limit Inspector — Admin Dashboard Widget
 *
 * TOP SECTION: Real-time overview of all users' rate limit usage today
 *   (auto-refreshes every 30s via GET /api/admin/rate-limits/overview)
 *
 * BOTTOM SECTION: Per-user lookup + reset
 *   (GET/DELETE /api/admin/rate-limits/[userId])
 */

// ── Types ─────────────────────────────────────────────────────────────────────

interface TierSummary { activeUsers: number; totalMessages: number }

interface TopUser { tier: number; total: number; userId: string }

interface OverviewResponse {
    date: string;
    error?: string;
    redisAvailable: boolean;
    tierSummary: Record<string, TierSummary>;
    topUsers: TopUser[];
    totalKeys: number;
    totalMessages: number;
    uniqueUsers: number;
}

interface Counter {
    count: number;
    date: string | null;
    key: string;
    tier: number | null;
    ttlSeconds: number;
}

interface LookupResponse {
    counters: Counter[];
    date: string;
    error?: string;
    redisAvailable: boolean;
    totalKeys: number;
    userId: string;
}

interface DeleteResponse { message: string }

// ── Design tokens ─────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
    backdropFilter: 'blur(24px)',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    padding: '24px',
    position: 'relative',
};

const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#FAFAFA',
    flex: 1,
    fontSize: '14px',
    outline: 'none',
    padding: '10px 14px',
};

const btn = (bg: string, border: string, color: string, extra?: React.CSSProperties): React.CSSProperties => ({
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: '10px',
    color,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    padding: '9px 18px',
    transition: 'all 0.2s ease',
    ...extra,
});

const TIER_COLORS: Record<number, { bg: string; border: string; text: string }> = {
    1: { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', text: '#34D399' },
    2: { bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.2)', text: '#38BDF8' },
    3: { bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)', text: '#A78BFA' },
};

const TIER_DEFAULT = { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: '#A1A1AA' };

function formatTTL(s: number) {
    if (s < 0) return 'expired';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function shortId(uid: string) {
    // show first 8 + last 4 chars
    if (uid.length <= 16) return uid;
    return `${uid.slice(0, 12)}…${uid.slice(-4)}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: number }) {
    const c = TIER_COLORS[tier] ?? TIER_DEFAULT;
    return (
        <span style={{
            background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: '6px', color: c.text,
            fontSize: '11px', fontWeight: 700, padding: '2px 8px',
        }}>
            T{tier}
        </span>
    );
}

function Toast({ ok, msg }: { msg: string; ok: boolean }) {
    return (
        <div style={{
            background: ok ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${ok ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: '10px',
            bottom: 0, color: ok ? '#34D399' : '#F87171', fontSize: '13px',
            fontWeight: 500,
            left: 0, margin: '16px',
            padding: '10px 16px',
            position: 'absolute',
            right: 0,
        }}>
            {ok ? '✅' : '❌'} {msg}
        </div>
    );
}

// ── Overview Panel ────────────────────────────────────────────────────────────

function OverviewPanel() {
    const [data, setData] = useState<OverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchOverview = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/rate-limits/overview');
            const json: OverviewResponse = await res.json();
            setData(json);
            setLastUpdated(new Date());
        } catch {
            // silent — keep showing stale data
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOverview();
        const id = setInterval(fetchOverview, 30_000); // refresh every 30s
        return () => clearInterval(id);
    }, [fetchOverview]);

    if (loading) return (
        <div style={{ color: '#52525B', fontSize: '13px', padding: '16px 0' }}>
            Loading live stats…
        </div>
    );

    if (!data?.redisAvailable) return (
        <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px', color: '#F87171', fontSize: '13px', padding: '12px 16px',
        }}>
            ⚠️ Redis not configured — set UPSTASH_REDIS_REST_URL & TOKEN
        </div>
    );

    const tiers = Object.entries(data.tierSummary ?? {}).map(([t, s]) => ({
        ...s, tier: Number(t),
    })).sort((a, b) => a.tier - b.tier);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* KPI row */}
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {[
                    { color: '#38BDF8', icon: '💬', label: 'Total Messages Today', val: data.totalMessages },
                    { color: '#34D399', icon: '👤', label: 'Active Users', val: data.uniqueUsers },
                    { color: '#A78BFA', icon: '🗝️', label: 'Redis Keys', val: data.totalKeys },
                ].map((kpi) => (
                    <div key={kpi.label} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '22px', marginBottom: '4px' }}>{kpi.icon}</div>
                        <div style={{ color: kpi.color, fontSize: '24px', fontWeight: 700 }}>{kpi.val}</div>
                        <div style={{ color: '#71717A', fontSize: '11px', marginTop: '2px' }}>{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* Per-tier breakdown */}
            {tiers.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ color: '#71717A', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Breakdown by Tier
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {tiers.map((t) => {
                            const c = TIER_COLORS[t.tier] ?? TIER_DEFAULT;
                            return (
                                <div key={t.tier} style={{
                                    alignItems: 'center',
                                    background: c.bg, border: `1px solid ${c.border}`,
                                    borderRadius: '10px', display: 'flex', flex: '1 1 140px',
                                    gap: '10px', padding: '12px 16px',
                                }}>
                                    <TierBadge tier={t.tier} />
                                    <div>
                                        <div style={{ color: c.text, fontSize: '20px', fontWeight: 700 }}>{t.totalMessages}</div>
                                        <div style={{ color: '#71717A', fontSize: '11px' }}>{t.activeUsers} user{t.activeUsers !== 1 ? 's' : ''}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Top users table */}
            {data.topUsers.length > 0 && (
                <div>
                    <div style={{ color: '#71717A', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Top Users Today
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {data.topUsers.map((u, i) => (
                            <div key={u.userId} style={{
                                alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                display: 'flex',
                                gap: '10px', padding: '8px 12px',
                            }}>
                                <span style={{ color: '#52525B', fontSize: '12px', fontWeight: 700, minWidth: '20px' }}>
                                    #{i + 1}
                                </span>
                                <code style={{ color: '#A1A1AA', flex: 1, fontSize: '12px' }}>
                                    {shortId(u.userId)}
                                </code>
                                <TierBadge tier={u.tier} />
                                <span style={{ color: '#FAFAFA', fontSize: '14px', fontWeight: 700, minWidth: '36px', textAlign: 'right' }}>
                                    {u.total}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Last updated */}
            <div style={{ color: '#3F3F46', fontSize: '11px', textAlign: 'right' }}>
                Auto-refreshes every 30s
                {lastUpdated && ` · Last: ${lastUpdated.toLocaleTimeString()}`}
            </div>
        </div>
    );
}

// ── Per-user Search Panel ─────────────────────────────────────────────────────

function UserSearchPanel() {
    const [userId, setUserId] = useState('');
    const [data, setData] = useState<LookupResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [resetting, setResetting] = useState<'all' | number | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    function showToast(msg: string, ok: boolean) {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    }

    async function lookup() {
        const id = userId.trim();
        if (!id) return;
        setLoading(true);
        setData(null);
        try {
            const res = await fetch(`/api/admin/rate-limits/${encodeURIComponent(id)}`);
            const json: LookupResponse = await res.json();
            setData(json);
            if (!res.ok) showToast(json.error ?? 'Error', false);
        } catch { showToast('Network error', false); }
        finally { setLoading(false); }
    }

    async function reset(tier?: number) {
        const id = userId.trim();
        if (!id) return;
        setResetting(tier ?? 'all');
        try {
            const url = tier
                ? `/api/admin/rate-limits/${encodeURIComponent(id)}?tier=${tier}`
                : `/api/admin/rate-limits/${encodeURIComponent(id)}`;
            const res = await fetch(url, { method: 'DELETE' });
            const json: DeleteResponse = await res.json();
            showToast(json.message, res.ok);
            if (res.ok) await lookup();
        } catch { showToast('Network error', false); }
        finally { setResetting(null); }
    }

    return (
        <div>
            <div style={{ color: '#71717A', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '12px', textTransform: 'uppercase' }}>
                Per-user Lookup & Reset
            </div>

            {/* Search row */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <input
                    onChange={(e) => setUserId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && lookup()}
                    placeholder="User ID (e.g. user_2abc123...)"
                    style={inputStyle}
                    value={userId}
                />
                <button
                    disabled={loading || !userId.trim()}
                    onClick={lookup}
                    style={btn('rgba(56,189,248,0.15)', 'rgba(56,189,248,0.3)', '#38BDF8', { opacity: !userId.trim() ? 0.5 : 1 })}
                    type="button"
                >
                    {loading ? '…' : '🔍 Lookup'}
                </button>
            </div>

            {data && (
                <div>
                    <div style={{
                        alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between', marginBottom: '12px', padding: '10px 14px',
                    }}>
                        <span style={{ color: '#A1A1AA', fontSize: '13px' }}>
                            <b style={{ color: '#FAFAFA' }}>{data.totalKeys}</b> key{data.totalKeys !== 1 ? 's' : ''} · <b style={{ color: '#FAFAFA' }}>{data.date}</b>
                        </span>
                        {data.totalKeys > 0 && (
                            <button
                                disabled={resetting === 'all'}
                                onClick={() => reset()}
                                style={btn('rgba(239,68,68,0.1)', 'rgba(239,68,68,0.2)', '#F87171', { fontSize: '12px', padding: '6px 12px' })}
                                type="button"
                            >
                                {resetting === 'all' ? '…' : '🗑 Reset All'}
                            </button>
                        )}
                    </div>

                    {data.totalKeys === 0 && (
                        <div style={{ color: '#52525B', fontSize: '14px', padding: '16px', textAlign: 'center' }}>
                            No counters found for this user today.
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {data.counters.map((c) => {
                            const tier = c.tier ?? 0;
                            const colors = TIER_COLORS[tier] ?? TIER_DEFAULT;
                            return (
                                <div key={c.key} style={{
                                    alignItems: 'center', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '10px',
                                    display: 'flex', gap: '12px',
                                    justifyContent: 'space-between', padding: '10px 14px',
                                }}>
                                    <div style={{ alignItems: 'center', display: 'flex', flex: 1, gap: '10px', minWidth: 0 }}>
                                        <TierBadge tier={tier} />
                                        <span style={{ color: '#FAFAFA', fontSize: '20px', fontWeight: 700 }}>{c.count}</span>
                                        <span style={{ color: '#71717A', fontSize: '12px' }}>msgs today</span>
                                        <code style={{ color: '#3F3F46', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            TTL {formatTTL(c.ttlSeconds)}
                                        </code>
                                    </div>
                                    <button
                                        disabled={resetting === tier}
                                        onClick={() => reset(tier)}
                                        style={btn('rgba(239,68,68,0.08)', 'rgba(239,68,68,0.15)', '#F87171', { flexShrink: 0, fontSize: '11px', padding: '5px 10px' })}
                                        type="button"
                                    >
                                        {resetting === tier ? '…' : 'Reset'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {toast && <Toast msg={toast.msg} ok={toast.ok} />}
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function RateLimitInspector() {
    return (
        <div style={card}>
            {/* Header */}
            <div style={{ alignItems: 'center', display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '12px', padding: '10px' }}>
                    <span style={{ fontSize: '22px' }}>🚦</span>
                </div>
                <div>
                    <div style={{ color: '#FAFAFA', fontSize: '18px', fontWeight: 700 }}>Rate Limit Inspector</div>
                    <div style={{ color: '#71717A', fontSize: '13px', marginTop: '2px' }}>
                        Real-time daily AI quota usage · Upstash Redis
                    </div>
                </div>
            </div>

            {/* Overview (live) */}
            <OverviewPanel />

            {/* Divider */}
            <div style={{ background: 'rgba(255,255,255,0.06)', height: '1px', margin: '24px 0' }} />

            {/* Per-user lookup */}
            <UserSearchPanel />
        </div>
    );
}
