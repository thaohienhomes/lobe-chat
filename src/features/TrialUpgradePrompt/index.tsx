'use client';

import { Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useStyles } from './style';
import { useTrialStatus } from './useTrialStatus';

interface TrialUpgradePromptProps {
  compact?: boolean;
}

const TrialUpgradePrompt = memo<TrialUpgradePromptProps>(({ compact = false }) => {
  const { t } = useTranslation('payment');
  const { cx, styles } = useStyles();
  const { data, isLoading, isTrialUser, maxMessages, messagesRemaining, trialExpired } =
    useTrialStatus();

  // Don't show for paid users or when loading
  if (isLoading || !data) return null;
  if (!isTrialUser) return null;

  return (
    <div className={cx(styles.outerContainer, compact && styles.compact)}>
      {/* Animated border */}
      <div className={styles.animatedBorder} />

      {/* Inner content */}
      <Flexbox className={styles.container}>
        {/* Header */}
        <Flexbox align="center" gap={8} horizontal>
          <div className={styles.iconWrapper}>
            {trialExpired ? <Zap size={16} /> : <Sparkles size={16} />}
          </div>
          <span className={styles.title}>
            {trialExpired ? t('trialBanner.titleExpired') : t('trialBanner.title')}
          </span>
        </Flexbox>

        {/* Messages remaining */}
        <span className={styles.messagesText}>
          {trialExpired
            ? t('trialBanner.trialExpiredMessage')
            : t('trialBanner.messagesRemaining', {
                max: maxMessages,
                remaining: messagesRemaining,
              })}
        </span>

        {/* Pricing hint */}
        {!compact && (
          <Flexbox align="center" className={styles.pricingHint} gap={2}>
            <span className={styles.pricingMain}>
              {t('trialBanner.pricingFrom', { price: '39,000đ' })}
            </span>
            <span className={styles.pricingDetail}>{t('trialBanner.accessPremium')}</span>
          </Flexbox>
        )}

        {/* CTA Button */}
        <Link className={styles.ctaButton} href="/settings?active=subscription">
          <div className={styles.ctaGlow} />
          <Zap className={styles.ctaIcon} size={16} />
          <span>{t('trialBanner.upgradeNow')}</span>
        </Link>
      </Flexbox>
    </div>
  );
});

TrialUpgradePrompt.displayName = 'TrialUpgradePrompt';

export default TrialUpgradePrompt;
