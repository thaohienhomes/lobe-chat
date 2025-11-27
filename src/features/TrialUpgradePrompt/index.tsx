'use client';

import { Gift, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useStyles } from './style';
import { useTrialStatus } from './useTrialStatus';

interface TrialUpgradePromptProps {
  compact?: boolean;
  /** Custom end date for countdown. Defaults to December 1, 2025 23:59:59 (UTC+7) */
  countdownEndDate?: Date;
}

// Calculate time remaining until end date
const calculateTimeRemaining = (endDate: Date) => {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
};

// Black Friday promotion end date: December 1, 2025 at 23:59:59 (Vietnam timezone UTC+7)
const BLACK_FRIDAY_END_DATE = new Date('2025-12-01T23:59:59+07:00');

// Get default countdown end date
const getDefaultEndDate = (): Date => {
  return BLACK_FRIDAY_END_DATE;
};

const TrialUpgradePrompt = memo<TrialUpgradePromptProps>(({
  compact = false,
  countdownEndDate,
}) => {
  const { t } = useTranslation('payment');
  const { cx, styles } = useStyles();
  const { data, isLoading, isTrialUser, maxMessages, messagesRemaining, trialExpired } = useTrialStatus();

  // Countdown state
  const endDate = useMemo(() => countdownEndDate || getDefaultEndDate(), [countdownEndDate]);
  const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeRemaining(endDate));

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  // Format number with leading zero
  const formatNumber = useCallback((num: number) => num.toString().padStart(2, '0'), []);

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
            {trialExpired
              ? t('trialBanner.titleExpired')
              : t('trialBanner.title')
            }
          </span>
        </Flexbox>

        {/* Messages remaining */}
        <span className={styles.messagesText}>
          {trialExpired
            ? t('trialBanner.trialExpiredMessage')
            : t('trialBanner.messagesRemaining', { max: maxMessages, remaining: messagesRemaining })
          }
        </span>

        {/* Black Friday Banner with Countdown */}
        {!compact && (
          <div className={styles.blackFridayCard}>
            {/* Shimmer overlay */}
            <div className={styles.shimmerOverlay} />

            <Flexbox align="center" className={styles.blackFridayContent} gap={8}>
              <Flexbox align="center" gap={6} horizontal>
                <Gift className={styles.giftIcon} size={14} />
                <span className={styles.blackFridayText}>
                  🔥 {t('trialBanner.blackFriday')}
                </span>
              </Flexbox>

              {/* Countdown Timer - Days:Hours:Minutes:Seconds */}
              <Flexbox align="center" className={styles.countdownContainer} gap={4} horizontal>
                <div className={styles.countdownItem}>
                  <span className={styles.countdownNumber}>{timeRemaining.days}</span>
                  <span className={styles.countdownLabel}>{t('trialBanner.days')}</span>
                </div>
                <span className={styles.countdownSeparator}>:</span>
                <div className={styles.countdownItem}>
                  <span className={styles.countdownNumber}>{formatNumber(timeRemaining.hours)}</span>
                  <span className={styles.countdownLabel}>{t('trialBanner.hours')}</span>
                </div>
                <span className={styles.countdownSeparator}>:</span>
                <div className={styles.countdownItem}>
                  <span className={styles.countdownNumber}>{formatNumber(timeRemaining.minutes)}</span>
                  <span className={styles.countdownLabel}>{t('trialBanner.minutes')}</span>
                </div>
                <span className={styles.countdownSeparator}>:</span>
                <div className={cx(styles.countdownItem, styles.countdownItemHighlight)}>
                  <span className={styles.countdownNumber}>{formatNumber(timeRemaining.seconds)}</span>
                  <span className={styles.countdownLabel}>{t('trialBanner.seconds')}</span>
                </div>
              </Flexbox>
            </Flexbox>
          </div>
        )}

        {/* Pricing hint */}
        {!compact && (
          <Flexbox align="center" className={styles.pricingHint} gap={2}>
            <span className={styles.pricingMain}>
              {t('trialBanner.pricingFrom', { price: '39,000đ' })}
            </span>
            <span className={styles.pricingDetail}>
              {t('trialBanner.accessPremium')}
            </span>
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

