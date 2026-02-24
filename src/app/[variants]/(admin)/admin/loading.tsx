export default function AdminLoading() {
    const shimmer = {
        animation: 'shimmer 1.5s ease-in-out infinite',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%)',
        backgroundSize: '200% 100%',
        borderRadius: '12px',
    };

    return (
        <>
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', margin: '0 auto', maxWidth: '1200px' }}>
                {/* Header skeleton */}
                <div>
                    <div style={{ ...shimmer, height: '36px', marginBottom: '12px', width: '200px' }} />
                    <div style={{ ...shimmer, height: '18px', width: '360px' }} />
                </div>

                {/* Stat cards skeleton */}
                <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '16px',
                            padding: '24px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <div style={{ ...shimmer, height: '16px', width: '100px' }} />
                                <div style={{ ...shimmer, borderRadius: '8px', height: '36px', width: '36px' }} />
                            </div>
                            <div style={{ ...shimmer, height: '40px', marginBottom: '12px', width: '120px' }} />
                            <div style={{ ...shimmer, height: '14px', width: '160px' }} />
                        </div>
                    ))}
                </div>

                {/* Navigation skeleton */}
                <div>
                    <div style={{ ...shimmer, height: '24px', marginBottom: '20px', width: '180px' }} />
                    <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={{
                                alignItems: 'center',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '16px',
                                display: 'flex',
                                gap: '16px',
                                padding: '20px',
                            }}>
                                <div style={{ ...shimmer, borderRadius: '12px', height: '48px', width: '48px' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ ...shimmer, height: '16px', marginBottom: '8px', width: '100px' }} />
                                    <div style={{ ...shimmer, height: '12px', width: '140px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
