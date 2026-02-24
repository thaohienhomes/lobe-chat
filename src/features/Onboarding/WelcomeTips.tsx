'use client';

import { Button } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

const useStyles = createStyles(({ css, token }) => ({
    container: css`
        padding: 24px;
    `,
    footer: css`
        display: flex;
        justify-content: center;
        margin-block-start: 8px;
    `,
    subtitle: css`
        margin-block: 0 24px;
        font-size: 14px;
        color: ${token.colorTextSecondary};
        text-align: center;
    `,
    tip: css`
        display: flex;
        gap: 12px;
        align-items: flex-start;
        padding: 14px 16px;
        border-radius: 12px;
        background: ${token.colorBgElevated};
        transition: all 0.2s;
    `,
    tipDesc: css`
        margin: 0;
        font-size: 12px;
        color: ${token.colorTextDescription};
        line-height: 1.5;
    `,
    tipIcon: css`
        font-size: 24px;
        flex-shrink: 0;
        margin-block-start: 2px;
    `,
    tipTitle: css`
        margin: 0 0 4px;
        font-size: 14px;
        font-weight: 600;
    `,
    title: css`
        margin-block: 0 8px;
        font-size: 24px;
        font-weight: 600;
        text-align: center;
    `,
}));

interface WelcomeTipsProps {
    loading?: boolean;
    onComplete: () => void;
}

const TIPS_VI = [
    { desc: 'Chọn model AI phù hợp nhất cho từng câu hỏi — từ tiết kiệm (5 pts) đến cao cấp (1000 pts).', icon: '🤖', title: 'Chọn đúng model' },
    { desc: 'Gõ / trong chat để tra cứu PubMed, kiểm tra tương tác thuốc, hoặc tính toán lâm sàng.', icon: '🔌', title: 'Sử dụng Plugin' },
    { desc: 'Xem lịch sử sử dụng, số Phở Points còn lại tại trang /usage.', icon: '📊', title: 'Theo dõi Usage' },
    { desc: 'Mời bạn bè tại /invite để cùng trải nghiệm Phở Chat.', icon: '🎁', title: 'Mời bạn bè' },
];

const TIPS_EN = [
    { desc: 'Pick the right AI model for each query — from budget (5 pts) to premium (1000 pts).', icon: '🤖', title: 'Choose the right model' },
    { desc: 'Type / in chat to search PubMed, check drug interactions, or run clinical calculators.', icon: '🔌', title: 'Use Plugins' },
    { desc: 'Track your usage history and remaining Phở Points at /usage.', icon: '📊', title: 'Monitor Usage' },
    { desc: 'Invite friends at /invite to share the Phở Chat experience.', icon: '🎁', title: 'Invite friends' },
];

const WelcomeTips = memo<WelcomeTipsProps>(({ loading, onComplete }) => {
    const { styles } = useStyles();
    const { i18n } = useTranslation();
    const lang = i18n.language?.startsWith('vi') ? 'vi' : 'en';
    const tips = lang === 'vi' ? TIPS_VI : TIPS_EN;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>
                {lang === 'vi' ? '🚀 Bạn đã sẵn sàng!' : '🚀 You\'re all set!'}
            </h2>
            <p className={styles.subtitle}>
                {lang === 'vi'
                    ? 'Một vài mẹo để sử dụng Phở Chat hiệu quả nhất'
                    : 'A few tips to get the most out of Phở Chat'}
            </p>

            <Flexbox gap={10}>
                {tips.map((tip) => (
                    <div className={styles.tip} key={tip.title}>
                        <span className={styles.tipIcon}>{tip.icon}</span>
                        <div>
                            <p className={styles.tipTitle}>{tip.title}</p>
                            <p className={styles.tipDesc}>{tip.desc}</p>
                        </div>
                    </div>
                ))}
            </Flexbox>

            <Flexbox className={styles.footer}>
                <Button
                    loading={loading}
                    onClick={onComplete}
                    size="large"
                    type="primary"
                >
                    {lang === 'vi' ? 'Bắt đầu chat! 🎉' : 'Start chatting! 🎉'}
                </Button>
            </Flexbox>
        </div>
    );
});

WelcomeTips.displayName = 'WelcomeTips';

export default WelcomeTips;
