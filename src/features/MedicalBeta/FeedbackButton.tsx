'use client';

import { useUser } from '@clerk/nextjs';
import { Popover } from 'antd';
import { MessageSquarePlus } from 'lucide-react';
import { memo, useCallback, useState } from 'react';

/**
 * MedicalBetaFeedback — Sidebar bottom feedback button for Medical Beta users
 *
 * Renders as an icon in the sidebar BottomActions, opens a Popover with feedback form.
 * Sends feedback to PostHog Survey + /api/promo/feedback.
 * Only renders if user has medical_beta plan.
 */

interface FeedbackPayload {
    category: string;
    message: string;
    rating: number;
}

const POSTHOG_MEDICAL_SURVEY_ID = '019c4bb7-283f-0000-4b17-7763ef2c54fe';

const CATEGORIES = [
    { emoji: '🐛', label: 'Bug', value: 'bug' },
    { emoji: '💡', label: 'Đề xuất', value: 'feature' },
    { emoji: '💊', label: 'Drug DB', value: 'drug_db' },
    { emoji: '📊', label: 'Calculator', value: 'calculator' },
    { emoji: '🔬', label: 'PubMed', value: 'search' },
    { emoji: '💬', label: 'Chung', value: 'general' },
];

const FeedbackForm = memo<{ onClose: () => void }>(({ onClose }) => {
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

        const posthog = (window as any).posthog;
        if (posthog) {
            if (POSTHOG_MEDICAL_SURVEY_ID) {
                posthog.capture('survey sent', {
                    $survey_id: POSTHOG_MEDICAL_SURVEY_ID,
                    $survey_response: message.trim(),
                    $survey_response_1: category,
                    $survey_response_2: rating,
                    feedback_category: category,
                    feedback_rating: rating,
                    plan: 'medical_beta',
                });
            } else {
                posthog.capture('medical_beta_feedback', {
                    $survey_response: message.trim(),
                    feedback_category: category,
                    feedback_rating: rating,
                    plan: 'medical_beta',
                });
            }
        }

        fetch('/api/promo/feedback', {
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        }).catch(console.error);

        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            onClose();
            setMessage('');
            setRating(0);
            setCategory('general');
        }, 2000);
    }, [category, message, rating, onClose]);

    if (submitted) {
        return (
            <div style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>✅</div>
                <p style={{ color: '#22c55e', fontWeight: 600, margin: 0 }}>Cảm ơn phản hồi!</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: '4px 0 0' }}>
                    Team sẽ review trong 24h
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: 280 }}>
            <h4 style={{ color: '#22c55e', fontSize: '0.9rem', margin: 0 }}>
                🏥 Phản hồi Medical Beta
            </h4>

            {/* Category */}
            <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>
                    Loại phản hồi
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => setCategory(cat.value)}
                            style={{
                                background: category === cat.value
                                    ? 'rgba(34, 197, 94, 0.2)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${category === cat.value ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                                borderRadius: '6px',
                                color: category === cat.value ? '#22c55e' : 'rgba(255,255,255,0.6)',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                padding: '3px 8px',
                            }}
                            type="button"
                        >
                            {cat.emoji} {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rating */}
            <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>
                    Đánh giá
                </label>
                <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                opacity: star <= rating ? 1 : 0.3,
                                padding: '0 1px',
                                transition: 'opacity 0.15s',
                            }}
                            type="button"
                        >
                            ⭐
                        </button>
                    ))}
                </div>
            </div>

            {/* Message */}
            <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>
                    Nội dung
                </label>
                <textarea
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mô tả vấn đề hoặc đề xuất..."
                    rows={3}
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#e0e0e0',
                        fontSize: '0.85rem',
                        outline: 'none',
                        padding: '8px 10px',
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
                    borderRadius: '8px',
                    color: message.trim() ? 'white' : 'rgba(255,255,255,0.3)',
                    cursor: message.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: '8px',
                    transition: 'opacity 0.2s',
                    width: '100%',
                }}
                type="button"
            >
                Gửi phản hồi
            </button>
        </div>
    );
});

FeedbackForm.displayName = 'FeedbackForm';

const MedicalBetaFeedback = memo(() => {
    const [isOpen, setIsOpen] = useState(false);
    const { user: clerkUser } = useUser();
    const isMedicalBeta = (clerkUser?.publicMetadata as Record<string, unknown>)?.planId === 'medical_beta';

    if (!isMedicalBeta) return null;

    return (
        <Popover
            arrow={false}
            content={<FeedbackForm onClose={() => setIsOpen(false)} />}
            onOpenChange={setIsOpen}
            open={isOpen}
            overlayInnerStyle={{
                backdropFilter: 'blur(20px)',
                background: 'rgba(15, 15, 25, 0.95)',
                border: '1px solid rgba(34, 197, 94, 0.15)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
            placement="rightBottom"
            trigger="click"
        >
            <button
                aria-label="Gửi phản hồi"
                style={{
                    alignItems: 'center',
                    background: isOpen
                        ? 'linear-gradient(135deg, #22c55e, #059669)'
                        : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: isOpen ? 'white' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    height: '36px',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    width: '36px',
                }}
                title="Phản hồi Medical Beta"
                type="button"
            >
                <MessageSquarePlus size={20} />
            </button>
        </Popover>
    );
});

MedicalBetaFeedback.displayName = 'MedicalBetaFeedback';

export default MedicalBetaFeedback;
