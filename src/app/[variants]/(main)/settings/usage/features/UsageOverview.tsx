'use client';

import { Card, Progress, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

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

// Mock data - in real implementation, this would come from API
const usageData = {
  billingCycle: 'Monthly',
  computeCredits: {
    percentage: 57,
    total: 15_000_000,
    used: 8_500_000,
  },
  currentPlan: 'Premium',
  cycleEnd: '2024-01-31',
  cycleStart: '2024-01-01',
  fileStorage: {
    percentage: 60,
    total: 2,
    used: 1.2,
  },
  messagesThisMonth: 12_450,
  modelsUsed: 8,
  vectorStorage: {
    percentage: 65,
    total: 10_000,
    used: 6500,
  },
};

const formatNumber = (num: number) => {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const UsageOverview = memo<UsageOverviewProps>(({ mobile }) => {
  const { t } = useTranslation('setting');
  const { styles, theme } = useStyles();

  return (
    <Flexbox gap={24}>
      <Flexbox gap={16}>
        <Title level={4}>{t('usage.overview.title')}</Title>
        <Text type="secondary">
          Current billing cycle: {usageData.cycleStart} - {usageData.cycleEnd}
        </Text>
      </Flexbox>

      <Flexbox gap={16} horizontal={!mobile} style={{ flexWrap: 'wrap' }}>
        <Card className={styles.usageCard} style={{ flex: 1, minWidth: mobile ? '100%' : '300px' }}>
          <Flexbox gap={16}>
            <Flexbox align="center" gap={8} horizontal justify="space-between">
              <Text strong>Compute Credits</Text>
              <Text type="secondary">{usageData.currentPlan} Plan</Text>
            </Flexbox>

            <div className={styles.progressContainer}>
              <Progress
                percent={usageData.computeCredits.percentage}
                strokeColor={
                  usageData.computeCredits.percentage > 80
                    ? theme.colorError
                    : usageData.computeCredits.percentage > 60
                      ? theme.colorWarning
                      : theme.colorSuccess
                }
              />
            </div>

            <Flexbox align="center" horizontal justify="space-between">
              <Text>
                {formatNumber(usageData.computeCredits.used)} /{' '}
                {formatNumber(usageData.computeCredits.total)}
              </Text>
              <Text type="secondary">
                {formatNumber(usageData.computeCredits.total - usageData.computeCredits.used)}{' '}
                remaining
              </Text>
            </Flexbox>
          </Flexbox>
        </Card>

        <Card className={styles.usageCard} style={{ flex: 1, minWidth: mobile ? '100%' : '300px' }}>
          <Flexbox gap={16}>
            <Text strong>File Storage</Text>

            <div className={styles.progressContainer}>
              <Progress
                percent={usageData.fileStorage.percentage}
                strokeColor={
                  usageData.fileStorage.percentage > 80
                    ? theme.colorError
                    : usageData.fileStorage.percentage > 60
                      ? theme.colorWarning
                      : theme.colorSuccess
                }
              />
            </div>

            <Flexbox align="center" horizontal justify="space-between">
              <Text>
                {usageData.fileStorage.used} GB / {usageData.fileStorage.total} GB
              </Text>
              <Text type="secondary">
                {(usageData.fileStorage.total - usageData.fileStorage.used).toFixed(1)} GB remaining
              </Text>
            </Flexbox>
          </Flexbox>
        </Card>
      </Flexbox>

      <Flexbox gap={16} horizontal={!mobile} style={{ flexWrap: 'wrap' }}>
        <div className={styles.usageItem} style={{ flex: 1, minWidth: mobile ? '100%' : '200px' }}>
          <Flexbox align="center" gap={8}>
            <div className={styles.statNumber}>{formatNumber(usageData.messagesThisMonth)}</div>
            <div className={styles.statLabel}>Messages This Month</div>
          </Flexbox>
        </div>

        <div className={styles.usageItem} style={{ flex: 1, minWidth: mobile ? '100%' : '200px' }}>
          <Flexbox align="center" gap={8}>
            <div className={styles.statNumber}>{usageData.modelsUsed}</div>
            <div className={styles.statLabel}>AI Models Used</div>
          </Flexbox>
        </div>

        <div className={styles.usageItem} style={{ flex: 1, minWidth: mobile ? '100%' : '200px' }}>
          <Flexbox align="center" gap={8}>
            <div className={styles.statNumber}>{formatNumber(usageData.vectorStorage.used)}</div>
            <div className={styles.statLabel}>Vector Entries</div>
          </Flexbox>
        </div>
      </Flexbox>
    </Flexbox>
  );
});

UsageOverview.displayName = 'UsageOverview';

export default UsageOverview;
