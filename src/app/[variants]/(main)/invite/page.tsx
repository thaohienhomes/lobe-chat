'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const SOCIAL_PLATFORMS = [
    {
        color: '#1877F2',
        href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        icon: '📘',
        label: 'Facebook',
    },
    {
        color: '#1DA1F2',
        href: (url: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent('Thử ngay Phở Chat — AI cá nhân ngon nhất Việt Nam! Hỗ trợ Gemini, GPT-4, Claude và nhiều hơn nữa.')}&url=${encodeURIComponent(url)}`,
        icon: '🐦',
        label: 'Twitter/X',
    },
    {
        color: '#0A66C2',
        href: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        icon: '💼',
        label: 'LinkedIn',
    },
];

export default function InvitePage() {
    const [inviteUrl, setInviteUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/invite')
            .then(r => r.json())
            .then(d => {
                if (d.inviteUrl) setInviteUrl(d.inviteUrl);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleCopy = () => {
        if (!inviteUrl) return;
        navigator.clipboard.writeText(inviteUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    return (
        <div style={{ color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '40px', margin: '0 auto', maxWidth: '700px', padding: '48px 20px', textAlign: 'center' }}>
            {/* Hero */}
            <div>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎁</div>
                <h1 style={{
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    background: 'linear-gradient(to right, #ffffff, #a1a1aa)',
                    fontSize: 'clamp(24px, 5vw, 40px)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    margin: '0 0 12px',
                }}>
                    Mời bạn bè, nhận thêm Points
                </h1>
                <p style={{ color: '#A1A1AA', fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
                    Chia sẻ Phở Chat với bạn bè và đồng nghiệp. Mỗi người bạn mời sẽ giúp chúng ta cùng xây dựng cộng đồng AI tốt nhất Việt Nam.
                </p>
            </div>

            {/* Benefits */}
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                {[
                    { color: '#34D399', desc: 'Khi bạn bè đăng ký thành công', icon: '✅', title: 'Bonus Points sắp ra mắt' },
                    { color: '#A78BFA', desc: 'Không giới hạn số người mời', icon: '♾️', title: 'Không giới hạn' },
                    { color: '#FBBF24', desc: 'Link mời dẫn về pho.chat', icon: '🔗', title: 'Link riêng của bạn' },
                ].map(b => (
                    <div key={b.title} style={{
                        backdropFilter: 'blur(16px)',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '14px',
                        padding: '20px',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>{b.icon}</div>
                        <div style={{ color: b.color, fontWeight: 700, marginBottom: '4px' }}>{b.title}</div>
                        <div style={{ color: '#71717A', fontSize: '12px' }}>{b.desc}</div>
                    </div>
                ))}
            </div>

            {/* Invite Link Box */}
            <div style={{
                backdropFilter: 'blur(24px)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '28px',
            }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>🔗 Link mời của bạn</h2>

                {loading ? (
                    <div style={{ color: '#71717A', padding: '16px' }}>Đang tải...</div>
                ) : inviteUrl ? (
                    <>
                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px',
                            color: '#A78BFA',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            marginBottom: '16px',
                            overflowX: 'auto',
                            padding: '14px 16px',
                            textAlign: 'left',
                            userSelect: 'all',
                            whiteSpace: 'nowrap',
                        }}>
                            {inviteUrl}
                        </div>
                        <button
                            onClick={handleCopy}
                            style={{
                                background: copied
                                    ? 'linear-gradient(135deg, #10B981, #059669)'
                                    : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                                border: 'none',
                                borderRadius: '10px',
                                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: 600,
                                padding: '12px 32px',
                                transition: 'all 0.2s',
                                width: '100%',
                            }}
                            type="button"
                        >
                            {copied ? '✅ Đã sao chép!' : '📋 Sao chép link'}
                        </button>
                    </>
                ) : (
                    <div style={{ color: '#71717A', padding: '16px' }}>
                        <Link href="/login" style={{ color: '#A78BFA' }}>Đăng nhập</Link> để lấy link mời của bạn.
                    </div>
                )}
            </div>

            {/* Social Share */}
            {inviteUrl && (
                <div>
                    <h2 style={{ color: '#A1A1AA', fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', margin: '0 0 16px', textTransform: 'uppercase' }}>
                        Chia sẻ lên mạng xã hội
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                        {SOCIAL_PLATFORMS.map(platform => (
                            <a
                                href={platform.href(inviteUrl)}
                                key={platform.label}
                                rel="noopener noreferrer"
                                style={{
                                    alignItems: 'center',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '12px',
                                    color: '#E2E8F0',
                                    display: 'flex',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    gap: '8px',
                                    padding: '12px 20px',
                                    textDecoration: 'none',
                                    transition: 'background 0.2s',
                                }}
                                target="_blank"
                            >
                                {platform.icon} {platform.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Back link */}
            <Link href="/" style={{ color: '#71717A', fontSize: '14px', textDecoration: 'none' }}>
                ← Quay về trang chủ
            </Link>
        </div>
    );
}
