'use client';

import { Skeleton, Table, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import useSWR from 'swr';

import { lambdaClient } from '@/libs/trpc/client';

const { Title } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  historyTable: css`
    .ant-table-thead > tr > th {
      font-weight: 600;
      background: ${token.colorFillAlter};
    }

    .ant-table-tbody > tr > td {
      vertical-align: middle;
    }
  `,
}));

interface UsageHistoryProps {
  mobile?: boolean;
}

interface UsageLog {
  costUSD: number;
  costVND: number;
  createdAt: Date;
  date: string;
  id: string;
  inputTokens: number;
  model: string;
  outputTokens: number;
  provider: string;
  queryComplexity: string | null;
  totalTokens: number | null;
}

const getModelColor = (model: string) => {
  if (model.includes('gpt') || model.includes('GPT')) return 'green';
  if (model.includes('deepseek') || model.includes('DeepSeek')) return 'blue';
  if (model.includes('claude') || model.includes('Claude')) return 'purple';
  if (model.includes('gemini') || model.includes('Gemini')) return 'orange';
  return 'default';
};

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    currency: 'VND',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount);
};

const UsageHistory = memo<UsageHistoryProps>(({ mobile }) => {
  const { t } = useTranslation('setting');
  const { styles } = useStyles();

  // Fetch usage history from tRPC
  const { data: usageHistory, isLoading } = useSWR(
    'usage-history',
    async () => {
      try {
        const result = await lambdaClient.costOptimization.getUsageHistory.query({ limit: 30 });
        return result;
      } catch (error) {
        console.error('Failed to fetch usage history:', error);
        return [];
      }
    },
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  if (isLoading) {
    return (
      <Flexbox gap={16}>
        <Title level={4}>{t('usage.history.title')}</Title>
        <Skeleton active paragraph={{ rows: 5 }} />
      </Flexbox>
    );
  }

  const historyData = (usageHistory || []).map((log, index: number) => ({
    cost: formatVND(log.costVND),
    date: log.date,
    key: log.id || index.toString(),
    model: log.model,
    tokens: log.totalTokens || (log.inputTokens + log.outputTokens),
  }));

  const columns = [
    {
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => {
        const d = new Date(date);
        return mobile ? d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : date;
      },
      title: 'Date',
      width: mobile ? 80 : 100,
    },
    {
      dataIndex: 'model',
      key: 'model',
      render: (model: string) => (
        <Tag color={getModelColor(model)} style={{ fontSize: mobile ? '11px' : '12px' }}>
          {mobile ? model.split(' ')[0] : model}
        </Tag>
      ),
      title: 'Model',
      width: mobile ? 100 : 200,
    },
    {
      align: 'right' as const,
      dataIndex: 'tokens',
      key: 'tokens',
      render: (tokens: number) => {
        if (mobile && tokens >= 1000) {
          return `${(tokens / 1000).toFixed(0)}K`;
        }
        return tokens.toLocaleString();
      },
      title: 'Tokens',
      width: mobile ? 80 : 100,
    },
    {
      align: 'right' as const,
      dataIndex: 'cost',
      key: 'cost',
      title: 'Cost',
      width: mobile ? 80 : 120,
    },
  ];

  return (
    <Flexbox gap={16}>
      <Title level={4}>{t('usage.history.title')}</Title>
      <Table
        className={styles.historyTable}
        columns={columns}
        dataSource={historyData}
        pagination={{
          pageSize: mobile ? 5 : 10,
          showQuickJumper: !mobile,
          showSizeChanger: !mobile,
          showTotal: (total, range) =>
            mobile
              ? `${range[0]}-${range[1]} of ${total}`
              : `${range[0]}-${range[1]} of ${total} items`,
        }}
        scroll={{ x: mobile ? 400 : undefined }}
        size={mobile ? 'small' : 'middle'}
      />
    </Flexbox>
  );
});

UsageHistory.displayName = 'UsageHistory';

export default UsageHistory;
