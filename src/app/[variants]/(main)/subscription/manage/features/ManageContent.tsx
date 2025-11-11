'use client';

import { Alert, Button, Card, Divider, Empty, Spin, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, Calendar, CreditCard, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

const { Title, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  actionButtons: css`
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-block-start: 24px;
  `,
  backButton: css`
    margin-block-end: 16px;
  `,
  container: css`
    padding: 24px;
  `,
  header: css`
    margin-block-end: 32px;
  `,
  infoRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding-block: 12px;
    padding-inline: 0;
    border-block-end: 1px solid ${token.colorBorderSecondary};

    &:last-child {
      border-block-end: none;
    }
  `,
  statusActive: css`
    color: #52c41a;
    background-color: #f6ffed;
  `,
  statusBadge: css`
    display: inline-block;

    margin-block-end: 16px;
    padding-block: 4px;
    padding-inline: 12px;
    border-radius: 4px;

    font-size: 12px;
    font-weight: 600;
  `,
  statusInactive: css`
    color: #ff4d4f;
    background-color: #fff1f0;
  `,
  subscriptionCard: css`
    margin-block-end: 24px;
    padding: 24px;
    border: 1px solid ${token.colorBorder};
    border-radius: 8px;
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
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user's subscription from API
        const response = await fetch('/api/subscription/current');

        if (response.status === 404) {
          // No active subscription found
          setSubscription(null);
          setError(null);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch subscription');
        }

        const data = await response.json();
        setSubscription(data);
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
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
          <div className={`${styles.statusBadge} ${styles.statusActive}`}>Active</div>

          <Flexbox gap={16}>
            <div className={styles.infoRow}>
              <Flexbox gap={8} horizontal>
                <Package size={16} />
                <Text strong>Plan</Text>
              </Flexbox>
              <Text>
                {subscription.planId.charAt(0).toUpperCase() + subscription.planId.slice(1)}
              </Text>
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
            <Button danger>Cancel Subscription</Button>
          </div>
        </Card>
      ) : (
        <Card>
          <Empty description="No active subscription" style={{ padding: '40px 0' }}>
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
