'use client';

import React, { useState } from 'react';

/**
 * Rate Limit Inspector — Admin Dashboard Widget
 *
 * Lets admins look up and reset per-user daily AI rate-limit counters
 * stored in Upstash Redis (key format: pho:ratelimit:{userId}:tier{n}:{date}).
 *
 * Calls:
 *   GET    /api/admin/rate-limits/[userId]        → view counters
 *   DELETE /api/admin/rate-limits/[userId]        → reset all
 *   DELETE /api/admin/rate-limits/[userId]?tier=N → reset one tier
 */



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

interface DeleteResponse {
    deleted: number;
    keys: string[];
    message: string;
}

// ── Inline styles following dashboard design system ──────────────────────────

const cardStyle: React.CSSProperties = {
    backdropFilter: 'blur(24px)',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
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

const btnBase: React.CSSProperties = {
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    padding: '10px 20px',
    transition: 'all 0.2s ease',
};

const tierColors: Record<number, { bg: string; border: string; text: string }> = {
    1: { bg: 'rgba(52, 211, 153, 0.08)', border: 'rgba(52, 211, 153, 0.2)', text: '#34D399' },
    2: { bg: 'rgba(56, 189, 248, 0.08)', border: 'rgba(56, 189, 248, 0.2)', text: '#38BDF8' },
    3: { bg: 'rgba(167, 139, 250, 0.08)', border: 'rgba(167, 139, 250, 0.2)', text: '#A78BFA' },
};

function formatTTL(seconds: number): string {
    if (seconds < 0) return 'expired';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function RateLimitInspector() {
    const [userId, setUserId] = useState('');
    const [data, setData] = useState<LookupResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [resetting, setResetting] = useState<number | 'all' | null>(null);
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
            if (!res.ok) showToast(json.error ?? 'Error fetching data', false);
        } catch {
            showToast('Network error', false);
        } finally {
            setLoading(false);
        }
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
            if (res.ok) await lookup(); // refresh after reset
        } catch {
            showToast('Network error', false);
        } finally {
            setResetting(null);
        }
    }

    return (
        <div style={cardStyle}>
            {/* Header */}
            <div style={{ alignItems: 'center', display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', padding: '10px' }}>
                    <span style={{ fontSize: '22px' }}>🚦</span>
                </div>
                <div>
                    <div style={{ color: '#FAFAFA', fontSize: '18px', fontWeight: 700 }}>Rate Limit Inspector</div>
                    <div style={{ color: '#71717A', fontSize: '13px', marginTop: '2px' }}>
                        View &amp; reset daily AI quota counters (Upstash Redis)
                    </div>
                </div>
            </div>

            {/* Search row */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
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
                    style={{
                        ...btnBase,
                        background: loading ? 'rgba(255,255,255,0.08)' : 'rgba(56,189,248,0.15)',
                        border: '1px solid rgba(56,189,248,0.3)',
                        color: '#38BDF8',
                        opacity: !userId.trim() ? 0.5 : 1,
                    }}
                    type="button"
                >
                    {loading ? '…' : '🔍 Lookup'}
                </button>
            </div>

            {/* No Redis warning */}
            {data && !data.redisAvailable && (
                <div style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '10px',
                    color: '#F87171',
                    fontSize: '13px',
                    marginBottom: '16px',
                    padding: '12px 16px',
                }}>
                    ⚠️ Redis not configured — counters are running in-memory mode. Set UPSTASH_REDIS_REST_URL &amp; TOKEN.
                </div>
            )}

            {/* Results */}
            {data && data.redisAvailable && (
                <div>
                    {/* Summary bar */}
                    <div style={{
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '16px',
                        padding: '12px 16px',
                    }}>
                        <div style={{ color: '#A1A1AA', fontSize: '13px' }}>
                            <span style={{ color: '#FAFAFA', fontWeight: 600 }}>{data.totalKeys}</span> key{data.totalKeys !== 1 ? 's' : ''} found
                            {' '}· date <span style={{ color: '#FAFAFA', fontWeight: 600 }}>{data.date}</span>
                        </div>
                        {data.totalKeys > 0 && (
                            <button
                                disabled={resetting === 'all'}
                                onClick={() => reset()}
                                style={{
                                    ...btnBase,
                                    background: 'rgba(239,68,68,0.1)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    color: '#F87171',
                                    fontSize: '12px',
                                    padding: '7px 14px',
                                }}
                                type="button"
                            >
                                {resetting === 'all' ? '…' : '🗑 Reset All'}
                            </button>
                        )}
                    </div>

                    {/* Empty state */}
                    {data.totalKeys === 0 && (
                        <div style={{ color: '#52525B', fontSize: '14px', padding: '24px', textAlign: 'center' }}>
                            No rate limit counters found for this user today.
                        </div>
                    )}

                    {/* Counter rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {data.counters.map((c) => {
                            const tier = c.tier ?? 0;
                            const colors = tierColors[tier] ?? {
                                bg: 'rgba(255,255,255,0.04)',
                                border: 'rgba(255,255,255,0.08)',
                                text: '#A1A1AA',
                            };
                            return (
                                <div key={c.key} style={{
                                    alignItems: 'center',
                                    background: colors.bg,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '10px',
                                    display: 'flex',
                                    gap: '12px',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
                                            <span style={{
                                                background: colors.bg,
                                                border: `1px solid ${colors.border}`,
                                                borderRadius: '6px',
                                                color: colors.text,
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                textTransform: 'uppercase',
                                            }}>
                                                Tier {tier}
                                            </span>
                                            <span style={{ color: '#FAFAFA', fontSize: '22px', fontWeight: 700 }}>{c.count}</span>
                                            <span style={{ color: '#71717A', fontSize: '13px' }}>messages today</span>
                                        </div>
                                        <div style={{ color: '#52525B', fontFamily: 'monospace', fontSize: '11px', marginTop: '4px', wordBreak: 'break-all' }}>
                                            {c.key}
                                        </div>
                                    </div>
                                    <div style={{ alignItems: 'flex-end', display: 'flex', flexDirection: 'column', flexShrink: 0, gap: '6px' }}>
                                        <span style={{ color: '#71717A', fontSize: '12px' }}>TTL: {formatTTL(c.ttlSeconds)}</span>
                                        <button
                                            disabled={resetting === tier}
                                            onClick={() => reset(tier)}
                                            style={{
                                                ...btnBase,
                                                background: 'rgba(239,68,68,0.08)',
                                                border: '1px solid rgba(239,68,68,0.15)',
                                                color: '#F87171',
                                                fontSize: '11px',
                                                padding: '5px 12px',
                                            }}
                                            type="button"
                                        >
                                            {resetting === tier ? '…' : 'Reset'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Toast notification */}
            {toast && (
                <div style={{
                    background: toast.ok ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${toast.ok ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: '10px',
                    bottom: 0,
                    color: toast.ok ? '#34D399' : '#F87171',
                    fontSize: '13px',
                    fontWeight: 500,
                    left: 0,
                    margin: '16px',
                    padding: '10px 16px',
                    position: 'absolute',
                    right: 0,
                }}>
                    {toast.ok ? '✅' : '❌'} {toast.msg}
                </div>
            )}
        </div>
    );
}
