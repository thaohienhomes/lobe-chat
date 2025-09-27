'use client';

import { Table, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

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

// Mock usage history data
const historyData = [
  {
    cost: '$2.50',
    credits: 250_000,
    date: '2024-01-15',
    key: '1',
    messages: 1250,
    model: 'GPT-4o mini',
    tokens: 125_000,
  },
  {
    cost: '$4.45',
    credits: 445_000,
    date: '2024-01-14',
    key: '2',
    messages: 450,
    model: 'DeepSeek R1',
    tokens: 89_000,
  },
  {
    cost: '$1.78',
    credits: 178_000,
    date: '2024-01-13',
    key: '3',
    messages: 890,
    model: 'GPT-4o mini',
    tokens: 89_000,
  },
  {
    cost: '$3.20',
    credits: 320_000,
    date: '2024-01-12',
    key: '4',
    messages: 320,
    model: 'Claude 3.5 Sonnet',
    tokens: 64_000,
  },
  {
    cost: '$1.34',
    credits: 134_000,
    date: '2024-01-11',
    key: '5',
    messages: 670,
    model: 'GPT-4o mini',
    tokens: 67_000,
  },
];

const getModelColor = (model: string) => {
  if (model.includes('GPT')) return 'green';
  if (model.includes('DeepSeek')) return 'blue';
  if (model.includes('Claude')) return 'purple';
  return 'default';
};

const UsageHistory = memo<UsageHistoryProps>(({ mobile }) => {
  const { t } = useTranslation('setting');
  const { styles } = useStyles();

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
      width: mobile ? 100 : 150,
    },
    {
      align: 'right' as const,
      dataIndex: 'messages',
      key: 'messages',
      title: 'Messages',
      width: mobile ? 60 : 80,
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
      width: mobile ? 60 : 80,
    },
    {
      align: 'right' as const,
      dataIndex: 'credits',
      key: 'credits',
      render: (credits: number) => {
        if (mobile && credits >= 1000) {
          return `${(credits / 1000).toFixed(0)}K`;
        }
        return credits.toLocaleString();
      },
      title: 'Credits',
      width: mobile ? 60 : 80,
    },
    {
      align: 'right' as const,
      dataIndex: 'cost',
      key: 'cost',
      title: 'Cost',
      width: mobile ? 50 : 70,
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
