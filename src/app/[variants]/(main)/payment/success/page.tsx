'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useServerConfigStore } from '@/store/serverConfig';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button, Card, Result, Spin, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Flexbox } from 'react-layout-kit';

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

const { Title, Paragraph } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    width: 100%;
    max-width: 600px;
    text-align: center;
  `,
  container: css`
    display: flex;
    align-items: center;
    justify-content: center;

    min-height: 100vh;
    padding: ${token.padding}px;

    background: ${token.colorBgLayout};
  `,
  detailRow: css`
    display: flex;
    justify-content: space-between;
    margin-block-end: ${token.marginSM}px;
    
    &:last-child {
      margin-block-end: 0;
    }
  `,
  details: css`
    margin-block: ${token.marginLG}px;
    margin-inline: 0;
    padding: ${token.padding}px;
    border-radius: ${token.borderRadius}px;

    text-align: start;

    background: ${token.colorFillAlter};
  `,
  errorIcon: css`
    color: ${token.colorError};
  `,
  icon: css`
    margin-block-end: ${token.marginLG}px;
    font-size: 64px;
  `,
  label: css`
    color: ${token.colorTextSecondary};
  `,
  pendingIcon: css`
    color: ${token.colorWarning};
  `,
  successIcon: css`
    color: ${token.colorSuccess};
  `,
  value: css`
    font-weight: 500;
  `,
}));

interface PaymentStatus {
  amount?: number;
  message?: string;
  orderId?: string;
  planName?: string;
  status: 'success' | 'pending' | 'failed' | 'unknown';
  transactionId?: string;
}

function PaymentSuccessContent() {
  const { styles } = useStyles();
  const router = useRouter();
  const variants = useServerConfigStore((s) => s.segmentVariants);
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'unknown' });
  const [loading, setLoading] = useState(true);

  const queryPaymentStatus = useCallback(async (orderId: string) => {
    try {
      const response = await fetch(`/api/payment/sepay/status?orderId=${orderId}`);
      const data = await response.json();

      if (data.success) {
        setPaymentStatus({
          message: data.message,
          orderId,
          status: 'success',
          transactionId: data.transactionId,
        });
      } else {
        setPaymentStatus({
          message: data.message,
          orderId,
          status: 'failed',
        });
      }
    } catch (error) {
      console.error('Error querying payment status:', error);
      setPaymentStatus({
        message: 'Unable to verify payment status',
        orderId,
        status: 'failed',
      });
    } finally {
      setLoading(false);
    }
  }, []);

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
        amount: amount ? parseInt(amount) : undefined,
        orderId: orderId || undefined,
        planName: planName || undefined,
        status: (status as PaymentStatus['status']) || 'unknown',
        transactionId: transactionId || undefined,
      });
      setLoading(false);
    }
  }, [searchParams, queryPaymentStatus]);

  const handleGoToDashboard = () => {
    router.push(`/${variants}/settings/subscription`);
  };

  const handleGoHome = () => {
    router.push(`/${variants}`);
  };

  const handleRetryPayment = () => {
    router.push(`/${variants}/subscription/plans`);
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
      case 'success': {
        return (
          <Result
            extra={[
              <Button key="dashboard" onClick={handleGoToDashboard} type="primary">
                Go to Dashboard
              </Button>,
              <Button key="home" onClick={handleGoHome}>
                Back to Home
              </Button>,
            ]}
            icon={<CheckCircle className={`${styles.icon} ${styles.successIcon}`} />}
            status="success"
            subTitle="Your subscription has been activated successfully."
            title="Payment Successful!"
          />
        );
      }

      case 'pending': {
        return (
          <Result
            extra={[
              <Button key="dashboard" onClick={handleGoToDashboard} type="primary">
                Check Status
              </Button>,
              <Button key="home" onClick={handleGoHome}>
                Back to Home
              </Button>,
            ]}
            icon={<Clock className={`${styles.icon} ${styles.pendingIcon}`} />}
            status="warning"
            subTitle="Your payment is being processed. You will receive a confirmation email once completed."
            title="Payment Pending"
          />
        );
      }

      case 'failed': {
        return (
          <Result
            extra={[
              <Button key="retry" onClick={handleRetryPayment} type="primary">
                Try Again
              </Button>,
              <Button key="home" onClick={handleGoHome}>
                Back to Home
              </Button>,
            ]}
            icon={<XCircle className={`${styles.icon} ${styles.errorIcon}`} />}
            status="error"
            subTitle={paymentStatus.message || 'Your payment could not be processed. Please try again.'}
            title="Payment Failed"
          />
        );
      }

      default: {
        return (
          <Result
            extra={[
              <Button key="home" onClick={handleGoHome} type="primary">
                Back to Home
              </Button>,
            ]}
            status="404"
            subTitle="We couldn't determine your payment status. Please contact support if you need assistance."
            title="Payment Status Unknown"
          />
        );
      }
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
                    currency: 'VND',
                    style: 'currency',
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

export default function PaymentSuccessPage() {
  const { styles } = useStyles();

  return (
    <Suspense fallback={
      <div className={styles.container}>
        <Flexbox align="center" justify="center" style={{ minHeight: '50vh' }}>
          <Spin size="large" />
        </Flexbox>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
