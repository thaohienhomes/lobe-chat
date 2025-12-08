'use client';

import { Table, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Check, X } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

const { Title } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  checkIcon: css`
    color: ${token.colorSuccess};
  `,

  compareTable: css`
    color: ${token.colorText};
    background: ${token.colorBgContainer};

    .ant-table-thead > tr > th {
      font-weight: 600;
      color: ${token.colorText};
      text-align: center;
      background: ${token.colorBgElevated};
    }

    .ant-table-tbody > tr > td {
      color: ${token.colorText};
      text-align: center;
      vertical-align: middle;
      background: ${token.colorBgContainer};
    }

    .ant-table-tbody > tr > td:first-child {
      font-weight: 500;
      text-align: start;
    }
  `,

  crossIcon: css`
    color: ${token.colorTextDisabled};
  `,
}));

interface CompareSectionProps {
  mobile?: boolean;
}

const CompareSection = memo<CompareSectionProps>(({ mobile }) => {
  const { t } = useTranslation('setting');
  const { styles, theme: token } = useStyles();

  const compareData = [
    {
      feature: 'Compute Credits',
      key: 'compute-credits',
      premium: '15,000,000 / Month',
      starter: '5,000,000 / Month',
      ultimate: '35,000,000 / Month',
    },
    {
      feature: 'GPT-4o mini Messages',
      key: 'gpt4o-mini',
      premium: '~21,100',
      starter: '~7,000',
      ultimate: '~49,100',
    },
    {
      feature: 'DeepSeek R1 Messages',
      key: 'deepseek-r1',
      premium: '~5,800',
      starter: '~1,900',
      ultimate: '~13,400',
    },
    {
      feature: 'File Storage',
      key: 'file-storage',
      premium: '2.0 GB',
      starter: '1.0 GB',
      ultimate: '4.0 GB',
    },
    {
      feature: 'Vector Storage',
      key: 'vector-storage',
      premium: '10,000 entry (≈100MB)',
      starter: '5,000 entry (≈50MB)',
      ultimate: '20,000 entry (≈200MB)',
    },
    {
      feature: 'Knowledge Base Features',
      key: 'knowledge-base',
      premium: true,
      starter: true,
      ultimate: true,
    },
    {
      feature: 'Custom API Services',
      key: 'custom-api',
      premium: true,
      starter: true,
      ultimate: true,
    },
    {
      feature: 'Priority Support',
      key: 'priority-support',
      premium: true,
      starter: false,
      ultimate: true,
    },
    {
      feature: 'Advanced AI Features',
      key: 'advanced-features',
      premium: false,
      starter: false,
      ultimate: true,
    },
  ];

  const columns = [
    {
      dataIndex: 'feature',
      key: 'feature',
      title: 'Features',
      width: mobile ? 120 : 200,
    },
    {
      dataIndex: 'starter',
      key: 'starter',
      render: (value: any) => {
        if (typeof value === 'boolean') {
          return value ? (
            <Check className={styles.checkIcon} size={16} />
          ) : (
            <X className={styles.crossIcon} size={16} />
          );
        }
        return value;
      },
      title: 'Starter',
      width: mobile ? 80 : 120,
    },
    {
      dataIndex: 'premium',
      key: 'premium',
      render: (value: any) => {
        if (typeof value === 'boolean') {
          return value ? (
            <Check className={styles.checkIcon} size={16} />
          ) : (
            <X className={styles.crossIcon} size={16} />
          );
        }
        return value;
      },
      title: 'Premium',
      width: mobile ? 80 : 120,
    },
    {
      dataIndex: 'ultimate',
      key: 'ultimate',
      render: (value: any) => {
        if (typeof value === 'boolean') {
          return value ? (
            <Check className={styles.checkIcon} size={16} />
          ) : (
            <X className={styles.crossIcon} size={16} />
          );
        }
        return value;
      },
      title: 'Ultimate',
      width: mobile ? 80 : 120,
    },
  ];

  return (
    <Flexbox gap={16}>
      <Title level={4} style={{ color: token.colorText }}>
        {t('subscription.compare.title')}
      </Title>
      <Table
        className={styles.compareTable}
        columns={columns}
        dataSource={compareData}
        pagination={false}
        scroll={{ x: mobile ? 400 : undefined }}
        size="middle"
      />
    </Flexbox>
  );
});

CompareSection.displayName = 'CompareSection';

export default CompareSection;
