/**
 * Usage Meter Component
 * Displays Phở Points balance with progress bar
 *
 * Based on PRICING_MASTERPLAN.md.md
 */
'use client';

import { Progress, Skeleton, Tooltip, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Flame, Zap } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import {
  formatPoints,
  getDaysUntilReset,
  getPointsUsagePercent,
  useUsageStats,
} from '@/hooks/useUsageStats';

/**
 * Usage Meter Component
 * Displays Phở Points balance with progress bar
 *
 * Based on PRICING_MASTERPLAN.md.md
 */

const { Text, Title } = Typography;

// Determine progress color based on usage
const getProgressColor = (percent: number) => {
  if (percent < 50) return '#52c41a'; // Green
  if (percent < 80) return '#faad14'; // Yellow
  return '#ff4d4f'; // Red
};

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    padding: 16px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    background: ${token.colorBgContainer};
  `,
  label: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
  points: css`
    font-size: 24px;
    font-weight: 700;
    color: ${token.colorText};
  `,
  streak: css`
    display: flex;
    gap: 4px;
    align-items: center;

    padding-block: 4px;
    padding-inline: 8px;
    border-radius: 8px;

    font-size: 12px;
    font-weight: 600;
    color: white;

    background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  `,
}));

interface UsageMeterProps {
  compact?: boolean;
}

const UsageMeter = memo<UsageMeterProps>(({ compact }) => {
  const { styles } = useStyles();
  const { stats, isLoading } = useUsageStats();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Skeleton active paragraph={{ rows: 2 }} title={{ width: 150 }} />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const usagePercent = getPointsUsagePercent(stats);
  const daysUntilReset = getDaysUntilReset(stats.pointsResetDate);

  if (compact) {
    return (
      <Tooltip
        title={`${formatPoints(stats.phoPointsBalance)} / ${formatPoints(stats.totalMonthlyPoints)} points`}
      >
        <Flexbox align="center" gap={8} horizontal>
          <Zap size={16} style={{ color: '#faad14' }} />
          <Progress
            percent={100 - usagePercent}
            showInfo={false}
            size="small"
            strokeColor={getProgressColor(usagePercent)}
            style={{ width: 60 }}
          />
          <Text style={{ fontSize: 12 }}>{formatPoints(stats.phoPointsBalance)}</Text>
        </Flexbox>
      </Tooltip>
    );
  }

  return (
    <div className={styles.container}>
      <Flexbox gap={12}>
        {/* Header */}
        <Flexbox align="center" horizontal justify="space-between">
          <Flexbox align="center" gap={8} horizontal>
            <Zap size={20} style={{ color: '#faad14' }} />
            <Title level={5} style={{ margin: 0 }}>
              Phở Points
            </Title>
          </Flexbox>
          {stats.streakDays > 0 && (
            <div className={styles.streak}>
              <Flame size={14} />
              {stats.streakDays} ngày
            </div>
          )}
        </Flexbox>

        {/* Points Display */}
        <Flexbox gap={4}>
          <div>
            <span className={styles.points}>{formatPoints(stats.phoPointsBalance)}</span>
            <span className={styles.label}> / {formatPoints(stats.totalMonthlyPoints)}</span>
          </div>
          <Progress
            percent={100 - usagePercent}
            showInfo={false}
            strokeColor={getProgressColor(usagePercent)}
          />
        </Flexbox>

        {/* Reset Info */}
        {daysUntilReset > 0 && (
          <Text className={styles.label}>Reset trong {daysUntilReset} ngày</Text>
        )}
      </Flexbox>
    </div>
  );
});

UsageMeter.displayName = 'UsageMeter';

export default UsageMeter;
