import Link from 'next/link';

import { getServerDB } from '@/database/server';

export const metadata = {
    description: 'Track your referral conversions and affiliate earnings on Phở Chat.',
    title: 'Affiliate Dashboard — Phở Chat',
};

const cardStyle = {
    backdropFilter: 'blur(24px)',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    padding: '24px',
};

export default async function AffiliatePage() {
    // Get the currently logged-in user's referral stats
    let referralCount = 0;
    let earnedPoints = 0;

    try {
        const { auth } = await import('@clerk/nextjs/server');
        const { userId: clerkUserId } = await auth();

        if (clerkUserId) {
            // Future: query actual referral_conversions table
            // For now, show placeholder stats
            referralCount = 0;
            earnedPoints = 0;
        }
    } catch {
        // Ignore auth errors, show empty state
    }

    return (
        <div style={{ color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '32px', margin: '0 auto', maxWidth: '900px', padding: '48px 20px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤝</div>
                <h1 style={{
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    background: 'linear-gradient(to right, #ffffff, #a1a1aa)',
                    fontSize: 'clamp(24px, 5vw, 36px)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    margin: '0 0 8px',
                }}>
                    Affiliate Dashboard
                </h1>
                <p style={{ color: '#A1A1AA', fontSize: '15px' }}>
                    Track your referral performance and earn Phở Points for every signup.
                </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {[
                    { color: '#A78BFA', icon: '👥', label: 'Total Referrals', value: referralCount.toString() },
                    { color: '#34D399', icon: '🎁', label: 'Points Earned', value: earnedPoints.toLocaleString() },
                    { color: '#FBBF24', icon: '📈', label: 'Conversion Rate', value: '—' },
                    { color: '#38BDF8', icon: '💰', label: 'This Month', value: '0' },
                ].map(stat => (
                    <div key={stat.label} style={{ ...cardStyle }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
                        <span style={{ color: '#71717A', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</span>
                        <div style={{ color: stat.color, fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '4px' }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* How It Works */}
            <div style={{ ...cardStyle, padding: '0' }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>📋 How It Works</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0', padding: '16px 24px' }}>
                    {[
                        { desc: 'Get your unique referral link from the /invite page', icon: '1️⃣', title: 'Share your link' },
                        { desc: 'When someone signs up using your link, we track the conversion', icon: '2️⃣', title: 'They sign up' },
                        { desc: 'Both you and your friend receive bonus Phở Points', icon: '3️⃣', title: 'Earn rewards' },
                    ].map(step => (
                        <div key={step.title} style={{ alignItems: 'flex-start', display: 'flex', gap: '16px', padding: '14px 0' }}>
                            <span style={{ fontSize: '24px', flexShrink: 0 }}>{step.icon}</span>
                            <div>
                                <div style={{ fontWeight: 700, marginBottom: '2px' }}>{step.title}</div>
                                <div style={{ color: '#71717A', fontSize: '13px' }}>{step.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center' }}>
                <Link
                    href="/invite"
                    style={{
                        background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                        color: '#fff',
                        display: 'inline-block',
                        fontSize: '15px',
                        fontWeight: 600,
                        padding: '14px 32px',
                        textDecoration: 'none',
                    }}
                >
                    Get your invite link →
                </Link>
            </div>
        </div>
    );
}
