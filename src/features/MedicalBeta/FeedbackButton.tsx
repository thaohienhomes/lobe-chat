'use client';

import { MessageSquarePlus } from 'lucide-react';
import { memo, useCallback, useState } from 'react';

/**
 * MedicalBetaFeedback — Floating feedback button for Medical Beta users
 *
 * Triggers PostHog Survey when available, falls back to inline form.
 * Only renders if user has medical_beta flag (controlled by parent).
 */

interface FeedbackPayload {
    category: string;
    message: string;
    rating: number;
}

const CATEGORIES = [
    { emoji: '🐛', label: 'Bug Report', value: 'bug' },
    { emoji: '💡', label: 'Feature Request', value: 'feature' },
    { emoji: '💊', label: 'Drug DB Issue', value: 'drug_db' },
    { emoji: '📊', label: 'Calculator Issue', value: 'calculator' },
    { emoji: '🔬', label: 'PubMed/Search', value: 'search' },
    { emoji: '💬', label: 'General', value: 'general' },
];

const MedicalBetaFeedback = memo(() => {
    const [isOpen, setIsOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [category, setCategory] = useState('general');
    const [rating, setRating] = useState(0);
    const [message, setMessage] = useState('');

    const handleSubmit = useCallback(() => {
        if (!message.trim()) return;

        const payload: FeedbackPayload = {
            category,
            message: message.trim(),
            rating,
        };

        // Try PostHog survey first
        const posthog = (window as any).posthog;
        if (posthog) {
            posthog.capture('medical_beta_feedback', {
                $survey_response: message.trim(),
                feedback_category: category,
                feedback_rating: rating,
                plan: 'medical_beta',
            });
        }

        // Also send to API for persistence
        fetch('/api/promo/feedback', {
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        }).catch(console.error);

        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setIsOpen(false);
            setMessage('');
            setRating(0);
            setCategory('general');
        }, 2000);
    }, [category, message, rating]);

    return (
        <>
            {/* Floating button */}
            <button
                aria-label="Medical Beta Feedback"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #22c55e, #059669)',
                    border: 'none',
                    borderRadius: '50%',
                    bottom: '24px',
                    boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    height: '52px',
                    justifyContent: 'center',
                    position: 'fixed',
                    right: '24px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    width: '52px',
                    zIndex: 1000,
                }}
                title="Gửi phản hồi Medical Beta"
            >
                <MessageSquarePlus size={24} />
            </button>

            {/* Feedback panel */}
            {isOpen && (
                <div
                    style={{
                        background: 'rgba(15, 15, 25, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        borderRadius: '16px',
                        bottom: '88px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        color: '#e0e0e0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        maxHeight: '480px',
                        overflowY: 'auto',
                        padding: '20px',
                        position: 'fixed',
                        right: '24px',
                        width: '340px',
                        zIndex: 1001,
                    }}
                >
                    {submitted ? (
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
                            <p style={{ color: '#22c55e', fontWeight: 600 }}>Cảm ơn phản hồi!</p>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                Team sẽ review trong 24h
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                                <h3 style={{ color: '#22c55e', fontSize: '1rem', margin: 0 }}>
                                    🏥 Medical Beta Feedback
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem',
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Category selector */}
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontSize: '0.8rem', marginBottom: '6px' }}>
                                    Loại phản hồi
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.value}
                                            onClick={() => setCategory(cat.value)}
                                            style={{
                                                background: category === cat.value
                                                    ? 'rgba(34, 197, 94, 0.2)'
                                                    : 'rgba(255, 255, 255, 0.05)',
                                                border: `1px solid ${category === cat.value ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                                                borderRadius: '8px',
                                                color: category === cat.value ? '#22c55e' : 'rgba(255,255,255,0.7)',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                padding: '4px 10px',
                                            }}
                                        >
                                            {cat.emoji} {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rating */}
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontSize: '0.8rem', marginBottom: '6px' }}>
                                    Đánh giá
                                </label>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '1.4rem',
                                                opacity: star <= rating ? 1 : 0.3,
                                                transition: 'opacity 0.15s',
                                            }}
                                        >
                                            ⭐
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontSize: '0.8rem', marginBottom: '6px' }}>
                                    Nội dung
                                </label>
                                <textarea
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Mô tả vấn đề hoặc đề xuất..."
                                    rows={4}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: '#e0e0e0',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        padding: '10px 12px',
                                        resize: 'vertical',
                                        width: '100%',
                                    }}
                                    value={message}
                                />
                            </div>

                            {/* Submit */}
                            <button
                                disabled={!message.trim()}
                                onClick={handleSubmit}
                                style={{
                                    background: message.trim()
                                        ? 'linear-gradient(135deg, #22c55e, #059669)'
                                        : 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: message.trim() ? 'white' : 'rgba(255,255,255,0.3)',
                                    cursor: message.trim() ? 'pointer' : 'not-allowed',
                                    fontWeight: 600,
                                    padding: '10px',
                                    transition: 'opacity 0.2s',
                                    width: '100%',
                                }}
                            >
                                Gửi phản hồi
                            </button>
                        </>
                    )}
                </div>
            )}
        </>
    );
});

MedicalBetaFeedback.displayName = 'MedicalBetaFeedback';

export default MedicalBetaFeedback;
