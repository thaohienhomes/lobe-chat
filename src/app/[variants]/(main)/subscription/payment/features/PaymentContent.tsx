'use client';

import { Alert, Button, Card, Divider, Form, Input, Radio, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, CreditCard, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useState } from 'react';
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
  methodCard: css`
    border: 1px solid ${token.colorBorder};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      border-color: ${token.colorPrimary};
      background-color: ${token.colorPrimaryBg};
    }
  `,
  methodSelected: css`
    border-color: ${token.colorPrimary};
    background-color: ${token.colorPrimaryBg};
  `,
  methodIcon: css`
    font-size: 24px;
    margin-right: 12px;
  `,
}));

const PaymentContent = memo(() => {
  const { styles, cx } = useStyles();
  const router = useRouter();
  const { t } = useTranslation('setting');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank');
  const [loading, setLoading] = useState(false);

  const handleCancel = () => {
    router.back();
  };

  const handleUpdatePaymentMethod = async () => {
    setLoading(true);
    try {
      // TODO: Implement payment method update logic
      console.log('Updating payment method to:', paymentMethod);
      // Show success message
      router.push('/subscription/manage');
    } catch (error) {
      console.error('Failed to update payment method:', error);
    } finally {
      setLoading(false);
    }
  };

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
          Update Payment Method
        </Title>
        <Text type="secondary">Choose your preferred payment method for future subscriptions</Text>
      </div>

      <Alert
        description="Your payment method will be used for all future subscription renewals and upgrades."
        message="Payment Method"
        showIcon
        style={{ marginBottom: 24 }}
        type="info"
      />

      <Card style={{ marginBottom: 24 }}>
        <Flexbox gap={16}>
          <Title level={4}>Available Payment Methods</Title>

          <div
            className={cx(styles.methodCard, paymentMethod === 'bank' && styles.methodSelected)}
            onClick={() => setPaymentMethod('bank')}
            role="button"
            tabIndex={0}
          >
            <Flexbox gap={12} horizontal>
              <QrCode className={styles.methodIcon} />
              <Flexbox gap={4}>
                <Text strong>Bank Transfer (QR Code)</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Fast and secure bank transfer via QR code
                </Text>
              </Flexbox>
            </Flexbox>
          </div>

          <div
            className={cx(styles.methodCard, paymentMethod === 'card' && styles.methodSelected)}
            onClick={() => setPaymentMethod('card')}
            role="button"
            tabIndex={0}
          >
            <Flexbox gap={12} horizontal>
              <CreditCard className={styles.methodIcon} />
              <Flexbox gap={4}>
                <Text strong>Credit Card</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Visa, Mastercard, and other major credit cards
                </Text>
              </Flexbox>
            </Flexbox>
          </div>
        </Flexbox>

        <Divider style={{ margin: '24px 0' }} />

        <Flexbox gap={12} horizontal style={{ justifyContent: 'flex-end' }}>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button loading={loading} onClick={handleUpdatePaymentMethod} type="primary">
            Update Payment Method
          </Button>
        </Flexbox>
      </Card>

      <Card>
        <Title level={5}>Payment Method Details</Title>
        {paymentMethod === 'bank' ? (
          <Flexbox gap={12}>
            <Text>
              <strong>Bank Transfer (QR Code)</strong>
            </Text>
            <Text type="secondary">
              You will receive a QR code that you can scan with your banking app to complete the
              payment. This is the fastest and most secure method for Vietnamese users.
            </Text>
            <ul style={{ marginTop: 12 }}>
              <li>Fast processing (usually within minutes)</li>
              <li>Secure and encrypted</li>
              <li>No additional fees</li>
              <li>Works with all Vietnamese banks</li>
            </ul>
          </Flexbox>
        ) : (
          <Flexbox gap={12}>
            <Text>
              <strong>Credit Card</strong>
            </Text>
            <Text type="secondary">
              Pay securely with your credit card. We support all major credit cards including Visa
              and Mastercard.
            </Text>
            <ul style={{ marginTop: 12 }}>
              <li>Instant payment processing</li>
              <li>Secure PCI DSS compliant</li>
              <li>International support</li>
              <li>Automatic renewal available</li>
            </ul>
          </Flexbox>
        )}
      </Card>
    </div>
  );
});

PaymentContent.displayName = 'PaymentContent';

export default PaymentContent;

