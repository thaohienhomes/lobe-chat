'use client';

import { Sparkles, Zap, Gift } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useTrialStatus } from './useTrialStatus';
import { useStyles } from './style';

interface TrialUpgradePromptProps {
  compact?: boolean;
}

const TrialUpgradePrompt = memo<TrialUpgradePromptProps>(({ compact = false }) => {
  const { t } = useTranslation('setting');
  const { styles, cx } = useStyles();
  const { data, isLoading, isTrialUser, maxMessages, messagesRemaining, trialExpired } = useTrialStatus();

  // Don't show for paid users or when loading
  if (isLoading || !data) return null;
  if (!isTrialUser) return null;

  const progressPercentage = maxMessages > 0
    ? ((maxMessages - messagesRemaining) / maxMessages) * 100
    : 0;

  return (
    <Flexbox className={cx(styles.container, compact && styles.compact)}>
      {/* Header */}
      <Flexbox align="center" gap={8} horizontal>
        <div className={styles.iconWrapper}>
          {trialExpired ? <Zap size={16} /> : <Sparkles size={16} />}
        </div>
        <span className={styles.title}>
          {trialExpired ? 'Dùng thử đã hết' : 'Bản dùng thử miễn phí'}
        </span>
      </Flexbox>

      {/* Progress */}
      <Flexbox gap={6}>
        <div className={styles.progressBar}>
          <div 
            className={cx(styles.progressFill, trialExpired && styles.progressExpired)}
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          />
        </div>
        <span className={styles.progressText}>
          {trialExpired
            ? 'Bạn đã sử dụng hết tin nhắn miễn phí'
            : `Còn ${messagesRemaining}/${maxMessages} tin nhắn`
          }
        </span>
      </Flexbox>

      {/* Black Friday Promotion */}
      {!compact && (
        <Flexbox gap={4} className={styles.blackFridayBanner}>
          <Gift size={12} className={styles.giftIcon} />
          <span className={styles.blackFridayText}>🔥 BLACK FRIDAY SALE</span>
        </Flexbox>
      )}

      {/* Pricing hint */}
      {!compact && (
        <Flexbox gap={4} className={styles.pricingHint}>
          <span>Chỉ từ <strong>39,000đ/tháng</strong></span>
          <span className={styles.pricingDetail}>Quyền truy cập mô hình cao cấp</span>
        </Flexbox>
      )}

      {/* CTA Button */}
      <Link href="/settings?active=subscription" className={styles.ctaButton}>
        <Zap size={14} />
        <span>Nâng cấp ngay</span>
      </Link>
    </Flexbox>
  );
});

TrialUpgradePrompt.displayName = 'TrialUpgradePrompt';

export default TrialUpgradePrompt;

