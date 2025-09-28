'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button, Card, Result, Spin, Typography } from 'antd';
import { createStyles } from 'antd-style';

const { Title, Paragraph } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${token.padding}px;
    background: ${token.colorBgLayout};
  `,
  card: css`
    max-width: 600px;
    width: 100%;
    text-align: center;
  `,
  icon: css`
    font-size: 64px;
    margin-bottom: ${token.marginLG}px;
  `,
  successIcon: css`
    color: ${token.colorSuccess};
  `,
  pendingIcon: css`
    color: ${token.colorWarning};
  `,
  errorIcon: css`
    color: ${token.colorError};
  `,
  details: css`
    background: ${token.colorFillAlter};
    border-radius: ${token.borderRadius}px;
    padding: ${token.padding}px;
    margin: ${token.marginLG}px 0;
    text-align: left;
  `,
  detailRow: css`
    display: flex;
    justify-content: space-between;
    margin-bottom: ${token.marginSM}px;
    
    &:last-child {
      margin-bottom: 0;
    }
  `,
  label: css`
    color: ${token.colorTextSecondary};
  `,
  value: css`
    font-weight: 500;
  `,
}));

interface PaymentStatus {
  status: 'success' | 'pending' | 'failed' | 'unknown';
  orderId?: string;
  transactionId?: string;
  amount?: number;
  planName?: string;
  message?: string;
}

export default function PaymentSuccessPage() {
  const { styles } = useStyles();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'unknown' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');
    const transactionId = searchParams.get('transactionId');
    const amount = searchParams.get('amount');
    const planName = searchParams.get('planName');

    if (orderId) {
      // Query payment status from API
      queryPaymentStatus(orderId);
    } else {
      // Use URL parameters if available
      setPaymentStatus({
        status: (status as PaymentStatus['status']) || 'unknown',
        orderId: orderId || undefined,
        transactionId: transactionId || undefined,
        amount: amount ? parseInt(amount) : undefined,
        planName: planName || undefined,
      });
      setLoading(false);
    }
  }, [searchParams]);

  const queryPaymentStatus = async (orderId: string) => {
    try {
      const response = await fetch(`/api/payment/sepay/create?orderId=${orderId}`);
      const data = await response.json();

      if (data.success) {
        setPaymentStatus({
          status: 'success',
          orderId,
          transactionId: data.transactionId,
          message: data.message,
        });
      } else {
        setPaymentStatus({
          status: 'failed',
          orderId,
          message: data.message,
        });
      }
    } catch (error) {
      console.error('Error querying payment status:', error);
      setPaymentStatus({
        status: 'failed',
        orderId,
        message: 'Unable to verify payment status',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push('/settings/subscription');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleRetryPayment = () => {
    router.push('/subscription/plans');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <Spin size="large" />
          <Title level={3} style={{ marginTop: 16 }}>
            Verifying Payment...
          </Title>
          <Paragraph>Please wait while we confirm your payment status.</Paragraph>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch (paymentStatus.status) {
      case 'success':
        return (
          <Result
            icon={<CheckCircle className={`${styles.icon} ${styles.successIcon}`} />}
            status="success"
            title="Payment Successful!"
            subTitle="Your subscription has been activated successfully."
            extra={[
              <Button type="primary" key="dashboard" onClick={handleGoToDashboard}>
                Go to Dashboard
              </Button>,
              <Button key="home" onClick={handleGoHome}>
                Back to Home
              </Button>,
            ]}
          />
        );

      case 'pending':
        return (
          <Result
            icon={<Clock className={`${styles.icon} ${styles.pendingIcon}`} />}
            status="warning"
            title="Payment Pending"
            subTitle="Your payment is being processed. You will receive a confirmation email once completed."
            extra={[
              <Button type="primary" key="dashboard" onClick={handleGoToDashboard}>
                Check Status
              </Button>,
              <Button key="home" onClick={handleGoHome}>
                Back to Home
              </Button>,
            ]}
          />
        );

      case 'failed':
        return (
          <Result
            icon={<XCircle className={`${styles.icon} ${styles.errorIcon}`} />}
            status="error"
            title="Payment Failed"
            subTitle={paymentStatus.message || 'Your payment could not be processed. Please try again.'}
            extra={[
              <Button type="primary" key="retry" onClick={handleRetryPayment}>
                Try Again
              </Button>,
              <Button key="home" onClick={handleGoHome}>
                Back to Home
              </Button>,
            ]}
          />
        );

      default:
        return (
          <Result
            status="404"
            title="Payment Status Unknown"
            subTitle="We couldn't determine your payment status. Please contact support if you need assistance."
            extra={[
              <Button type="primary" key="home" onClick={handleGoHome}>
                Back to Home
              </Button>,
            ]}
          />
        );
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        {renderContent()}
        
        {(paymentStatus.orderId || paymentStatus.transactionId) && (
          <div className={styles.details}>
            <Title level={5}>Payment Details</Title>
            {paymentStatus.orderId && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Order ID:</span>
                <span className={styles.value}>{paymentStatus.orderId}</span>
              </div>
            )}
            {paymentStatus.transactionId && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Transaction ID:</span>
                <span className={styles.value}>{paymentStatus.transactionId}</span>
              </div>
            )}
            {paymentStatus.amount && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Amount:</span>
                <span className={styles.value}>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(paymentStatus.amount)}
                </span>
              </div>
            )}
            {paymentStatus.planName && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Plan:</span>
                <span className={styles.value}>{paymentStatus.planName}</span>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
