'use client';

import { Alert, Button, Card, Divider, Form, Input, Radio, Switch, Typography, message } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, CreditCard, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

const { Title, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    padding: 24px;
  `,
  header: css`
    margin-block-end: 32px;
  `,
  backButton: css`
    margin-block-end: 16px;
  `,
  methodCard: css`
    cursor: pointer;

    margin-block-end: 16px;
    padding: 16px;
    border: 1px solid ${token.colorBorder};
    border-radius: 8px;

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
    margin-inline-end: 12px;
    font-size: 24px;
  `,
}));

const PaymentContent = memo(() => {
  const { styles, cx } = useStyles();
  const router = useRouter();
  const { t } = useTranslation('setting');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'credit_card'>('bank_transfer');
  const [autoRenewalEnabled, setAutoRenewalEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPreference, setLoadingPreference] = useState(true);

  // Load current payment preference on mount
  useEffect(() => {
    const loadPaymentPreference = async () => {
      try {
        const response = await fetch('/api/subscription/payment-method');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            if (data.data.preferredPaymentMethod) {
              setPaymentMethod(data.data.preferredPaymentMethod as 'bank_transfer' | 'credit_card');
            }
            setAutoRenewalEnabled(data.data.autoRenewalEnabled || false);
          }
        }
      } catch (error) {
        console.error('Failed to load payment preference:', error);
      } finally {
        setLoadingPreference(false);
      }
    };

    loadPaymentPreference();
  }, []);

  const handleCancel = () => {
    router.back();
  };

  const handleUpdatePaymentMethod = async () => {
    setLoading(true);
    try {
      // Validate: auto-renewal only for credit card
      if (paymentMethod === 'bank_transfer' && autoRenewalEnabled) {
        message.error('Auto-renewal is not supported for bank transfer payments');
        setLoading(false);
        return;
      }

      // Call API to save payment preference
      const response = await fetch('/api/subscription/payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod,
          autoRenewalEnabled: paymentMethod === 'credit_card' ? autoRenewalEnabled : false,
          // Note: paymentTokenId will be added later when implementing Polar.sh tokenization
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        message.success('Payment method preference updated successfully');
        // Redirect to subscription management page after successful save
        setTimeout(() => {
          router.push('/subscription/manage');
        }, 1000);
      } else {
        message.error(data.error || 'Failed to update payment method preference');
      }
    } catch (error) {
      console.error('Failed to update payment method:', error);
      message.error('Unable to update payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPreference) {
    return (
      <div className={styles.container}>
        <Flexbox align="center" justify="center" style={{ minHeight: '400px' }}>
          <Text type="secondary">Loading payment preferences...</Text>
        </Flexbox>
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
            className={cx(styles.methodCard, paymentMethod === 'bank_transfer' && styles.methodSelected)}
            onClick={() => {
              setPaymentMethod('bank_transfer');
              setAutoRenewalEnabled(false); // Auto-renewal not supported for bank transfer
            }}
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
            className={cx(styles.methodCard, paymentMethod === 'credit_card' && styles.methodSelected)}
            onClick={() => setPaymentMethod('credit_card')}
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

        {/* Auto-Renewal Toggle (only for credit card) */}
        {paymentMethod === 'credit_card' && (
          <>
            <Divider style={{ margin: '24px 0' }} />
            <Flexbox gap={12}>
              <Flexbox gap={8} horizontal style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Flexbox gap={4}>
                  <Text strong>Enable Auto-Renewal</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Automatically renew your subscription when it expires
                  </Text>
                </Flexbox>
                <Switch
                  checked={autoRenewalEnabled}
                  onChange={setAutoRenewalEnabled}
                />
              </Flexbox>
              {autoRenewalEnabled && (
                <Alert
                  description="Your credit card will be automatically charged when your subscription expires. You can disable auto-renewal at any time."
                  message="Auto-Renewal Enabled"
                  showIcon
                  type="warning"
                />
              )}
            </Flexbox>
          </>
        )}

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
        {paymentMethod === 'bank_transfer' ? (
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
              <li><strong>Manual renewal:</strong> You will need to manually pay each billing cycle</li>
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
              <li><strong>Auto-renewal available:</strong> Enable to automatically renew your subscription</li>
            </ul>
            {autoRenewalEnabled && (
              <Alert
                description="Note: You will need to add your credit card details during checkout to enable auto-renewal. Your card will be securely tokenized and stored by our payment provider (Polar.sh)."
                message="Card Tokenization Required"
                showIcon
                style={{ marginTop: 12 }}
                type="info"
              />
            )}
          </Flexbox>
        )}
      </Card>
    </div>
  );
});

PaymentContent.displayName = 'PaymentContent';

export default PaymentContent;

