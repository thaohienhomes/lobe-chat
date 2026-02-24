import { sql } from 'drizzle-orm';

import { usageLogs } from '@/database/schemas';
import { getServerDB } from '@/database/server';

import { BalanceEditor } from './BalanceEditor';

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

const hoverGlow = (color: string) => ({
    background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
    height: '100%',
    opacity: 0.15,
    pointerEvents: 'none' as const,
    position: 'absolute' as const,
    right: '-50%',
    top: '-50%',
    width: '100%',
});

// Provider definitions with their model mappings
const providers = [
    {
        billingModel: 'Pay-per-token',
        color: '#4285F4',
        dashboardUrl: 'https://console.cloud.google.com/vertex-ai',
        description: 'Direct Google Cloud integration. Zero rate limits, regional routing.',
        envKey: 'GOOGLE_VERTEX',
        icon: '🔷',
        id: 'vertexai',
        models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-pro-preview'],
        name: 'Google Vertex AI',
        pricingUrl: 'https://cloud.google.com/vertex-ai/generative-ai/pricing',
        tier: 'Primary',
    },
    {
        billingModel: 'Pay-per-token (pass-through)',
        color: '#FFFFFF',
        dashboardUrl: 'https://vercel.com/dashboard',
        description: 'Unified gateway for OpenAI, Anthropic, Google, DeepSeek. Automatic failover.',
        envKey: 'VERCEL_AI_GATEWAY',
        icon: '▲',
        id: 'vercelaigateway',
        models: ['openai/gpt-5.2', 'openai/gpt-4.1', 'openai/gpt-4o', 'anthropic/claude-sonnet-4.5', 'openai/o3-mini', 'google/gemini-2.5-pro', 'google/gemini-2.0-flash', 'deepseek/deepseek-chat', 'deepseek/deepseek-r1'],
        name: 'Vercel AI Gateway',
        pricingUrl: 'https://vercel.com/ai',
        tier: 'Failover',
    },
    {
        billingModel: 'Free tier + Pay-per-token',
        color: '#FF6B35',
        dashboardUrl: 'https://console.groq.com',
        description: 'Ultra-low latency inference via LPU hardware. Best for real-time responses.',
        envKey: 'GROQ',
        icon: '⚡',
        id: 'groq',
        models: ['llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'mistral-saba-24b', 'deepseek-r1-distill-llama-70b', 'meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct', 'qwen/qwen3-32b'],
        name: 'Groq',
        pricingUrl: 'https://groq.com/pricing',
        tier: 'Speed',
    },
    {
        billingModel: 'Free tier + Pay-per-token',
        color: '#00D4AA',
        dashboardUrl: 'https://cloud.cerebras.ai',
        description: 'Fastest inference in the world via CS-3 wafer-scale chips.',
        envKey: 'CEREBRAS',
        icon: '🧠',
        id: 'cerebras',
        models: ['llama3.1-8b', 'llama3.1-70b'],
        name: 'Cerebras',
        pricingUrl: 'https://cerebras.ai/pricing',
        tier: 'Speed',
    },
    {
        billingModel: 'Enterprise pricing',
        color: '#FF8C00',
        dashboardUrl: 'https://cloud.sambanova.ai',
        description: 'Reconfigurable Dataflow Architecture for enterprise AI. Feature-flagged.',
        envKey: 'SAMBANOVA',
        icon: '🔸',
        id: 'sambanova',
        models: [],
        name: 'SambaNova',
        pricingUrl: 'https://sambanova.ai',
        tier: 'Speed',
    },
];

// Tier pricing for Phở Points
const tierConfig = [
    { color: '#34D399', cost: 5, models: 'Flash, DeepSeek V3, Llama 8B, Mixtral, Cerebras', name: 'Tier 1 — Budget' },
    { color: '#A78BFA', cost: 150, models: 'Pro, GPT-5.2, Claude Sonnet, DeepSeek R1, Llama 4', name: 'Tier 2 — Standard' },
    { color: '#FBBF24', cost: 1000, models: 'Gemini 3 Pro Preview, o3-mini', name: 'Tier 3 — Premium' },
];

export default async function AdminProvidersPage() {
    // Check which providers have API keys configured
    const providerStatus = providers.map(p => {
        const hasKey = (() => {
            switch (p.id) {
                case 'vertexai': {
                    return !!(process.env.GOOGLE_VERTEX_AI_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS);
                }
                case 'vercelaigateway': {
                    return !!process.env.VERCEL_AI_GATEWAY_API_KEY;
                }
                case 'groq': {
                    return !!process.env.GROQ_API_KEY;
                }
                case 'cerebras': {
                    return !!process.env.CEREBRAS_API_KEY;
                }
                case 'sambanova': {
                    return !!process.env.SAMBANOVA_API_KEY;
                }
                default: {
                    return false;
                }
            }
        })();
        return { ...p, configured: hasKey };
    });

    const db = await getServerDB();

    // 1. Fetch balances
    const balancesRaw = await db.query.providerBalances.findMany();
    const balanceMap = Object.fromEntries(balancesRaw.map(b => [b.providerId, b.prepaidBalanceUsd]));

    // 2. Fetch total Phở Points used per provider
    const usageData = await db
        .select({
            points: sql<number>`COALESCE(SUM(${usageLogs.pointsDeducted}), 0)`,
            provider: usageLogs.provider,
        })
        .from(usageLogs)
        .groupBy(usageLogs.provider);

    const usageMap = Object.fromEntries(usageData.map(u => [u.provider, Number(u.points)]));

    const enrichedProviders = providerStatus.map(p => ({
        ...p,
        balanceUsd: balanceMap[p.id] || 0,
        pointsUsed: usageMap[p.id] || 0,
    }));

    return (
        <div style={{ color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '32px', margin: '0 auto', maxWidth: '1200px' }}>
            {/* Header */}
            <div>
                <h1 style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
                    AI Providers
                </h1>
                <p style={{ color: '#A1A1AA', fontSize: '15px', marginTop: '8px' }}>
                    Monitor AI provider status, model availability, and usage tiers. Manage API keys and balance.
                </p>
            </div>

            {/* Phở Points Tier Overview */}
            <div>
                <h2 style={{ alignItems: 'center', color: '#D4D4D8', display: 'flex', fontSize: '18px', fontWeight: 700, gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '22px' }}>🎯</span> Phở Points Pricing Tiers
                </h2>
                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {tierConfig.map(tier => (
                        <div key={tier.name} style={{ ...cardStyle, padding: '24px' }}>
                            <div style={hoverGlow(tier.color)} />
                            <div style={{ zIndex: 1 }}>
                                <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{ color: '#A1A1AA', fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                                        {tier.name}
                                    </span>
                                </div>
                                <div style={{ color: tier.color, fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '8px' }}>
                                    {tier.cost} pts
                                    <span style={{ color: '#A1A1AA', fontSize: '14px', fontWeight: 400 }}> / message</span>
                                </div>
                                <p style={{ color: '#71717A', fontSize: '12px', lineHeight: 1.5, marginTop: '8px' }}>
                                    {tier.models}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Provider Cards */}
            <div>
                <h2 style={{ alignItems: 'center', color: '#D4D4D8', display: 'flex', fontSize: '18px', fontWeight: 700, gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '22px' }}>🔌</span> Provider Status & Configuration
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {enrichedProviders.map(provider => (
                        <div key={provider.id} style={{ ...cardStyle, border: `1px solid ${provider.configured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}` }}>
                            <div style={{ alignItems: 'flex-start', display: 'flex', gap: '20px', padding: '24px' }}>
                                {/* Icon */}
                                <div style={{
                                    alignItems: 'center',
                                    background: `${provider.color}15`,
                                    border: `1px solid ${provider.color}25`,
                                    borderRadius: '14px',
                                    display: 'flex',
                                    flexShrink: 0,
                                    fontSize: '28px',
                                    height: '56px',
                                    justifyContent: 'center',
                                    width: '56px',
                                }}>
                                    {provider.icon}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                                        <h3 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 700, margin: 0 }}>{provider.name}</h3>
                                        {/* Status badge */}
                                        <span style={{
                                            alignItems: 'center',
                                            background: provider.configured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                            border: `1px solid ${provider.configured ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                            borderRadius: '20px',
                                            color: provider.configured ? '#10B981' : '#EF4444',
                                            display: 'inline-flex',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            gap: '6px',
                                            padding: '3px 10px',
                                        }}>
                                            <span style={{ backgroundColor: provider.configured ? '#10B981' : '#EF4444', borderRadius: '50%', height: '6px', width: '6px' }} />
                                            {provider.configured ? 'Connected' : 'Not Configured'}
                                        </span>
                                        {/* Role badge */}
                                        <span style={{
                                            background: provider.tier === 'Primary' ? 'rgba(79, 70, 229, 0.15)' : provider.tier === 'Failover' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                            border: `1px solid ${provider.tier === 'Primary' ? 'rgba(79, 70, 229, 0.2)' : provider.tier === 'Failover' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(56, 189, 248, 0.2)'}`,
                                            borderRadius: '6px',
                                            color: provider.tier === 'Primary' ? '#A78BFA' : provider.tier === 'Failover' ? '#FBBF24' : '#38BDF8',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            padding: '3px 10px',
                                        }}>
                                            {provider.tier}
                                        </span>
                                    </div>
                                    <p style={{ color: '#A1A1AA', fontSize: '13px', margin: '0 0 12px' }}>{provider.description}</p>

                                    {/* Model chips */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                        {provider.models.map(model => (
                                            <span key={model} style={{
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                                borderRadius: '6px',
                                                color: '#D4D4D8',
                                                fontFamily: 'monospace',
                                                fontSize: '11px',
                                                padding: '3px 8px',
                                            }}>
                                                {model}
                                            </span>
                                        ))}
                                        {provider.models.length === 0 && (
                                            <span style={{ color: '#71717A', fontSize: '12px', fontStyle: 'italic' }}>No models configured</span>
                                        )}
                                    </div>

                                    {/* Meta row */}
                                    <div style={{ alignItems: 'center', display: 'flex', fontSize: '12px', gap: '20px' }}>
                                        <div style={{ alignItems: 'center', display: 'flex', gap: '6px' }}>
                                            <span style={{ color: '#71717A' }}>Balance:</span>
                                            <BalanceEditor currentBalance={provider.balanceUsd} providerId={provider.id} />
                                        </div>
                                        <span style={{ alignItems: 'center', color: '#71717A', display: 'flex', gap: '6px' }}>
                                            <span>Usage:</span>
                                            <span style={{ color: '#FBBF24', fontWeight: 600 }}>{provider.pointsUsed.toLocaleString()} pts</span>
                                        </span>
                                        <span style={{ color: '#71717A' }}>
                                            💳 {provider.billingModel}
                                        </span>
                                        <span style={{ color: '#71717A' }}>
                                            📊 {provider.models.length} models
                                        </span>
                                        <a
                                            className="hover:underline"
                                            href={provider.dashboardUrl}
                                            rel="noopener noreferrer"
                                            style={{ color: '#A78BFA', fontWeight: 500, textDecoration: 'none' }}
                                            target="_blank"
                                        >
                                            Open Dashboard →
                                        </a>
                                        <a
                                            className="hover:text-white"
                                            href={provider.pricingUrl}
                                            rel="noopener noreferrer"
                                            style={{ color: '#71717A', textDecoration: 'none' }}
                                            target="_blank"
                                        >
                                            View Pricing
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Resilience Architecture Info */}
            <div style={{ ...cardStyle, border: '1px solid rgba(124, 58, 237, 0.15)', padding: '24px' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{ alignItems: 'center', color: '#D8B4FE', display: 'flex', fontSize: '16px', fontWeight: 700, gap: '8px', margin: '0 0 12px' }}>
                        <span style={{ fontSize: '20px' }}>🛡️</span> Multi-Provider Resilience Architecture
                    </h3>
                    <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        {[
                            { color: '#4285F4', label: 'Primary Route', sub: 'Direct API, zero rate limits', value: 'Google Vertex AI' },
                            { color: '#FFFFFF', label: 'Failover Route', sub: 'Auto-switch on Vertex failure', value: 'Vercel AI Gateway' },
                            { color: '#FF6B35', label: 'Speed Layer', sub: 'Ultra-low latency for Tier 1', value: 'Groq + Cerebras' },
                            { color: '#10B981', label: 'Uptime Target', sub: 'Via multi-provider redundancy', value: '100%' },
                        ].map(item => (
                            <div key={item.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px' }}>
                                <div style={{ color: '#A1A1AA', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px', textTransform: 'uppercase' }}>{item.label}</div>
                                <div style={{ color: item.color, fontSize: '16px', fontWeight: 700 }}>{item.value}</div>
                                <div style={{ color: '#71717A', fontSize: '11px', marginTop: '4px' }}>{item.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Env Checklist */}
            <div style={{ ...cardStyle, padding: '0' }}>
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>🔑 Environment Variables Status</h3>
                    <p style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '4px' }}>API key configuration audit</p>
                </div>
                <div style={{ padding: '0' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', width: '100%' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '12px 24px' }}>Variable</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '12px 24px' }}>Status</th>
                                <th style={{ color: '#A1A1AA', fontWeight: 500, padding: '12px 24px' }}>Provider</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { key: 'GOOGLE_APPLICATION_CREDENTIALS', provider: 'Vertex AI', set: !!process.env.GOOGLE_APPLICATION_CREDENTIALS },
                                { key: 'VERCEL_AI_GATEWAY_API_KEY', provider: 'Vercel AI Gateway', set: !!process.env.VERCEL_AI_GATEWAY_API_KEY },
                                { key: 'GROQ_API_KEY', provider: 'Groq', set: !!process.env.GROQ_API_KEY },
                                { key: 'CEREBRAS_API_KEY', provider: 'Cerebras', set: !!process.env.CEREBRAS_API_KEY },
                                { key: 'SAMBANOVA_API_KEY', provider: 'SambaNova', set: !!process.env.SAMBANOVA_API_KEY },
                                { key: 'OPENAI_API_KEY', provider: 'OpenAI (direct)', set: !!process.env.OPENAI_API_KEY },
                                { key: 'ANTHROPIC_API_KEY', provider: 'Anthropic (direct)', set: !!process.env.ANTHROPIC_API_KEY },
                            ].map(env => (
                                <tr className="hover:bg-[rgba(255,255,255,0.02)] transition-colors" key={env.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ color: '#D4D4D8', fontFamily: 'monospace', fontSize: '12px', padding: '12px 24px' }}>{env.key}</td>
                                    <td style={{ padding: '12px 24px' }}>
                                        <span style={{
                                            alignItems: 'center',
                                            background: env.set ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                                            border: `1px solid ${env.set ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`,
                                            borderRadius: '12px',
                                            color: env.set ? '#10B981' : '#EF4444',
                                            display: 'inline-flex',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            gap: '6px',
                                            padding: '3px 8px',
                                        }}>
                                            <span style={{ backgroundColor: env.set ? '#10B981' : '#EF4444', borderRadius: '50%', height: '5px', width: '5px' }} />
                                            {env.set ? 'SET' : 'MISSING'}
                                        </span>
                                    </td>
                                    <td style={{ color: '#A1A1AA', padding: '12px 24px' }}>{env.provider}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
