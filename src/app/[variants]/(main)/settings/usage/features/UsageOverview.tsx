'use client';

import { Alert, Button, Card, Progress, Skeleton, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import useSWR from 'swr';

import { lambdaClient } from '@/libs/trpc/client';

const { Title, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  progressContainer: css`
    .ant-progress-text {
      font-size: 12px;
      color: ${token.colorTextSecondary};
    }
  `,

  statLabel: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,

  statNumber: css`
    font-size: 24px;
    font-weight: 700;
    color: ${token.colorText};
  `,

  usageCard: css`
    border: 1px solid ${token.colorBorder};
    border-radius: 8px;

    .ant-card-body {
      padding: 20px;
    }
  `,

  usageItem: css`
    padding: 16px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 6px;
    background: ${token.colorFillAlter};
  `,
}));

interface UsageOverviewProps {
  mobile?: boolean;
}

interface UsageSummary {
  budgetRemainingVND: number;
  month: string;
  totalCostVND: number;
  totalQueries: number;
  totalTokens: number;
  usagePercentage: number;
}

const formatNumber = (num: number) => {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    currency: 'VND',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: 'currency',
  }).format(amount);
};

const UsageOverview = memo<UsageOverviewProps>(({ mobile }) => {
  const { t } = useTranslation('setting');
  const { styles, theme } = useStyles();
  const [usageData, setUsageData] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch usage summary from tRPC
  const { data: summary, isLoading } = useSWR(
    'usage-summary',
    async () => {
      try {
        const result = await lambdaClient.costOptimization.getUsageSummary.query({});
        setUsageData(result);
        return result;
      } catch (error) {
        console.error('Failed to fetch usage summary:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  useEffect(() => {
    if (summary) {
      setUsageData(summary);
    }
  }, [summary]);

  if (loading || isLoading) {
    return (
      <Flexbox gap={24}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Flexbox>
    );
  }

  // If no usage data, it means user doesn't have an active subscription
  if (!usageData) {
    return (
      <Flexbox gap={24}>
        <Title level={4}>{t('usage.overview.title')}</Title>
        <Alert
          description="You don't have an active subscription. Subscribe to a plan to start using AI features and track your usage."
          message="No Active Subscription"
          showIcon
          type="info"
          action={
            <Button type="primary" href="/subscription/plans">
              View Plans
            </Button>
          }
        />
      </Flexbox>
    );
  }

  // Calculate cycle dates
  const [year, month] = usageData.month.split('-');
  const cycleStart = new Date(parseInt(year), parseInt(month) - 1, 1);
  const cycleEnd = new Date(parseInt(year), parseInt(month), 0);

  return (
    <Flexbox gap={24}>
      <Flexbox gap={16}>
        <Title level={4}>{t('usage.overview.title')}</Title>
        <Text type="secondary">
          Current billing cycle: {cycleStart.toLocaleDateString()} - {cycleEnd.toLocaleDateString()}
        </Text>
      </Flexbox>

      <Flexbox gap={16} horizontal={!mobile} style={{ flexWrap: 'wrap' }}>
        <Card className={styles.usageCard} style={{ flex: 1, minWidth: mobile ? '100%' : '300px' }}>
          <Flexbox gap={16}>
            <Flexbox align="center" gap={8} horizontal justify="space-between">
              <Text strong>Monthly Budget Usage</Text>
            </Flexbox>

            <div className={styles.progressContainer}>
              <Progress
                percent={usageData.usagePercentage}
                strokeColor={
                  usageData.usagePercentage > 80
                    ? theme.colorError
                    : usageData.usagePercentage > 60
                      ? theme.colorWarning
                      : theme.colorSuccess
                }
              />
            </div>

            <Flexbox align="center" horizontal justify="space-between">
              <Text>
                {formatVND(usageData.totalCostVND)} used
              </Text>
              <Text type="secondary">
                {formatVND(usageData.budgetRemainingVND)} remaining
              </Text>
            </Flexbox>
          </Flexbox>
        </Card>

        <Card className={styles.usageCard} style={{ flex: 1, minWidth: mobile ? '100%' : '300px' }}>
          <Flexbox gap={16}>
            <Text strong>Query Statistics</Text>

            <div className={styles.progressContainer}>
              <Progress
                percent={Math.min(100, (usageData.totalQueries / 1000) * 100)}
                strokeColor={theme.colorInfo}
              />
            </div>

            <Flexbox align="center" horizontal justify="space-between">
              <Text>
                {formatNumber(usageData.totalQueries)} queries
              </Text>
              <Text type="secondary">
                {formatNumber(usageData.totalTokens)} tokens
              </Text>
            </Flexbox>
          </Flexbox>
        </Card>
      </Flexbox>

      <Flexbox gap={16} horizontal={!mobile} style={{ flexWrap: 'wrap' }}>
        <div className={styles.usageItem} style={{ flex: 1, minWidth: mobile ? '100%' : '200px' }}>
          <Flexbox align="center" gap={8}>
            <div className={styles.statNumber}>{formatNumber(usageData.totalQueries)}</div>
            <div className={styles.statLabel}>Total Queries</div>
          </Flexbox>
        </div>

        <div className={styles.usageItem} style={{ flex: 1, minWidth: mobile ? '100%' : '200px' }}>
          <Flexbox align="center" gap={8}>
            <div className={styles.statNumber}>{formatNumber(usageData.totalTokens)}</div>
            <div className={styles.statLabel}>Total Tokens</div>
          </Flexbox>
        </div>

        <div className={styles.usageItem} style={{ flex: 1, minWidth: mobile ? '100%' : '200px' }}>
          <Flexbox align="center" gap={8}>
            <div className={styles.statNumber}>{usageData.usagePercentage.toFixed(0)}%</div>
            <div className={styles.statLabel}>Budget Used</div>
          </Flexbox>
        </div>
      </Flexbox>
    </Flexbox>
  );
});

UsageOverview.displayName = 'UsageOverview';

export default UsageOverview;
