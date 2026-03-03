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
    // ── Research Mode Launch ──
    {
        accentColor: '#63e2b7',
        ctaLabel: 'Khám phá →',
        emoji: '🔬',
        expiresAt: '2026-04-30T00:00:00Z',
        id: 'research-mode-launch-v1',
        tagline: 'Tổng quan hệ thống · PRISMA · 4 nguồn dữ liệu · Sàng lọc thông minh',
        title: 'Research Mode',
        type: 'feature',
        url: undefined, // handled by onClick in banner — open research mode
    },
];


/** localStorage key for tracking dismissed announcement IDs */
export const DISMISSED_KEY = 'pho-dismissed-announcements';
