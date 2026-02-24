import { desc } from 'drizzle-orm';

import { webhookLogs } from '@/database/schemas';
import { getServerDB } from '@/database/server';
import { AutoRefresh } from '@/features/Admin/AutoRefresh';

const cardStyle = {
    backdropFilter: 'blur(24px)',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden' as const,
};

const STATUS_STYLES: Record<string, { bg: string; border: string; color: string; dot: string; label: string }> = {
    error: {
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.25)',
        color: '#F87171',
        dot: '#EF4444',
        label: 'Error',
    },
    ignored: {
        bg: 'rgba(113, 113, 122, 0.12)',
        border: 'rgba(113, 113, 122, 0.25)',
        color: '#A1A1AA',
        dot: '#71717A',
        label: 'Ignored',
    },
    received: {
        bg: 'rgba(234, 179, 8, 0.12)',
        border: 'rgba(234, 179, 8, 0.25)',
        color: '#FCD34D',
        dot: '#F59E0B',
        label: 'Received',
    },
    success: {
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.25)',
        color: '#34D399',
        dot: '#10B981',
        label: 'Success',
    },
};

const PROVIDER_STYLES: Record<string, { color: string; icon: string }> = {
    polar: { color: '#818CF8', icon: '🧲' },
    sepay: { color: '#38BDF8', icon: '💳' },
};

export default async function AdminWebhooksPage() {
    const db = await getServerDB();
    const logs = await db
        .select()
        .from(webhookLogs)
        .orderBy(desc(webhookLogs.createdAt))
        .limit(100);

    const total = logs.length;
    const successCount = logs.filter(l => l.status === 'success').length;
    const errorCount = logs.filter(l => l.status === 'error').length;

    return (
        <div style={{ color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '32px', margin: '0 auto', maxWidth: '1200px' }}>
            {/* Header */}
            <div>
                <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
                    <h1 style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
                        Webhook Logs
                    </h1>
                    <AutoRefresh />
                </div>
                <p style={{ color: '#A1A1AA', fontSize: '15px', marginTop: '8px' }}>
                    Real-time payment events from Sepay and Polar. Last 100 events shown.
                </p>
            </div>

            {/* Summary Stats */}
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {[
                    { color: '#38BDF8', label: 'Total Events', value: total },
                    { color: '#34D399', label: 'Successful', value: successCount },
                    { color: '#F87171', label: 'Errors', value: errorCount },
                ].map(stat => (
                    <div key={stat.label} style={{ ...cardStyle, padding: '20px 24px' }}>
                        <div style={{ color: '#71717A', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {stat.label}
                        </div>
                        <div style={{ color: stat.color, fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '8px' }}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Logs Table */}
            <div style={{ ...cardStyle, padding: 0 }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Recent Events</h2>
                </div>

                {logs.length === 0 ? (
                    <div style={{ color: '#71717A', fontSize: '14px', padding: '60px', textAlign: 'center' }}>
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>📭</div>
                        No webhook events recorded yet.
                        <div style={{ fontSize: '12px', marginTop: '8px' }}>Events will appear here when Sepay or Polar send payment notifications.</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', width: '100%' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#A1A1AA', fontSize: '11px', textTransform: 'uppercase' }}>
                                    <th style={{ fontWeight: 600, padding: '14px 24px' }}>Time</th>
                                    <th style={{ fontWeight: 600, padding: '14px 24px' }}>Provider</th>
                                    <th style={{ fontWeight: 600, padding: '14px 24px' }}>Event</th>
                                    <th style={{ fontWeight: 600, padding: '14px 24px' }}>Status</th>
                                    <th style={{ fontWeight: 600, padding: '14px 24px' }}>Order ID</th>
                                    <th style={{ fontWeight: 600, padding: '14px 24px' }}>Amount</th>
                                    <th style={{ fontWeight: 600, padding: '14px 24px' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    const statusStyle = STATUS_STYLES[log.status] || STATUS_STYLES.received;
                                    const providerStyle = PROVIDER_STYLES[log.provider] || { color: '#A1A1AA', icon: '📦' };

                                    return (
                                        <tr
                                            key={log.id}
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        >
                                            <td style={{ color: '#71717A', padding: '14px 24px', whiteSpace: 'nowrap' }}>
                                                {log.createdAt.toLocaleString('vi-VN', { day: '2-digit', hour: '2-digit', minute: '2-digit', month: '2-digit', second: '2-digit', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '14px 24px' }}>
                                                <span style={{
                                                    alignItems: 'center',
                                                    background: `${providerStyle.color}15`,
                                                    border: `1px solid ${providerStyle.color}30`,
                                                    borderRadius: '6px',
                                                    color: providerStyle.color,
                                                    display: 'inline-flex',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    gap: '6px',
                                                    padding: '3px 8px',
                                                    textTransform: 'uppercase',
                                                }}>
                                                    {providerStyle.icon} {log.provider}
                                                </span>
                                            </td>
                                            <td style={{ color: '#D4D4D8', fontFamily: 'monospace', fontSize: '12px', padding: '14px 24px' }}>
                                                {log.eventType}
                                            </td>
                                            <td style={{ padding: '14px 24px' }}>
                                                <span style={{
                                                    alignItems: 'center',
                                                    background: statusStyle.bg,
                                                    border: `1px solid ${statusStyle.border}`,
                                                    borderRadius: '20px',
                                                    color: statusStyle.color,
                                                    display: 'inline-flex',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    gap: '5px',
                                                    padding: '3px 10px',
                                                }}>
                                                    <span style={{ backgroundColor: statusStyle.dot, borderRadius: '50%', display: 'inline-block', flexShrink: 0, height: '6px', width: '6px' }} />
                                                    {statusStyle.label}
                                                </span>
                                                {log.errorMessage && (
                                                    <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.errorMessage}>
                                                        {log.errorMessage}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ color: '#A1A1AA', fontFamily: 'monospace', fontSize: '11px', padding: '14px 24px' }}>
                                                {log.orderId ? (
                                                    <span title={log.orderId}>
                                                        {log.orderId.length > 20 ? `${log.orderId.slice(0, 20)}…` : log.orderId}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td style={{ color: '#FBBF24', fontWeight: 600, padding: '14px 24px' }}>
                                                {log.amountUsd ? `$${log.amountUsd}` : '—'}
                                            </td>
                                            <td style={{ padding: '14px 24px' }}>
                                                {log.payload && (
                                                    <details style={{ cursor: 'pointer' }}>
                                                        <summary style={{ color: '#A78BFA', cursor: 'pointer', fontSize: '11px', userSelect: 'none' }}>
                                                            View payload
                                                        </summary>
                                                        <pre style={{
                                                            background: 'rgba(0,0,0,0.4)',
                                                            border: '1px solid rgba(255,255,255,0.06)',
                                                            borderRadius: '6px',
                                                            color: '#A1A1AA',
                                                            fontSize: '10px',
                                                            marginTop: '8px',
                                                            maxHeight: '200px',
                                                            maxWidth: '400px',
                                                            overflow: 'auto',
                                                            padding: '8px',
                                                            whiteSpace: 'pre-wrap',
                                                        }}>
                                                            {JSON.stringify(log.payload, null, 2)}
                                                        </pre>
                                                    </details>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
