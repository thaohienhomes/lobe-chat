'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAgentStore } from '@/store/agent';

import { ANNOUNCEMENTS, type Announcement, DISMISSED_KEY } from './const';
import { useStyles } from './style';

/** Read dismissed IDs from localStorage */
const getDismissed = (): Set<string> => {
    try {
        const raw = localStorage.getItem(DISMISSED_KEY);
        return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
        return new Set();
    }
};

/** Persist a dismissed ID */
const addDismissed = (id: string) => {
    const set = getDismissed();
    set.add(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
};

const ROTATE_INTERVAL = 5000; // ms

const AnnouncementBanner = memo(() => {
    const { styles, cx } = useStyles();
    const updateAgentConfig = useAgentStore((s) => s.updateAgentConfig);

    // ── Filter active announcements ──
    const activeItems = useMemo(() => {
        const now = Date.now();
        const dismissed = getDismissed();
        return ANNOUNCEMENTS.filter((a) => {
            if (dismissed.has(a.id)) return false;
            if (a.expiresAt && new Date(a.expiresAt).getTime() < now) return false;
            return true;
        });
    }, []);

    // ── Rotation state ──
    const [currentIndex, setCurrentIndex] = useState(0);
    const [exiting, setExiting] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [items, setItems] = useState<Announcement[]>(activeItems);
    const timerRef = useRef<ReturnType<typeof setInterval>>();

    // Auto-rotate
    useEffect(() => {
        if (items.length <= 1) return;
        timerRef.current = setInterval(() => {
            setExiting(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % items.length);
                setExiting(false);
            }, 300); // match exit animation duration
        }, ROTATE_INTERVAL);
        return () => clearInterval(timerRef.current);
    }, [items.length]);

    // ── Handlers ──
    const handleDismiss = useCallback(
        (id: string) => {
            addDismissed(id);
            const next = items.filter((i) => i.id !== id);
            setItems(next);
            if (next.length === 0) {
                setDismissed(true);
            } else {
                setCurrentIndex((prev) => prev % next.length);
            }
        },
        [items],
    );

    const handleCta = useCallback(
        (item: Announcement) => {
            if (item.url) {
                window.open(item.url, '_blank');
                return;
            }
            if (item.modelId && item.provider) {
                updateAgentConfig({ model: item.modelId, provider: item.provider });
            }
            // Auto-dismiss after clicking
            handleDismiss(item.id);
        },
        [updateAgentConfig, handleDismiss],
    );

    // ── Nothing to show ──
    if (dismissed || items.length === 0) return null;

    const current = items[currentIndex % items.length];
    if (!current) return null;

    return (
        <div className={cx(styles.container, exiting && styles.exiting)} key={current.id}>
            <div
                className={styles.banner}
                style={{
                    borderColor: `${current.accentColor}30`,
                    boxShadow: `0 0 12px ${current.accentColor}15`,
                }}
            >
                {/* Emoji */}
                <span className={styles.emoji}>{current.emoji}</span>

                {/* Text */}
                <div className={styles.text}>
                    <span className={styles.title}>{current.title}</span>
                    <span className={styles.tagline}>— {current.tagline}</span>
                </div>

                {/* CTA */}
                <button
                    className={styles.cta}
                    onClick={() => handleCta(current)}
                    style={{ background: current.accentColor }}
                    type="button"
                >
                    {current.ctaLabel || 'Thử ngay →'}
                </button>

                {/* Dismiss */}
                <button className={styles.dismiss} onClick={() => handleDismiss(current.id)} title="Ẩn" type="button">
                    ✕
                </button>

                {/* Dot indicators */}
                {items.length > 1 && (
                    <div style={{ display: 'flex', gap: 3, marginLeft: 2 }}>
                        {items.map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    background:
                                        i === currentIndex % items.length
                                            ? current.accentColor
                                            : 'rgba(255,255,255,0.15)',
                                    borderRadius: '50%',
                                    height: 4,
                                    transition: 'background 300ms',
                                    width: 4,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

AnnouncementBanner.displayName = 'AnnouncementBanner';

export default AnnouncementBanner;
