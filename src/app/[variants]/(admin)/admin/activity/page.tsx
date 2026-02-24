import { and, desc, eq } from 'drizzle-orm';

import { adminAuditLogs, users } from '@/database/schemas';
import { getServerDB } from '@/database/server';
import { AutoRefresh } from '@/features/Admin/AutoRefresh';

// All known action types for the filter dropdown
const KNOWN_ACTIONS = [
    'ADD_PHO_POINTS',
    'CHANGE_PLAN',
    'UPDATE_PROVIDER_BALANCE',
    'SYNC_SUBSCRIPTION',
    'RESET_USER',
    'BULK_TOPUP',
    'BULK_RESET',
];

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
};

interface PageProps {
    searchParams?: Promise<{ action?: string; adminId?: string }>;
}

export default async function AdminActivityPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const actionFilter = params?.action;

    const db = await getServerDB();

    const conditions = [];
    // Item 8: Validate filter against whitelist to prevent SQL injection via ilike patterns
    if (actionFilter && KNOWN_ACTIONS.includes(actionFilter)) {
        conditions.push(eq(adminAuditLogs.action, actionFilter));
    }

    const logs = await db
        .select({
            action: adminAuditLogs.action,
            adminEmail: users.email,
            createdAt: adminAuditLogs.createdAt,
            details: adminAuditLogs.details,
            id: adminAuditLogs.id,
            targetId: adminAuditLogs.targetId,
            targetType: adminAuditLogs.targetType,
        })
        .from(adminAuditLogs)
        .leftJoin(users, eq(adminAuditLogs.adminId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(adminAuditLogs.createdAt))
        .limit(100);

    return (
        <div style={{ color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '32px', margin: '0 auto', maxWidth: '1200px' }}>
            {/* Header */}
            <div>
                <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
                    <h1 style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
                        Activity Log
                    </h1>
                    <AutoRefresh />
                </div>
                <p style={{ color: '#A1A1AA', fontSize: '15px', marginTop: '8px' }}>
                    Tracking all administrative actions taken within Mission Control.
                </p>
            </div>

            {/* Filters (12E) */}
            <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ color: '#A1A1AA', fontSize: '13px' }}>Filter by action:</span>
                <a
                    href="/admin/activity"
                    style={{
                        background: !actionFilter ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: !actionFilter ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '20px',
                        color: !actionFilter ? '#A78BFA' : '#A1A1AA',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '4px 12px',
                        textDecoration: 'none',
                    }}
                >
                    All
                </a>
                {KNOWN_ACTIONS.map(action => (
                    <a
                        href={`/admin/activity?action=${action}`}
                        key={action}
                        style={{
                            background: actionFilter === action ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255,255,255,0.05)',
                            border: actionFilter === action ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '20px',
                            color: actionFilter === action ? '#A78BFA' : '#A1A1AA',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 12px',
                            textDecoration: 'none',
                        }}
                    >
                        {action}
                    </a>
                ))}
            </div>

            {/* Logs Table */}
            <div style={{ ...cardStyle, padding: 0 }}>
                <div style={{ alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', padding: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                        Recent Actions
                        {actionFilter && (
                            <span style={{ color: '#A78BFA', fontSize: '14px', fontWeight: 400, marginLeft: '10px' }}>
                                — filtered by: {actionFilter}
                            </span>
                        )}
                    </h2>
                    <span style={{ color: '#71717A', fontSize: '13px' }}>{logs.length} records</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', textAlign: 'left', width: '100%' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#A1A1AA', fontSize: '13px', textTransform: 'uppercase' }}>
                                <th style={{ fontWeight: 600, padding: '16px 24px' }}>Date</th>
                                <th style={{ fontWeight: 600, padding: '16px 24px' }}>Admin</th>
                                <th style={{ fontWeight: 600, padding: '16px 24px' }}>Action</th>
                                <th style={{ fontWeight: 600, padding: '16px 24px' }}>Target</th>
                                <th style={{ fontWeight: 600, padding: '16px 24px' }}>Details</th>
                            </tr>
                        </thead>
                        <tbody style={{ fontSize: '14px' }}>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ color: '#71717A', padding: '40px', textAlign: 'center' }}>
                                        {actionFilter ? `No logs found for action: "${actionFilter}"` : 'No activity logs found.'}
                                    </td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr className="hover:bg-[rgba(255,255,255,0.02)] transition-colors" key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ color: '#71717A', padding: '16px 24px', whiteSpace: 'nowrap' }}>
                                        {log.createdAt ? log.createdAt.toLocaleString('vi-VN') : 'N/A'}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        {log.adminEmail || 'Unknown'}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{
                                            background: 'rgba(124, 58, 237, 0.15)',
                                            border: '1px solid rgba(124, 58, 237, 0.3)',
                                            borderRadius: '6px',
                                            color: '#A78BFA',
                                            fontSize: '12px',
                                            padding: '4px 8px'
                                        }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ color: '#E2E8F0' }}>{log.targetId}</span>
                                            <span style={{ color: '#71717A', fontSize: '12px' }}>{log.targetType}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        {log.details && (
                                            <details>
                                                <summary style={{ color: '#A78BFA', cursor: 'pointer', fontSize: '12px' }}>
                                                    View details
                                                </summary>
                                                <pre style={{
                                                    background: 'rgba(0,0,0,0.3)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    borderRadius: '6px',
                                                    color: '#A1A1AA',
                                                    fontSize: '11px',
                                                    margin: '6px 0 0',
                                                    maxWidth: '300px',
                                                    overflow: 'auto',
                                                    padding: '8px',
                                                    whiteSpace: 'pre-wrap'
                                                }}>
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
