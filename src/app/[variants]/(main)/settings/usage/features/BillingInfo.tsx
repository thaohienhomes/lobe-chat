'use client';

import { useUser } from '@clerk/nextjs';
import { Button, Card, Skeleton, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Calendar, CreditCard, DollarSign } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

const { Title } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  billingCard: css`
    border: 1px solid ${token.colorBorder};
    border-radius: 8px;

    .ant-card-body {
      padding: 20px;
    }
  `,

  infoItem: css`
    display: flex;
    gap: 12px;
    align-items: center;

    padding-block: 12px;
    padding-inline: 0;
    border-block-end: 1px solid ${token.colorBorderSecondary};

    &:last-child {
      border-block-end: none;
    }

    .icon {
      flex-shrink: 0;
      color: ${token.colorPrimary};
    }
  `,

  label: css`
    min-width: 120px;
    font-size: 14px;
    color: ${token.colorTextSecondary};
  `,

  statusBadge: css`
    padding-block: 4px;
    padding-inline: 8px;
    border-radius: 4px;

    font-size: 12px;
    font-weight: 500;

    &.active {
      color: ${token.colorSuccess};
      background: ${token.colorSuccessBg};
    }

    &.cancelled {
      color: ${token.colorError};
      background: ${token.colorErrorBg};
    }
  `,

  value: css`
    flex: 1;
    font-weight: 500;
    color: ${token.colorText};
  `,
}));

interface BillingInfoProps {
  mobile?: boolean;
}

interface SubscriptionData {
  billingCycle: string;
  currentPeriodEnd: string;
  currentPeriodStart: string;
  planId: string;
  status: string;
}

/**
 * Plan pricing for billing display based on PRICING_MASTERPLAN.md
 * Uses Phở Points system
 */
const PLAN_PRICING: Record<string, { displayName: string; monthlyPoints: number; price: number }> =
  {
    // Global Plans (USD via Polar.sh)
    gl_lifetime: { displayName: 'Founding Member (Lifetime)', monthlyPoints: 2_000_000, price: 0 },
    gl_premium: { displayName: 'Premium', monthlyPoints: 2_000_000, price: 0 },
    gl_standard: { displayName: 'Standard', monthlyPoints: 500_000, price: 0 },
    gl_starter: { displayName: 'Starter', monthlyPoints: 200_000, price: 0 },
    // Legacy mappings (for backward compatibility)
    premium: { displayName: 'Phở Tái', monthlyPoints: 300_000, price: 69_000 },
    starter: { displayName: 'Phở Không Người Lái', monthlyPoints: 50_000, price: 0 },
    ultimate: { displayName: 'Phở Đặc Biệt', monthlyPoints: 2_000_000, price: 199_000 },
    // Vietnam Plans
    vn_basic: { displayName: 'Phở Tái', monthlyPoints: 300_000, price: 69_000 },
    vn_free: { displayName: 'Phở Không Người Lái', monthlyPoints: 50_000, price: 0 },
    vn_pro: { displayName: 'Phở Đặc Biệt', monthlyPoints: 2_000_000, price: 199_000 },
    vn_team: { displayName: 'Lẩu Phở (Team)', monthlyPoints: 0, price: 149_000 },
  };

const handleManageSubscription = () => {
  // Navigate to subscription management
  window.location.href = '/subscription/manage';
};

const handleUpdatePayment = () => {
  // Navigate to payment method update
  window.location.href = '/subscription/payment';
};

const BillingInfo = memo<BillingInfoProps>(({ mobile }) => {
  const { t } = useTranslation('setting');
  const { styles } = useStyles();
  const { user } = useUser();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/subscription/current');

        if (response.status === 404) {
          // No active subscription
          setSubscription(null);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }

        const data = await response.json();
        setSubscription(data);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <Flexbox gap={16}>
        <Typography.Title level={4}>{t('usage.billing.title')}</Typography.Title>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Flexbox>
    );
  }

  if (!subscription) {
    return (
      <Flexbox gap={16}>
        <Typography.Title level={4}>{t('usage.billing.title')}</Typography.Title>
        <Card className={styles.billingCard}>
          <Flexbox align="center" gap={16} style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Typography.Text type="secondary">No active subscription</Typography.Text>
            <Button onClick={handleManageSubscription} type="primary">
              View Plans
            </Button>
          </Flexbox>
        </Card>
      </Flexbox>
    );
  }

  // Calculate billing information from subscription data
  const planInfo = PLAN_PRICING[subscription.planId] || PLAN_PRICING.vn_free;
  const planName = planInfo.displayName;
  const amount = planInfo.price;
  const nextBilling = new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const billingEmail = user?.primaryEmailAddress?.emailAddress || 'N/A';

  return (
    <Flexbox gap={16}>
      <Title level={4}>{t('usage.billing.title')}</Title>

      <Card className={styles.billingCard}>
        <Flexbox gap={0}>
          <div className={styles.infoItem}>
            <CreditCard className="icon" size={20} />
            <span className={styles.label}>Current Plan</span>
            <Flexbox align="center" gap={8} horizontal style={{ flex: 1 }}>
              <span className={styles.value}>{planName}</span>
              <span className={`${styles.statusBadge} ${subscription.status}`}>
                {subscription.status === 'active' ? 'Active' : 'Cancelled'}
              </span>
            </Flexbox>
          </div>

          <div className={styles.infoItem}>
            <Calendar className="icon" size={20} />
            <span className={styles.label}>Next Billing</span>
            <span className={styles.value}>{nextBilling}</span>
          </div>

          <div className={styles.infoItem}>
            <DollarSign className="icon" size={20} />
            <span className={styles.label}>Amount</span>
            <span className={styles.value}>
              {amount.toLocaleString('vi-VN')} VND / {subscription.billingCycle}
            </span>
          </div>

          <div className={styles.infoItem}>
            <CreditCard className="icon" size={20} />
            <span className={styles.label}>Payment Method</span>
            <span className={styles.value}>Sepay (Bank Transfer)</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.label}>Billing Email</span>
            <span className={styles.value}>{billingEmail}</span>
          </div>
        </Flexbox>

        <Flexbox gap={12} horizontal={!mobile} style={{ marginTop: 20 }}>
          <Button
            onClick={handleManageSubscription}
            style={{ flex: mobile ? 1 : 'none' }}
            type="primary"
          >
            Manage Subscription
          </Button>
          <Button onClick={handleUpdatePayment} style={{ flex: mobile ? 1 : 'none' }}>
            Update Payment Method
          </Button>
        </Flexbox>
      </Card>
    </Flexbox>
  );
});

BillingInfo.displayName = 'BillingInfo';

export default BillingInfo;
