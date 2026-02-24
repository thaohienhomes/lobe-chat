import Link from 'next/link';

import { getServerDB } from '@/database/server';

// Model catalog – all models available on pho.chat
const MODEL_CATALOG = [
    // Tier 1 – Budget (5 pts/msg)
    {
        category: 'Tier 1 — Budget',
        color: '#34D399',
        costPer: 5,
        models: [
            { desc: `Google's fastest multimodal model. Great for everyday tasks, coding, and writing.`, icon: '🔷', name: 'Gemini 2.0 Flash', provider: 'Google Vertex AI' },
            { desc: 'Ultra-fast, cost-effective chat and code assistant from DeepSeek.', icon: '🧠', name: 'DeepSeek V3', provider: 'Vercel AI Gateway' },
            { desc: `Meta's lightweight Llama model for fast responses.`, icon: '🦙', name: 'Llama 4 Scout 17B', provider: 'Groq' },
            { desc: `Mistral's multilingual model with strong instruction following.`, icon: '🌊', name: 'Mistral Saba 24B', provider: 'Groq' },
            { desc: 'Cerebras ultra-fast 8B model via LPU inference chips.', icon: '⚡', name: 'Llama 3.1 8B (Cerebras)', provider: 'Cerebras' },
        ],
    },
    // Tier 2 – Standard (150 pts/msg)
    {
        category: 'Tier 2 — Standard',
        color: '#A78BFA',
        costPer: 150,
        models: [
            { desc: `Google's flagship Gemini 3 Pro — best reasoning and multimodal capabilities.`, icon: '🔷', name: 'Gemini 3 Flash', provider: 'Google Vertex AI' },
            { desc: `OpenAI's most capable general-purpose model.`, icon: '🟢', name: 'GPT-4.1', provider: 'Vercel AI Gateway' },
            { desc: `Anthropic's top conversational AI — excellent for nuanced writing.`, icon: '🟠', name: 'Claude Sonnet 4.5', provider: 'Vercel AI Gateway' },
            { desc: `DeepSeek's powerful reasoning model — top-tier for complex problems.`, icon: '🧠', name: 'DeepSeek R1', provider: 'Vercel AI Gateway' },
            { desc: `Meta's large Llama 4 with huge 128K context.`, icon: '🦙', name: 'Llama 4 Maverick 17B', provider: 'Groq' },
        ],
    },
    // Tier 3 – Premium (1000 pts/msg)
    {
        category: 'Tier 3 — Premium',
        color: '#FBBF24',
        costPer: 1000,
        models: [
            { desc: `Google's most powerful Gemini model for ultra-complex tasks and research.`, icon: '🔷', name: 'Gemini 3 Pro Preview', provider: 'Google Vertex AI' },
            { desc: `OpenAI's top reasoning model with extended thinking time.`, icon: '🟢', name: 'GPT-5.2', provider: 'Vercel AI Gateway' },
            { desc: 'OpenAI o3-mini — advanced math and science reasoning.', icon: '🟢', name: 'o3-mini', provider: 'Vercel AI Gateway' },
        ],
    },
];

const PROVIDER_ICONS: Record<string, string> = {
    'Cerebras': '⚡',
    'Google Vertex AI': '🔷',
    'Groq': '🏎️',
    'Vercel AI Gateway': '▲',
};

export const metadata = {
    description: 'Browse all AI models available on Phở Chat — Gemini, GPT-4.1, Claude Sonnet, DeepSeek, and more with Phở Points pricing.',
    title: 'AI Models — Phở Chat',
};

export default async function ModelsPage() {
    // Optionally fetch total model usage count for social proof
    let totalUsageCount = 0;
    try {
        const db = await getServerDB();
        const { usageLogs } = await import('@/database/schemas') as any;
        const { sql } = await import('drizzle-orm');
        const [result] = await db.select({ cnt: sql`COUNT(*)` }).from(usageLogs);
        totalUsageCount = Number(result?.cnt || 0);
    } catch { totalUsageCount = 0; }

    const allModelCount = MODEL_CATALOG.reduce((a, c) => a + c.models.length, 0);

    return (
        <div style={{ color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '48px', margin: '0 auto', maxWidth: '1100px', padding: '48px 20px' }}>
            {/* Hero */}
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
                <h1 style={{
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    background: 'linear-gradient(to right, #ffffff, #a1a1aa)',
                    fontSize: 'clamp(28px, 5vw, 48px)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    margin: '0 0 16px',
                }}>
                    {allModelCount} AI Models, One Platform
                </h1>
                <p style={{ color: '#A1A1AA', fontSize: '18px', margin: '0 0 24px' }}>
                    Access the world&apos;s best AI models through Phở Chat&apos;s multi-provider infrastructure.
                    {totalUsageCount > 0 && ` Over ${totalUsageCount.toLocaleString()} messages processed.`}
                </p>
                <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                    <Link href="/" style={{
                        background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                        color: '#fff',
                        fontWeight: 600,
                        padding: '12px 28px',
                        textDecoration: 'none',
                    }}>
                        Start chatting →
                    </Link>
                    <Link href="/settings/subscription" style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#E2E8F0',
                        fontWeight: 600,
                        padding: '12px 28px',
                        textDecoration: 'none',
                    }}>
                        View Plans
                    </Link>
                </div>
            </div>

            {/* Provider badges */}
            <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                {Object.entries(PROVIDER_ICONS).map(([name, icon]) => (
                    <span key={name} style={{
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        color: '#A1A1AA',
                        display: 'inline-flex',
                        fontSize: '13px',
                        fontWeight: 500,
                        gap: '8px',
                        padding: '8px 16px',
                    }}>
                        {icon} {name}
                    </span>
                ))}
            </div>

            {/* Tier Sections */}
            {MODEL_CATALOG.map(tier => (
                <div key={tier.category}>
                    <div style={{ alignItems: 'center', display: 'flex', gap: '16px', marginBottom: '20px' }}>
                        <h2 style={{ color: tier.color, fontSize: '20px', fontWeight: 700, margin: 0 }}>
                            {tier.category}
                        </h2>
                        <span style={{
                            background: `${tier.color}15`,
                            border: `1px solid ${tier.color}30`,
                            borderRadius: '20px',
                            color: tier.color,
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '3px 12px',
                        }}>
                            {tier.costPer} pts / message
                        </span>
                    </div>

                    <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                        {tier.models.map(model => (
                            <div key={model.name} style={{
                                backdropFilter: 'blur(24px)',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                padding: '20px',
                                transition: 'border-color 0.2s',
                            }}>
                                <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
                                    <span style={{
                                        alignItems: 'center',
                                        background: `${tier.color}15`,
                                        border: `1px solid ${tier.color}25`,
                                        borderRadius: '10px',
                                        display: 'flex',
                                        fontSize: '22px',
                                        height: '44px',
                                        justifyContent: 'center',
                                        width: '44px',
                                    }}>
                                        {model.icon}
                                    </span>
                                    <div>
                                        <h3 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 700, margin: 0 }}>{model.name}</h3>
                                        <span style={{ color: '#71717A', fontSize: '12px' }}>via {model.provider}</span>
                                    </div>
                                </div>
                                <p style={{ color: '#A1A1AA', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>{model.desc}</p>
                                <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{
                                        background: `${tier.color}10`,
                                        border: `1px solid ${tier.color}25`,
                                        borderRadius: '6px',
                                        color: tier.color,
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '3px 8px',
                                    }}>
                                        {tier.costPer} pts/msg
                                    </span>
                                    <span style={{ color: '#52525B', fontSize: '11px' }}>{PROVIDER_ICONS[model.provider] || ''} {model.provider}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Resilience callout */}
            <div style={{
                backdropFilter: 'blur(24px)',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%)',
                border: '1px solid rgba(124, 58, 237, 0.15)',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'center',
            }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px' }}>🛡️ 100% Uptime Architecture</h3>
                <p style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: 1.6, margin: '0 0 20px' }}>
                    Phở Chat uses a multi-provider redundancy system. If Google Vertex AI is unavailable,
                    requests automatically route through Vercel AI Gateway — ensuring zero downtime
                    for your conversations.
                </p>
                <Link href="/" style={{
                    background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                    borderRadius: '10px',
                    color: '#fff',
                    display: 'inline-block',
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: '10px 24px',
                    textDecoration: 'none',
                }}>
                    Try it free today
                </Link>
            </div>
        </div>
    );
}
