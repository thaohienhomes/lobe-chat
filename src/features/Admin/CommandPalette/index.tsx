'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

const pages = [
    { href: '/admin', keywords: ['overview', 'dashboard', 'home', 'tổng quan'], label: 'Overview' },
    { href: '/admin/users', keywords: ['users', 'crm', 'search', 'người dùng'], label: 'Users & CRM' },
    { href: '/admin/revenue', keywords: ['revenue', 'money', 'doanh thu', 'payment'], label: 'Revenue' },
    { href: '/admin/health', keywords: ['health', 'anomaly', 'bug', 'radar'], label: 'Health Radar' },
    { href: '/admin/tickets', keywords: ['tickets', 'support', 'voice', 'hỗ trợ'], label: 'Support Tickets' },
    { href: '/admin/providers', keywords: ['ai', 'provider', 'vertex', 'groq', 'model', 'balance', 'usage'], label: 'AI Providers' },
];

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (open) {
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Close on navigation
    useEffect(() => setOpen(false), [pathname]);

    const filtered = query.trim()
        ? pages.filter(p =>
            p.label.toLowerCase().includes(query.toLowerCase()) ||
            p.keywords.some(k => k.includes(query.toLowerCase()))
        )
        : pages;

    const handleSelect = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    if (!open) return null;

    return (
        <div style={{ alignItems: 'flex-start', display: 'flex', inset: 0, justifyContent: 'center', paddingTop: '20vh', position: 'fixed', zIndex: 100 }}>
            {/* Backdrop */}
            <div onClick={() => setOpen(false)} style={{ backdropFilter: 'blur(4px)', background: 'rgba(0, 0, 0, 0.6)', inset: 0, position: 'absolute' }} />

            {/* Dialog */}
            <div style={{
                backdropFilter: 'blur(24px)',
                background: 'rgba(18, 18, 24, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
                maxWidth: '520px',
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
                zIndex: 101,
            }}>
                {/* Search Input */}
                <div style={{ alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: '12px', padding: '16px 20px' }}>
                    <Search size={18} style={{ color: '#A1A1AA', flexShrink: 0 }} />
                    <input
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && filtered.length > 0) {
                                handleSelect(filtered[0].href);
                            }
                        }}
                        placeholder="Type a command or search..."
                        ref={inputRef}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#FFFFFF',
                            flex: 1,
                            fontSize: '15px',
                            outline: 'none',
                        }}
                        type="text"
                        value={query}
                    />
                    <kbd style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#71717A',
                        fontSize: '11px',
                        padding: '2px 6px',
                    }}>
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ color: '#71717A', fontSize: '14px', padding: '24px', textAlign: 'center' }}>
                            No results found
                        </div>
                    ) : (
                        filtered.map(page => (
                            <button
                                className="hover:bg-[rgba(124,58,237,0.15)]"
                                key={page.href}
                                onClick={() => handleSelect(page.href)}
                                style={{
                                    alignItems: 'center',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: '#E2E8F0',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    gap: '12px',
                                    padding: '10px 12px',
                                    textAlign: 'left',
                                    transition: 'all 0.15s ease',
                                    width: '100%',
                                }}
                                type="button"
                            >
                                <span style={{ color: '#A78BFA', fontFamily: 'monospace', fontSize: '13px' }}>→</span>
                                {page.label}
                            </button>
                        ))
                    )}
                </div>

                {/* Footer hint */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: '16px', justifyContent: 'center', padding: '10px 20px' }}>
                    <span style={{ color: '#71717A', fontSize: '11px' }}>↑↓ Navigate</span>
                    <span style={{ color: '#71717A', fontSize: '11px' }}>↵ Select</span>
                    <span style={{ color: '#71717A', fontSize: '11px' }}>Esc Close</span>
                </div>
            </div>
        </div>
    );
}

export function RefreshButton() {
    const router = useRouter();
    const [spinning, setSpinning] = useState(false);

    const handleRefresh = () => {
        setSpinning(true);
        router.refresh();
        setTimeout(() => setSpinning(false), 1000);
    };

    return (
        <button
            className="hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
            onClick={handleRefresh}
            style={{
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                color: '#A1A1AA',
                cursor: 'pointer',
                display: 'inline-flex',
                fontSize: '14px',
                gap: '6px',
                padding: '8px 14px',
                transition: 'all 0.2s ease',
            }}
            title="Refresh data"
            type="button"
        >
            <span style={{ display: 'inline-block', transform: spinning ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s ease' }}>↻</span>
            Refresh
        </button>
    );
}
