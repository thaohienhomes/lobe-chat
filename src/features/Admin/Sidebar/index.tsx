'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Banknote, Cpu, History, LayoutDashboard, Menu, Settings, Ticket, Users, Webhook, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
    { href: '/admin/users', icon: Users, label: 'Users & CRM' },
    { href: '/admin/revenue', icon: Banknote, label: 'Revenue' },
    { href: '/admin/health', icon: Activity, label: 'Health Radar' },
    { href: '/admin/providers', icon: Cpu, label: 'AI Providers' },
    { href: '/admin/tickets', icon: Ticket, label: 'Support Tickets' },
    { href: '/admin/webhooks', icon: Webhook, label: 'Webhooks' },
    { href: '/admin/activity', icon: History, label: 'Activity Log' },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anomalyCount, setAnomalyCount] = useState(0);

    useEffect(() => {
        fetch('/api/admin/anomaly-count')
            .then(r => r.json())
            .then(d => setAnomalyCount(d.count || 0))
            .catch(() => { });
    }, []);

    // Strip variant prefix to get the clean path for matching
    const cleanPath = pathname?.replace(/^\/[^/]+/, '') || '';

    const sidebarContent = (
        <>
            {/* Header */}
            <div
                style={{
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    height: 72,
                    justifyContent: 'space-between',
                    padding: '0 24px',
                }}
            >
                <Link href="/admin" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
                        <div style={{
                            alignItems: 'center',
                            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                            display: 'flex',
                            height: '28px',
                            justifyContent: 'center',
                            width: '28px'
                        }} />
                        <span
                            style={{
                                color: '#FFFFFF',
                                fontSize: 16,
                                fontWeight: 700,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Mission Control
                        </span>
                    </div>
                </Link>
                {/* Mobile close button */}
                <button
                    className="md:hidden"
                    onClick={() => setMobileOpen(false)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.5)',
                        cursor: 'pointer',
                        padding: '4px',
                    }}
                    type="button"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Navigation */}
            <nav style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '4px', overflowY: 'auto', padding: '24px 16px' }}>
                <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '8px', textTransform: 'uppercase' }}>
                    Core Systems
                </p>
                {navItems.map((item) => {
                    const isActive =
                        cleanPath === item.href || (item.href !== '/admin' && cleanPath.startsWith(item.href));
                    return (
                        <Link
                            href={item.href}
                            key={item.href}
                            onClick={() => setMobileOpen(false)}
                            style={{
                                alignItems: 'center',
                                background: isActive ? 'linear-gradient(90deg, rgba(79, 70, 229, 0.15) 0%, rgba(124, 58, 237, 0.05) 100%)' : 'transparent',
                                border: isActive ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid transparent',
                                borderRadius: 10,
                                boxShadow: isActive ? 'inset 2px 0 0 #7C3AED' : 'none',
                                color: isActive
                                    ? '#E2E8F0'
                                    : 'rgba(255, 255, 255, 0.55)',
                                display: 'flex',
                                fontSize: 14,
                                fontWeight: isActive ? 500 : 400,
                                gap: 12,
                                padding: '10px 14px',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <item.icon size={18} style={{ color: isActive ? '#A78BFA' : 'inherit' }} />
                            {item.label}
                            {/* Anomaly badge on Health Radar */}
                            {item.href === '/admin/health' && anomalyCount > 0 && (
                                <span style={{
                                    alignItems: 'center',
                                    animation: 'pulse 2s ease-in-out infinite',
                                    background: '#EF4444',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    display: 'inline-flex',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    justifyContent: 'center',
                                    marginLeft: 'auto',
                                    minWidth: '18px',
                                    padding: '1px 5px',
                                }}>
                                    {anomalyCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)', padding: '16px 16px 24px' }}>
                <Link
                    className="hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
                    href="/"
                    style={{
                        alignItems: 'center',
                        borderRadius: 10,
                        color: 'rgba(255, 255, 255, 0.55)',
                        display: 'flex',
                        fontSize: 14,
                        gap: 12,
                        padding: '10px 14px',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <Settings size={18} />
                    Exit Mission Control
                </Link>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile hamburger */}
            <button
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
                style={{
                    alignItems: 'center',
                    backdropFilter: 'blur(12px)',
                    background: 'rgba(18, 18, 24, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    height: '44px',
                    justifyContent: 'center',
                    left: '16px',
                    position: 'fixed',
                    top: '16px',
                    width: '44px',
                    zIndex: 60,
                }}
                type="button"
            >
                <Menu size={20} />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="md:hidden"
                    onClick={() => setMobileOpen(false)}
                    style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        inset: 0,
                        position: 'fixed',
                        zIndex: 49,
                    }}
                />
            )}

            {/* Desktop sidebar (always visible) */}
            <aside
                className="hidden md:flex"
                style={{
                    backdropFilter: 'blur(24px)',
                    background: 'rgba(18, 18, 24, 0.65)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                    flexDirection: 'column',
                    height: '100vh',
                    left: 0,
                    position: 'fixed',
                    top: 0,
                    width: 260,
                    zIndex: 50,
                }}
            >
                {sidebarContent}
            </aside>

            {/* Mobile sidebar (slide in) */}
            <aside
                className="md:hidden"
                style={{
                    backdropFilter: 'blur(24px)',
                    background: 'rgba(18, 18, 24, 0.95)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    left: 0,
                    position: 'fixed',
                    top: 0,
                    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s ease',
                    width: 280,
                    zIndex: 51,
                }}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
