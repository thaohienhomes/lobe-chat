'use client';

import { createStyles } from 'antd-style';
import { memo } from 'react';

const useStyles = createStyles(({ css, token }) => ({
    container: css`
        display: flex;
        gap: 6px;
        align-items: center;
        justify-content: center;
        margin-block-end: 20px;
    `,
    dot: css`
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${token.colorBorderSecondary};
        transition: all 0.3s ease;
    `,
    dotActive: css`
        width: 24px;
        border-radius: 4px;
        background: ${token.colorPrimary};
    `,
    dotDone: css`
        background: ${token.colorPrimary};
        opacity: 0.5;
    `,
    label: css`
        margin-inline-start: 8px;
        font-size: 11px;
        color: ${token.colorTextDescription};
    `,
}));

interface OnboardingProgressProps {
    currentStep: number;
    totalSteps: number;
}

const OnboardingProgress = memo<OnboardingProgressProps>(({ currentStep, totalSteps }) => {
    const { styles, cx } = useStyles();

    return (
        <div className={styles.container}>
            {Array.from({ length: totalSteps }, (_, i) => (
                <div
                    className={cx(
                        styles.dot,
                        i === currentStep && styles.dotActive,
                        i < currentStep && styles.dotDone,
                    )}
                    key={i}
                />
            ))}
            <span className={styles.label}>
                {currentStep + 1}/{totalSteps}
            </span>
        </div>
    );
});

OnboardingProgress.displayName = 'OnboardingProgress';

export default OnboardingProgress;
