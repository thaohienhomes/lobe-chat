'use client';

/**
 * Announcement Banner — Floating notification pills above the chat input.
 *
 * Architecture:
 * - `ANNOUNCEMENTS` const array is the single source of truth for what to show.
 * - `localStorage('pho-dismissed-announcements')` stores dismissed IDs.
 * - Items auto-expire via `expiresAt` (ISO date).
 * - Auto-rotates every 5s with fade+slide animation.
 * - "Thử ngay" button switches model via `useAgentStore.updateAgentConfig`.
 * - Designed for long-term reuse: models, features, plugins, contextual tips.
 */

export type AnnouncementType = 'new_model' | 'feature' | 'plugin' | 'tip';

export interface Announcement {
    /** Accent color for the pill border glow */
    accentColor: string;
    /** Optional CTA label override (default: 'Thử ngay →') */
    ctaLabel?: string;
    /** Emoji icon on the left */
    emoji: string;
    /** Auto-hide after this date (ISO 8601). Omit for permanent. */
    expiresAt?: string;
    /** Unique ID for dismissal tracking */
    id: string;
    /** If type=new_model: the model ID to switch to. */
    modelId?: string;
    /** If type=new_model: the provider to switch to. */
    provider?: string;
    /** Short tagline shown in the pill */
    tagline: string;
    /** Bold display name */
    title: string;
    /** Category for filtering and future personalization */
    type: AnnouncementType;
    /** Optional URL to navigate to instead of model switch */
    url?: string;
}

/**
 * Active announcements.
 * Add new entries here when models/features launch.
 * Remove or let `expiresAt` auto-hide old entries.
 */
export const ANNOUNCEMENTS: Announcement[] = [
    // ── Features ──
    {
        accentColor: '#a855f7',
        ctaLabel: 'Bật ngay ✨',
        emoji: '✨',
        expiresAt: '2026-03-07T00:00:00Z',
        id: 'pho-auto-launch',
        modelId: 'pho-auto',
        provider: 'phochat',
        tagline: 'Tự động chọn model tốt nhất cho câu hỏi',
        title: 'Phở Auto',
        type: 'feature',
    },

    // ── New Models ──
    {
        accentColor: '#ef4444',
        emoji: '⚡',
        expiresAt: '2026-03-07T00:00:00Z',
        id: 'mercury-2-launch',
        modelId: 'mercury-coder-small-2-2',
        provider: 'phochat',
        tagline: 'AI nhanh nhất thế giới — 1000+ tok/s',
        title: 'Mercury 2',
        type: 'new_model',
    },
    {
        accentColor: '#3b82f6',
        emoji: '🧠',
        expiresAt: '2026-03-07T00:00:00Z',
        id: 'grok-4.2-launch',
        modelId: 'xai/grok-4.2',
        provider: 'vercelaigateway',
        tagline: 'Giảm 65% hallucination · 4-agent architecture',
        title: 'Grok 4.2',
        type: 'new_model',
    },
    {
        accentColor: '#f59e0b',
        emoji: '🌙',
        expiresAt: '2026-03-07T00:00:00Z',
        id: 'kimi-k2.5-launch',
        modelId: 'kimi-k2.5',
        provider: 'phochat',
        tagline: '100 agents đồng thời · 1T params MoE',
        title: 'Kimi K2.5',
        type: 'new_model',
    },
    {
        accentColor: '#6366f1',
        emoji: '💻',
        expiresAt: '2026-03-07T00:00:00Z',
        id: 'gpt-5.3-codex-launch',
        modelId: 'openai/gpt-5.3-codex',
        provider: 'vercelaigateway',
        tagline: 'Coding model mới nhất · Nhanh hơn 25%',
        title: 'GPT-5.3 Codex',
        type: 'new_model',
    },
    {
        accentColor: '#ec4899',
        emoji: '🎨',
        expiresAt: '2026-03-07T00:00:00Z',
        id: 'claude-4.6-launch',
        modelId: 'anthropic/claude-sonnet-4-6',
        provider: 'vercelaigateway',
        tagline: 'Agentic coding xuất sắc · 1M context beta',
        title: 'Claude 4.6 Sonnet',
        type: 'new_model',
    },
    {
        accentColor: '#14b8a6',
        emoji: '🔬',
        expiresAt: '2026-03-07T00:00:00Z',
        id: 'gemini-3.1-pro-launch',
        modelId: 'google/gemini-3.1-pro-preview',
        provider: 'vercelaigateway',
        tagline: 'ARC-AGI-2 77.1% · 2M context window',
        title: 'Gemini 3.1 Pro',
        type: 'new_model',
    },
];

/** localStorage key for tracking dismissed announcement IDs */
export const DISMISSED_KEY = 'pho-dismissed-announcements';
