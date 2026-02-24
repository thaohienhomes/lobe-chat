'use client';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div style={{
            alignItems: 'center',
            color: '#FAFAFA',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
        }}>
            <div style={{
                alignItems: 'center',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                fontSize: '36px',
                height: '80px',
                justifyContent: 'center',
                width: '80px',
            }}>
                💥
            </div>
            <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px' }}>Something went wrong</h2>
                <p style={{ color: '#A1A1AA', fontSize: '14px', margin: '0 auto', maxWidth: '400px' }}>
                    {error.message || 'An unexpected error occurred while loading this page.'}
                </p>
                {error.digest && (
                    <p style={{ color: '#71717A', fontFamily: 'monospace', fontSize: '11px', marginTop: '8px' }}>
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
            <button
                onClick={reset}
                style={{
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    border: '1px solid rgba(124, 58, 237, 0.5)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    fontSize: '14px',
                    fontWeight: 600,
                    gap: '8px',
                    padding: '10px 24px',
                    transition: 'all 0.2s ease',
                }}
                type="button"
            >
                ↻ Try Again
            </button>
        </div>
    );
}
