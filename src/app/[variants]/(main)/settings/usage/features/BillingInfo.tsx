'use client';

import { Button, Card, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Calendar, CreditCard, DollarSign } from 'lucide-react';
import { memo } from 'react';
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

// Mock billing data - in real implementation, this would come from API
const billingData = {
  amount: 19.9,
  billingEmail: 'user@example.com',
  currency: 'USD',
  currentPlan: 'Premium',
  nextBilling: '2024-02-01',
  paymentMethod: '**** **** **** 1234',
  status: 'active',
  subscriptionId: 'sub_1234567890',
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

  return (
    <Flexbox gap={16}>
      <Title level={4}>{t('usage.billing.title')}</Title>

      <Card className={styles.billingCard}>
        <Flexbox gap={0}>
          <div className={styles.infoItem}>
            <CreditCard className="icon" size={20} />
            <span className={styles.label}>Current Plan</span>
            <Flexbox align="center" gap={8} horizontal style={{ flex: 1 }}>
              <span className={styles.value}>{billingData.currentPlan}</span>
              <span className={`${styles.statusBadge} ${billingData.status}`}>
                {billingData.status === 'active' ? 'Active' : 'Cancelled'}
              </span>
            </Flexbox>
          </div>

          <div className={styles.infoItem}>
            <Calendar className="icon" size={20} />
            <span className={styles.label}>Next Billing</span>
            <span className={styles.value}>{billingData.nextBilling}</span>
          </div>

          <div className={styles.infoItem}>
            <DollarSign className="icon" size={20} />
            <span className={styles.label}>Amount</span>
            <span className={styles.value}>
              ${billingData.amount} {billingData.currency} / month
            </span>
          </div>

          <div className={styles.infoItem}>
            <CreditCard className="icon" size={20} />
            <span className={styles.label}>Payment Method</span>
            <span className={styles.value}>{billingData.paymentMethod}</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.label}>Billing Email</span>
            <span className={styles.value}>{billingData.billingEmail}</span>
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
