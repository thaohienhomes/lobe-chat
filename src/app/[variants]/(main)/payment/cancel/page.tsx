'use client';

import { Button, Card, Result, Spin, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, CreditCard, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
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
  helpList: css`
    margin: 0;
    padding-inline-start: ${token.paddingLG}px;

    li {
      margin-block-end: ${token.marginXS}px;
      color: ${token.colorTextSecondary};
    }
  `,
  helpSection: css`
    margin-block-start: ${token.marginLG}px;
    padding: ${token.padding}px;
    border: 1px solid ${token.colorInfoBorder};
    border-radius: ${token.borderRadius}px;

    text-align: start;

    background: ${token.colorInfoBg};
  `,
  helpTitle: css`
    margin-block-end: ${token.marginSM}px;
    font-weight: 600;
    color: ${token.colorInfo};
  `,
  icon: css`
    margin-block-end: ${token.marginLG}px;
    font-size: 64px;
    color: ${token.colorWarning};
  `,
  label: css`
    color: ${token.colorTextSecondary};
  `,
  value: css`
    font-weight: 500;
  `,
}));

function PaymentCancelContent() {
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
    window.location.href =
      'mailto:hello@pho.chat?subject=Payment Issue - Order ' + (orderId || 'Unknown');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Result
          extra={[
            <Button icon={<CreditCard />} key="retry" onClick={handleRetryPayment} type="primary">
              Try Payment Again
            </Button>,
            <Button icon={<ArrowLeft />} key="back" onClick={handleGoBack}>
              Go Back
            </Button>,
            <Button key="home" onClick={handleGoHome}>
              Back to Home
            </Button>,
          ]}
          icon={<XCircle className={styles.icon} />}
          status="warning"
          subTitle="Your payment was cancelled. No charges have been made to your account."
          title="Payment Cancelled"
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
                    currency: 'VND',
                    style: 'currency',
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
            <li>Contact your bank if you&apos;re experiencing issues</li>
            <li>
              <Button onClick={handleContactSupport} size="small" type="link">
                Contact our support team
              </Button>{' '}
              if the problem persists
            </li>
          </ul>
        </div>

        <Paragraph style={{ color: '#666', marginTop: 24 }}>
          <strong>What happens next?</strong>
          <br />
          • No charges have been made to your account
          <br />
          • You can retry the payment at any time
          <br />
          • Your account remains on the current plan
          <br />• Contact support if you need assistance
        </Paragraph>
      </Card>
    </div>
  );
}

export default function PaymentCancelPage() {
  const { styles } = useStyles();

  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <Flexbox align="center" justify="center" style={{ minHeight: '50vh' }}>
            <Spin size="large" />
          </Flexbox>
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
