import { desc, eq, ilike, or } from 'drizzle-orm';
import Link from 'next/link';

import { users } from '@/database/schemas';
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

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string } }) {
    const q = searchParams.q || '';
    const db = await getServerDB();

    let usersData;
    if (q) {
        usersData = await db
            .select()
            .from(users)
            .where(or(ilike(users.email, `%${q}%`), eq(users.id, q)))
            .orderBy(desc(users.createdAt))
            .limit(50);
    } else {
        usersData = await db
            .select()
            .from(users)
            .orderBy(desc(users.createdAt))
            .limit(50);
    }

    const planColors: Record<string, any> = {
        gl_starter: { bg: 'rgba(161, 161, 170, 0.15)', border: 'rgba(161, 161, 170, 0.2)', text: '#A1A1AA' },
        lifetime_early_bird: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.2)', text: '#FBBF24' },
        lifetime_standard: { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.2)', text: '#FB923C' },
        medical_beta: { bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.2)', text: '#A78BFA' },
        vn_free: { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.08)', text: '#A1A1AA' },
    };

    return (
        <div style={{ color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '32px', margin: '0 auto', maxWidth: '1200px' }}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
                        Users & CRM
                    </h1>
                    <p style={{ color: '#A1A1AA', fontSize: '15px', marginTop: '8px' }}>
                        Manage users, check points balance, and fix synchronization issues.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                        className="hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
                        href="/api/admin/export?type=users"
                        style={{
                            alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '10px',
                            color: '#A1A1AA',
                            display: 'inline-flex',
                            fontSize: '13px',
                            fontWeight: 500,
                            gap: '6px',
                            padding: '8px 14px',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        📥 Export Users
                    </a>
                    <a
                        className="hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
                        href="/api/admin/export?type=transactions"
                        style={{
                            alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '10px',
                            color: '#A1A1AA',
                            display: 'inline-flex',
                            fontSize: '13px',
                            fontWeight: 500,
                            gap: '6px',
                            padding: '8px 14px',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        📥 Export TXNs
                    </a>
                </div>
            </div>

            {/* Search Bar */}
            <form style={{ display: 'flex', gap: '12px' }}>
                <input
                    className="placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    defaultValue={q}
                    name="q"
                    placeholder="Search by exact email or User ID..."
                    style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        flex: 1,
                        fontSize: '15px',
                        height: '48px',
                        maxWidth: '480px',
                        padding: '0 16px',
                        transition: 'all 0.2s',
                    }}
                    type="text"
                />
                <button
                    style={{
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                        border: '1px solid rgba(124, 58, 237, 0.5)',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        fontSize: '15px',
                        fontWeight: 600,
                        height: '48px',
                        justifyContent: 'center',
                        padding: '0 24px',
                        transition: 'all 0.2s',
                    }}
                    type="submit"
                >
                    Search
                </button>
            </form>

            {/* Users Table */}
            <div style={{ ...cardStyle, padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left', width: '100%' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px', width: '35%' }}>Identity</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Plan Structure</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Status</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px' }}>Phở Points</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '16px 24px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ color: '#A1A1AA', padding: '48px', textAlign: 'center' }}>
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                usersData.map((user) => {
                                    const pId = user.currentPlanId || 'unknown';
                                    const pColors = planColors[pId] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)', text: '#A1A1AA' };
                                    const isStatusActive = user.subscriptionStatus === 'ACTIVE';

                                    return (
                                        <tr className="hover:bg-[rgba(255,255,255,0.02)] transition-colors" key={user.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
                                                    <div style={{
                                                        alignItems: 'center',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '50%',
                                                        color: '#fff',
                                                        display: 'flex',
                                                        fontSize: '16px',
                                                        fontWeight: 600,
                                                        height: '40px',
                                                        justifyContent: 'center',
                                                        width: '40px'
                                                    }}>
                                                        {(user.email || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 600 }}>{user.email || 'No Email'}</div>
                                                        <div style={{ color: '#71717A', fontFamily: 'monospace', fontSize: '12px', marginTop: '2px' }}>{user.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{
                                                    background: pColors.bg,
                                                    border: `1px solid ${pColors.border}`,
                                                    borderRadius: '8px',
                                                    color: pColors.text,
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    padding: '4px 10px'
                                                }}>
                                                    {user.currentPlanId}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{
                                                    alignItems: 'center',
                                                    background: isStatusActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(161, 161, 170, 0.15)',
                                                    border: `1px solid ${isStatusActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(161, 161, 170, 0.2)'}`,
                                                    borderRadius: '20px',
                                                    color: isStatusActive ? '#10B981' : '#A1A1AA',
                                                    display: 'inline-flex',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    gap: '6px',
                                                    padding: '4px 10px'
                                                }}>
                                                    <span style={{ backgroundColor: isStatusActive ? '#10B981' : '#A1A1AA', borderRadius: '50%', height: '6px', width: '6px' }} />
                                                    {user.subscriptionStatus}
                                                </span>
                                            </td>
                                            <td style={{ color: '#D4D4D8', fontFamily: 'monospace', fontSize: '15px', padding: '16px 24px' }}>
                                                {user.phoPointsBalance?.toLocaleString() || 0}
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                <Link
                                                    className="hover:bg-[rgba(255,255,255,0.1)]"
                                                    href={`/admin/users/${user.id}`}
                                                    style={{
                                                        alignItems: 'center',
                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        borderRadius: '8px',
                                                        color: '#E2E8F0',
                                                        display: 'inline-flex',
                                                        fontSize: '13px',
                                                        fontWeight: 500,
                                                        height: '32px',
                                                        justifyContent: 'center',
                                                        padding: '0 16px',
                                                        textDecoration: 'none',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                >
                                                    Manage
                                                </Link>
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
