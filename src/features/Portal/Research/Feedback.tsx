'use client';

import { createStyles } from 'antd-style';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

const useStyles = createStyles(({ css, token }) => ({
    container: css`
    padding: 8px 12px;
    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
    feedbackBtn: css`
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 4px 10px;
    font-size: 12px;
    cursor: pointer;
    background: ${token.colorFillSecondary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 20px;
    transition: all 0.2s;
    &:hover { background: ${token.colorFill}; }
  `,
    feedbackBtnActive: css`
    border-color: ${token.colorPrimary};
    color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
  `,
    thankYou: css`
    font-size: 12px;
    color: ${token.colorSuccess};
    font-weight: 500;
  `,
}));

interface ResearchFeedbackProps {
    featureName?: string;
}

const ResearchFeedback = memo<ResearchFeedbackProps>(({ featureName = 'Research Mode' }) => {
    const { styles, cx } = useStyles();
    const [vote, setVote] = useState<'up' | 'down' | null>(null);
    const [showComment, setShowComment] = useState(false);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleVote = (v: 'up' | 'down') => {
        setVote(v);
        if (v === 'up') {
            // Auto-submit positive vote
            setTimeout(() => setSubmitted(true), 800);
        } else {
            setShowComment(true);
        }
    };

    const handleSubmit = () => {
        // Log feedback (can be extended to send to PostHog/analytics)
        console.info('[Research Feedback]', { comment, feature: featureName, vote });
        if (typeof window !== 'undefined' && (window as any).posthog) {
            (window as any).posthog.capture('research_mode_feedback', {
                comment,
                feature: featureName,
                vote,
            });
        }
        setSubmitted(true);
        setShowComment(false);
    };

    if (submitted) {
        return (
            <Flexbox align={'center'} className={styles.container} gap={6} horizontal>
                <span className={styles.thankYou}>
                    ✅ Cảm ơn phản hồi của bạn! Chúng tôi sẽ tiếp tục cải thiện.
                </span>
            </Flexbox>
        );
    }

    return (
        <Flexbox className={styles.container} gap={8}>
            <Flexbox align={'center'} gap={8} horizontal justify={'space-between'}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                    🔬 Tính năng mới — Bạn thấy Research Mode hữu ích không?
                </span>
                <Flexbox gap={6} horizontal>
                    <button
                        className={cx(styles.feedbackBtn, vote === 'up' && styles.feedbackBtnActive)}
                        onClick={() => handleVote('up')}
                        type="button"
                    >
                        <ThumbsUp size={13} />
                        Hữu ích
                    </button>
                    <button
                        className={cx(styles.feedbackBtn, vote === 'down' && styles.feedbackBtnActive)}
                        onClick={() => handleVote('down')}
                        type="button"
                    >
                        <ThumbsDown size={13} />
                        Cần cải thiện
                    </button>
                </Flexbox>
            </Flexbox>

            {showComment && (
                <Flexbox gap={6} horizontal>
                    <input
                        autoFocus
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="Bạn muốn cải thiện điều gì? (nhấn Enter để gửi)"
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 8,
                            color: 'inherit',
                            flex: 1,
                            fontSize: 12,
                            outline: 'none',
                            padding: '4px 10px',
                        }}
                        value={comment}
                    />
                    <button className={styles.feedbackBtn} onClick={handleSubmit} type="button">
                        Gửi
                    </button>
                </Flexbox>
            )}
        </Flexbox>
    );
});

ResearchFeedback.displayName = 'ResearchFeedback';
export default ResearchFeedback;
