/**
 * Tier Usage Display Component
 * Shows daily Tier 2/Tier 3 usage limits
 *
 * Based on PRICING_MASTERPLAN.md.md
 */
'use client';

import { Progress, Skeleton, Tooltip, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Infinity, Sparkles, Zap } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { getTierUsagePercent, useUsageStats } from '@/hooks/useUsageStats';

/**
 * Tier Usage Display Component
 * Shows daily Tier 2/Tier 3 usage limits
 *
 * Based on PRICING_MASTERPLAN.md.md
 */

const { Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    padding: 12px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;
    background: ${token.colorBgContainer};
  `,
  label: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
  tier2: css`
    color: #1890ff;
    background: #e6f7ff;
  `,
  tier3: css`
    color: #fa8c16;
    background: #fff7e6;
  `,
  tierBadge: css`
    display: flex;
    gap: 4px;
    align-items: center;

    padding-block: 2px;
    padding-inline: 8px;
    border-radius: 4px;

    font-size: 11px;
    font-weight: 600;
  `,
  unlimited: css`
    display: flex;
    gap: 4px;
    align-items: center;

    font-size: 12px;
    color: #52c41a;
  `,
}));

interface TierUsageDisplayProps {
  showTier2?: boolean;
  showTier3?: boolean;
}

const TierUsageDisplay = memo<TierUsageDisplayProps>(({ showTier2 = true, showTier3 = true }) => {
  const { styles, cx } = useStyles();
  const { stats, isLoading } = useUsageStats();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const tier2Percent = getTierUsagePercent(stats.dailyTier2Count, stats.dailyTier2Limit);
  const tier3Percent = getTierUsagePercent(stats.dailyTier3Count, stats.dailyTier3Limit);

  const renderTierUsage = (tier: 2 | 3, count: number, limit: number, percent: number) => {
    const isUnlimited = limit === -1;
    const isNoAccess = limit === 0;
    const tierClass = tier === 2 ? styles.tier2 : styles.tier3;
    const tierIcon = tier === 2 ? <Zap size={12} /> : <Sparkles size={12} />;
    const tierName = tier === 2 ? 'Tier 2' : 'Tier 3';
    const tierDesc = tier === 2 ? 'GPT-4o, Claude Sonnet' : 'Claude Opus, GPT-4 Turbo';

    if (isNoAccess) {
      return (
        <Tooltip title={`Upgrade to access ${tierName} models`}>
          <Flexbox gap={4}>
            <Flexbox align="center" gap={8} horizontal justify="space-between">
              <div className={cx(styles.tierBadge, tierClass)}>
                {tierIcon}
                {tierName}
              </div>
              <Text type="secondary">Not available</Text>
            </Flexbox>
          </Flexbox>
        </Tooltip>
      );
    }

    return (
      <Tooltip title={tierDesc}>
        <Flexbox gap={4}>
          <Flexbox align="center" gap={8} horizontal justify="space-between">
            <div className={cx(styles.tierBadge, tierClass)}>
              {tierIcon}
              {tierName}
            </div>
            {isUnlimited ? (
              <div className={styles.unlimited}>
                <Infinity size={14} />
                Unlimited
              </div>
            ) : (
              <Text className={styles.label}>
                {count}/{limit} today
              </Text>
            )}
          </Flexbox>
          {!isUnlimited && (
            <Progress
              percent={100 - percent}
              showInfo={false}
              size="small"
              strokeColor={percent > 80 ? '#ff4d4f' : percent > 50 ? '#faad14' : '#52c41a'}
            />
          )}
        </Flexbox>
      </Tooltip>
    );
  };

  return (
    <div className={styles.container}>
      <Flexbox gap={12}>
        {showTier2 &&
          renderTierUsage(2, stats.dailyTier2Count, stats.dailyTier2Limit, tier2Percent)}
        {showTier3 &&
          renderTierUsage(3, stats.dailyTier3Count, stats.dailyTier3Limit, tier3Percent)}
      </Flexbox>
    </div>
  );
});

TierUsageDisplay.displayName = 'TierUsageDisplay';

export default TierUsageDisplay;
