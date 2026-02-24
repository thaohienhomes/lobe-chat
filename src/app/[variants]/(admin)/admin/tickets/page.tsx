import { and, desc, eq } from 'drizzle-orm';
import Link from 'next/link';

import { supportTickets, users } from '@/database/schemas';
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

const priorityStyles: Record<string, any> = {
    high: { bg: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.2)', text: '#FB923C' },
    low: { bg: 'rgba(161, 161, 170, 0.15)', border: 'rgba(161, 161, 170, 0.2)', text: '#A1A1AA' },
    medium: { bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.2)', text: '#38BDF8' },
    urgent: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#FCA5A5' },
};

const statusStyles: Record<string, any> = {
    closed: { bg: 'rgba(161, 161, 170, 0.15)', border: 'rgba(161, 161, 170, 0.2)', text: '#A1A1AA' },
    in_progress: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.2)', text: '#FDE047' },
    open: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.2)', text: '#34D399' },
    resolved: { bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.2)', text: '#34D399' },
};

const filterChipBase = {
    alignItems: 'center',
    borderRadius: '20px',
    display: 'inline-flex',
    fontSize: '12px',
    fontWeight: 600,
    padding: '6px 14px',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
};

export default async function AdminTicketsPage({
    searchParams,
}: {
    searchParams: { priority?: string, status?: string; };
}) {
    const db = await getServerDB();

    const filterStatus = searchParams?.status || 'all';
    const filterPriority = searchParams?.priority || 'all';

    // Build conditions
    const conditions = [];
    if (filterStatus !== 'all') {
        conditions.push(eq(supportTickets.status, filterStatus));
    }
    if (filterPriority !== 'all') {
        conditions.push(eq(supportTickets.priority, filterPriority));
    }

    const tickets = await db
        .select({
            createdAt: supportTickets.createdAt,
            description: supportTickets.description,
            id: supportTickets.id,
            priority: supportTickets.priority,
            source: supportTickets.source,
            status: supportTickets.status,
            subject: supportTickets.subject,
            transcript: supportTickets.transcript,
            userEmail: users.email,
            userId: supportTickets.userId,
            userName: users.fullName,
        })
        .from(supportTickets)
        .leftJoin(users, eq(supportTickets.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(supportTickets.createdAt))
        .limit(50);

    const statusFilters = ['all', 'open', 'in_progress', 'resolved', 'closed'];
    const priorityFilters = ['all', 'urgent', 'high', 'medium', 'low'];

    return (
        <div style={{ color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '32px', margin: '0 auto', maxWidth: '1200px' }}>
            <div>
                <h1 style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
                    Support Tickets
                </h1>
                <p style={{ color: '#A1A1AA', fontSize: '15px', marginTop: '8px' }}>
                    Tickets created by the AI Voice Agent when it escalates unresolved issues.
                </p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Status Filter */}
                <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ color: '#71717A', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', marginRight: '4px', textTransform: 'uppercase' }}>Status:</span>
                    {statusFilters.map(s => {
                        const isActive = filterStatus === s;
                        return (
                            <Link
                                className={isActive ? '' : 'hover:bg-[rgba(255,255,255,0.06)]'}
                                href={`/admin/tickets?status=${s}&priority=${filterPriority}`}
                                key={s}
                                style={{
                                    ...filterChipBase,
                                    background: isActive ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${isActive ? 'rgba(124, 58, 237, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                                    color: isActive ? '#D8B4FE' : '#A1A1AA',
                                }}
                            >
                                {s === 'all' ? 'All' : s.replace('_', ' ')}
                            </Link>
                        );
                    })}
                </div>
                {/* Priority Filter */}
                <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ color: '#71717A', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', marginRight: '4px', textTransform: 'uppercase' }}>Priority:</span>
                    {priorityFilters.map(p => {
                        const isActive = filterPriority === p;
                        const pColors = priorityStyles[p] || {};
                        return (
                            <Link
                                className={isActive ? '' : 'hover:bg-[rgba(255,255,255,0.06)]'}
                                href={`/admin/tickets?status=${filterStatus}&priority=${p}`}
                                key={p}
                                style={{
                                    ...filterChipBase,
                                    background: isActive ? (pColors.bg || 'rgba(124, 58, 237, 0.2)') : 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${isActive ? (pColors.border || 'rgba(124, 58, 237, 0.4)') : 'rgba(255, 255, 255, 0.08)'}`,
                                    color: isActive ? (pColors.text || '#D8B4FE') : '#A1A1AA',
                                }}
                            >
                                {p === 'all' ? 'All' : p}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Ticket Table */}
            <div style={{ ...cardStyle, border: '1px solid rgba(167, 139, 250, 0.15)' }}>
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', padding: '24px', position: 'relative' }}>
                    <div style={headerGlow('rgba(167, 139, 250, 1)')} />
                    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                        <h3 style={{ color: '#D8B4FE', fontSize: '18px', fontWeight: 600, margin: 0 }}>🎫 {filterStatus !== 'all' || filterPriority !== 'all' ? 'Filtered' : 'All'} Tickets</h3>
                        <span style={{ background: 'rgba(167, 139, 250, 0.15)', border: '1px solid rgba(167, 139, 250, 0.3)', borderRadius: '6px', color: '#D8B4FE', fontFamily: 'monospace', fontSize: '13px', padding: '4px 12px' }}>
                            {tickets.length} results
                        </span>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left', width: '100%' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Subject</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>User</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Priority</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Status</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Source</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ color: '#10B981', fontWeight: 500, padding: '48px', textAlign: 'center' }}>
                                        ✅ No matching tickets found.
                                    </td>
                                </tr>
                            ) : (
                                tickets.map(ticket => {
                                    const pStyle = priorityStyles[ticket.priority ?? 'medium'] || priorityStyles.medium;
                                    const sStyle = statusStyles[ticket.status ?? 'open'] || statusStyles.open;
                                    return (
                                        <tr className="hover:bg-[rgba(255,255,255,0.02)] transition-colors" key={ticket.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                            <td style={{ maxWidth: '300px', padding: '16px 24px' }}>
                                                <div style={{ color: '#FFFFFF', fontWeight: 600 }}>{ticket.subject}</div>
                                                <div style={{ color: '#71717A', fontSize: '12px', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {ticket.description}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                {ticket.userId ? (
                                                    <Link
                                                        className="hover:underline"
                                                        href={`/admin/users/${ticket.userId}`}
                                                        style={{ color: '#A78BFA', fontSize: '13px', textDecoration: 'none' }}
                                                    >
                                                        {ticket.userName || ticket.userEmail || ticket.userId}
                                                    </Link>
                                                ) : (
                                                    <span style={{ color: '#71717A', fontSize: '13px' }}>Anonymous</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{
                                                    background: pStyle.bg,
                                                    border: `1px solid ${pStyle.border}`,
                                                    borderRadius: '6px',
                                                    color: pStyle.text,
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    padding: '4px 10px',
                                                }}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{
                                                    alignItems: 'center',
                                                    background: sStyle.bg,
                                                    border: `1px solid ${sStyle.border}`,
                                                    borderRadius: '20px',
                                                    color: sStyle.text,
                                                    display: 'inline-flex',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    gap: '6px',
                                                    padding: '4px 10px',
                                                }}>
                                                    <span style={{ backgroundColor: sStyle.text, borderRadius: '50%', height: '6px', width: '6px' }} />
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '13px', padding: '16px 24px' }}>
                                                {ticket.source === 'voice' ? '🎙️ Voice' : ticket.source === 'chat' ? '💬 Chat' : '🔧 Manual'}
                                            </td>
                                            <td style={{ color: '#A1A1AA', fontSize: '13px', padding: '16px 24px', whiteSpace: 'nowrap' }}>
                                                {ticket.createdAt?.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
