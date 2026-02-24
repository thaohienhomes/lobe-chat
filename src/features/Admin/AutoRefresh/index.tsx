'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
    const router = useRouter();
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            // Only refresh if the document is visible to save resources
            if (document.visibilityState === 'visible') {
                router.refresh();
                setLastRefreshed(new Date());
            }
        }, intervalMs);

        return () => clearInterval(interval);
    }, [router, intervalMs]);

    return (
        <span style={{ alignItems: 'center', color: '#71717A', display: 'flex', fontSize: '11px', gap: '4px' }} title="Data auto-refreshes every 60 seconds">
            <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', backgroundColor: '#10B981', borderRadius: '50%', height: '6px', width: '6px' }} />
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
            Live (Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
        </span>
    );
}
