'use client';

import { Button } from 'antd';
import { createStyles } from 'antd-style';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { Suspense } from 'react';

const useStyles = createStyles(({ css, responsive }) => ({
  button: css`
    min-width: 200px;
    height: 56px;
    border-radius: 14px;

    font-size: 17px;
    font-weight: 600;

    ${responsive.mobile} {
      width: 100%;
      height: 52px;
      font-size: 16px;
    }
  `,
  container: css`
    display: flex;
    align-items: center;
    justify-content: center;

    min-height: 100vh;
    padding: 24px;

    background: #0b0e14;
  `,
  content: css`
    max-width: 560px;
    text-align: center;
  `,
  description: css`
    margin-block: 24px 40px;
    margin-inline: 0;

    font-size: 18px;
    line-height: 1.7;
    color: rgba(255, 255, 255, 65%);

    ${responsive.mobile} {
      margin-block: 20px 32px;
      font-size: 16px;
    }
  `,
  emailNote: css`
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;

    margin-block-start: 24px;
    padding-block: 14px;
    padding-inline: 20px;
    border: 1px solid rgba(34, 197, 94, 20%);
    border-radius: 12px;

    font-size: 14px;
    color: rgba(255, 255, 255, 60%);

    background: rgba(34, 197, 94, 8%);

    ${responsive.mobile} {
      padding-block: 12px;
      padding-inline: 16px;
      font-size: 13px;
    }
  `,
  icon: css`
    margin-block-end: 24px;
    color: #22c55e;

    ${responsive.mobile} {
      margin-block-end: 20px;
    }
  `,
  title: css`
    margin: 0;
    font-size: 44px;
    font-weight: 800;
    color: #fff;

    ${responsive.mobile} {
      font-size: 32px;
    }
  `,
}));

const SuccessContent = () => {
  const { styles } = useStyles();
  const searchParams = useSearchParams();

  // Extract params from URL
  const amount = parseFloat(searchParams.get('amount') || '149.99');
  const email = searchParams.get('email');

  // Welcome email is now sent server-side via the Polar webhook
  // No client-side trigger needed

  return (
    <div className={styles.container}>
      {/* Google Ads Conversion Event with Dynamic Amount */}
      <Script
        dangerouslySetInnerHTML={{
          __html: `
            gtag('event', 'conversion', {
              'send_to': 'AW-17766075190/LvQ5CPv3ieABeLaWw5dC',
              'value': ${amount},
              'currency': 'USD'
            });
          `,
        }}
        id="google-ads-conversion"
        strategy="afterInteractive"
      />
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={styles.content}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <CheckCircle className={styles.icon} size={72} strokeWidth={1.5} />

        <h1 className={styles.title}>Payment Successful! 🎉</h1>

        <p className={styles.description}>
          Thank you for joining the Pho.chat Lifetime Club!
          <br />
          Your premium access is now active with all AI models unlocked.
        </p>

        <Link href="/chat">
          <Button
            className={styles.button}
            icon={<ArrowRight size={20} />}
            iconPosition="end"
            size="large"
            type="primary"
          >
            Start Chatting
          </Button>
        </Link>

        {email && (
          <div className={styles.emailNote}>
            <Mail color="#22c55e" size={18} />
            <span>
              Confirmation email sent to <strong>{decodeURIComponent(email)}</strong>
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const SuccessPage = () => {
  return (
    <Suspense fallback={<div style={{ background: '#0b0e14', minHeight: '100vh' }} />}>
      <SuccessContent />
    </Suspense>
  );
};

export default SuccessPage;
