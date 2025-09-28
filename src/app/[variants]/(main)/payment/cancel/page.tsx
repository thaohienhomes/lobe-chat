'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { Button, Card, Result, Typography } from 'antd';
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
    color: ${token.colorWarning};
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
  helpSection: css`
    background: ${token.colorInfoBg};
    border: 1px solid ${token.colorInfoBorder};
    border-radius: ${token.borderRadius}px;
    padding: ${token.padding}px;
    margin-top: ${token.marginLG}px;
    text-align: left;
  `,
  helpTitle: css`
    color: ${token.colorInfo};
    font-weight: 600;
    margin-bottom: ${token.marginSM}px;
  `,
  helpList: css`
    margin: 0;
    padding-left: ${token.paddingLG}px;
    
    li {
      margin-bottom: ${token.marginXS}px;
      color: ${token.colorTextSecondary};
    }
  `,
}));

export default function PaymentCancelPage() {
  const { styles } = useStyles();
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get('orderId');
  const planName = searchParams.get('planName');
  const amount = searchParams.get('amount');

  const handleRetryPayment = () => {
    router.push('/subscription/plans');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleContactSupport = () => {
    // Open support email or chat
    window.location.href = 'mailto:hello@pho.chat?subject=Payment Issue - Order ' + (orderId || 'Unknown');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Result
          icon={<XCircle className={styles.icon} />}
          status="warning"
          title="Payment Cancelled"
          subTitle="Your payment was cancelled. No charges have been made to your account."
          extra={[
            <Button type="primary" key="retry" icon={<CreditCard />} onClick={handleRetryPayment}>
              Try Payment Again
            </Button>,
            <Button key="back" icon={<ArrowLeft />} onClick={handleGoBack}>
              Go Back
            </Button>,
            <Button key="home" onClick={handleGoHome}>
              Back to Home
            </Button>,
          ]}
        />

        {(orderId || planName || amount) && (
          <div className={styles.details}>
            <Title level={5}>Cancelled Payment Details</Title>
            {orderId && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Order ID:</span>
                <span className={styles.value}>{orderId}</span>
              </div>
            )}
            {planName && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Plan:</span>
                <span className={styles.value}>{planName}</span>
              </div>
            )}
            {amount && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Amount:</span>
                <span className={styles.value}>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(parseInt(amount))}
                </span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.label}>Status:</span>
              <span className={styles.value}>Cancelled</span>
            </div>
          </div>
        )}

        <div className={styles.helpSection}>
          <div className={styles.helpTitle}>Need Help?</div>
          <ul className={styles.helpList}>
            <li>Check your internet connection and try again</li>
            <li>Ensure your payment method has sufficient funds</li>
            <li>Try using a different payment method</li>
            <li>Contact your bank if you're experiencing issues</li>
            <li>
              <Button type="link" size="small" onClick={handleContactSupport}>
                Contact our support team
              </Button>
              {' '}if the problem persists
            </li>
          </ul>
        </div>

        <Paragraph style={{ marginTop: 24, color: '#666' }}>
          <strong>What happens next?</strong>
          <br />
          • No charges have been made to your account
          <br />
          • You can retry the payment at any time
          <br />
          • Your account remains on the current plan
          <br />
          • Contact support if you need assistance
        </Paragraph>
      </Card>
    </div>
  );
}
