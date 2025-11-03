'use client';

import { Alert, Button, Card, Divider, Empty, Spin, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, Calendar, CreditCard, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

const { Title, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    padding: 24px;
  `,
  header: css`
    margin-bottom: 32px;
  `,
  backButton: css`
    margin-bottom: 16px;
  `,
  subscriptionCard: css`
    border: 1px solid ${token.colorBorder};
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
  `,
  statusBadge: css`
    display: inline-block;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 16px;
  `,
  statusActive: css`
    background-color: #f6ffed;
    color: #52c41a;
  `,
  statusInactive: css`
    background-color: #fff1f0;
    color: #ff4d4f;
  `,
  infoRow: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid ${token.colorBorderSecondary};

    &:last-child {
      border-bottom: none;
    }
  `,
  actionButtons: css`
    display: flex;
    gap: 12px;
    margin-top: 24px;
    flex-wrap: wrap;
  `,
}));

interface SubscriptionData {
  billingCycle: string;
  currentPeriodEnd: string;
  currentPeriodStart: string;
  planId: string;
  status: string;
}

const ManageContent = memo(() => {
  const { styles } = useStyles();
  const router = useRouter();
  const { t } = useTranslation('setting');
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        // TODO: Implement API call to fetch user's subscription
        // For now, show placeholder
        setSubscription(null);
        setError('Subscription data not available');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handleUpgrade = () => {
    router.push('/subscription/plans');
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button
          className={styles.backButton}
          icon={<ArrowLeft />}
          onClick={handleCancel}
          type="text"
        >
          Back
        </Button>
        <Title level={2} style={{ margin: 0, marginBlockEnd: 8 }}>
          Manage Subscription
        </Title>
        <Text type="secondary">View and manage your subscription details</Text>
      </div>

      {error && (
        <Alert
          description={error}
          message="Information"
          showIcon
          style={{ marginBottom: 24 }}
          type="info"
        />
      )}

      {subscription ? (
        <Card className={styles.subscriptionCard}>
          <div className={`${styles.statusBadge} ${styles.statusActive}`}>
            Active
          </div>

          <Flexbox gap={16}>
            <div className={styles.infoRow}>
              <Flexbox gap={8} horizontal>
                <Package size={16} />
                <Text strong>Plan</Text>
              </Flexbox>
              <Text>{subscription.planId.charAt(0).toUpperCase() + subscription.planId.slice(1)}</Text>
            </div>

            <div className={styles.infoRow}>
              <Flexbox gap={8} horizontal>
                <CreditCard size={16} />
                <Text strong>Billing Cycle</Text>
              </Flexbox>
              <Text>{subscription.billingCycle}</Text>
            </div>

            <div className={styles.infoRow}>
              <Flexbox gap={8} horizontal>
                <Calendar size={16} />
                <Text strong>Renewal Date</Text>
              </Flexbox>
              <Text>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</Text>
            </div>
          </Flexbox>

          <Divider style={{ margin: '24px 0' }} />

          <div className={styles.actionButtons}>
            <Button onClick={handleUpgrade} type="primary">
              Upgrade Plan
            </Button>
            <Button danger>
              Cancel Subscription
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <Empty
            description="No active subscription"
            style={{ padding: '40px 0' }}
          >
            <Button onClick={handleUpgrade} type="primary">
              View Plans
            </Button>
          </Empty>
        </Card>
      )}
    </div>
  );
});

ManageContent.displayName = 'ManageContent';

export default ManageContent;

