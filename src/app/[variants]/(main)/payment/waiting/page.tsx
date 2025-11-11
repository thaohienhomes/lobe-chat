/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

'use client';

import { Button } from '@lobehub/ui';
import { Card, Spin, Typography, message } from 'antd';
import { createStyles } from 'antd-style';
import { Check, Clock, Copy, QrCode } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useServerConfigStore } from '@/store/serverConfig';

/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

const { Title, Paragraph, Text } = Typography;

// Force dynamic rendering

export const dynamic = 'force-dynamic';

const useStyles = createStyles(({ css, token }) => ({
  actionButton: css`
    width: 100%;
    height: 48px;
    font-size: ${token.fontSize}px;
    font-weight: 600;
  `,

  actionCard: css`
    padding: ${token.paddingXL}px;
    border: 1px solid ${token.colorWarningBorder};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 8%);

    transition: all 0.3s ease;

    &:hover {
      border-color: ${token.colorWarning};
      box-shadow: 0 4px 16px rgba(0, 0, 0, 12%);
    }
  `,

  amountCard: css`
    padding: ${token.paddingXL}px;
    border-radius: ${token.borderRadiusLG}px;

    color: ${token.colorWhite};
    text-align: center;

    background: linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 15%);
  `,

  amountText: css`
    margin-block: ${token.marginSM}px;
    margin-inline: 0;

    font-size: ${token.fontSizeHeading3}px;
    font-weight: 700;
    color: ${token.colorWhite};
    letter-spacing: -0.5px;
  `,

  bankDetailRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;

    margin-block-end: ${token.marginMD}px;
    padding-block: ${token.paddingMD}px;
    padding-inline: ${token.paddingLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;

    background: ${token.colorBgLayout};
  `,

  cancelCard: css`
    padding: ${token.paddingXL}px;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 8%);

    transition: all 0.3s ease;

    &:hover {
      border-color: ${token.colorPrimaryBorder};
      box-shadow: 0 4px 16px rgba(0, 0, 0, 12%);
    }
  `,

  container: css`
    display: flex;
    align-items: center;
    justify-content: center;

    min-height: 100vh;
    padding: ${token.paddingLG}px;

    background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f0 100%);

    @media (max-width: 768px) {
      padding: ${token.padding}px;
    }
  `,

  copyButton: css`
    cursor: pointer;

    padding: ${token.paddingSM}px;
    border: 1px solid transparent;
    border-radius: ${token.borderRadiusSM}px;

    transition: all 0.2s ease;

    &:hover {
      border-color: ${token.colorBorder};
      background: ${token.colorFillSecondary};
    }

    &:active {
      transform: scale(0.95);
    }
  `,

  headerIcon: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 80px;
    height: 80px;
    margin-block-end: ${token.marginLG}px;
    border-radius: 50%;

    background: ${token.colorPrimaryBg};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 10%);
  `,

  instructionCard: css`
    margin-block-end: ${token.marginLG}px;
    padding: ${token.paddingXL}px;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 8%);
  `,

  instructionStep: css`
    display: flex;
    gap: ${token.marginMD}px;
    align-items: center;

    padding-block: ${token.paddingMD}px;
    padding-inline: ${token.paddingLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;

    background: ${token.colorBgLayout};

    transition: all 0.2s ease;

    &:hover {
      border-color: ${token.colorPrimaryBorder};
      background: ${token.colorBgContainer};
    }
  `,

  label: css`
    margin-block-end: ${token.marginXS}px;

    font-size: ${token.fontSizeSM}px;
    font-weight: 500;
    color: ${token.colorTextSecondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,

  mainCard: css`
    width: 100%;
    max-width: 1200px;
    padding: ${token.paddingXL * 1.5}px;
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};
    box-shadow: 0 8px 24px rgba(0, 0, 0, 12%);

    @media (max-width: 768px) {
      padding: ${token.paddingLG}px;
    }
  `,

  qrCodeContainer: css`
    position: relative;

    aspect-ratio: 1;
    width: 100%;
    max-width: 300px;
    margin-block: 0 ${token.marginLG}px;
    margin-inline: auto;

    @media (max-width: 768px) {
      max-width: 200px;
    }
  `,

  qrCodeLoading: css`
    position: relative;

    display: flex;
    align-items: center;
    justify-content: center;

    height: 100%;
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgLayout};
  `,

  qrCodeWrapper: css`
    position: relative;

    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    height: 100%;
    padding: ${token.paddingLG}px;
    border: 2px solid ${token.colorPrimaryBorder};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 10%);
  `,

  qrSection: css`
    display: flex;
    flex-direction: column;

    padding: ${token.paddingXL}px;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 8%);

    transition: all 0.3s ease;

    &:hover {
      border-color: ${token.colorPrimaryBorder};
      box-shadow: 0 4px 16px rgba(0, 0, 0, 12%);
    }

    @media (max-width: 768px) {
      padding: ${token.paddingLG}px;
    }
  `,

  referenceBox: css`
    padding-block: ${token.paddingMD}px;
    padding-inline: ${token.paddingLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;

    background: ${token.colorBgLayout};
  `,

  referenceText: css`
    padding-block: ${token.paddingXS}px;
    padding-inline: ${token.paddingSM}px;
    border-radius: ${token.borderRadiusSM}px;

    font-family: ${token.fontFamilyCode};
    font-size: ${token.fontSize}px;
    font-weight: 600;
    color: ${token.colorTextHeading};
    word-break: break-all;

    background: ${token.colorBgContainer};
  `,

  // QR Code scanning animation - vertical scan line effect

  scanLine: css`
    pointer-events: none;

    position: absolute;
    z-index: 10;
    inset-block-start: 0;
    inset-inline: 0 0;

    height: 4px;

    background: linear-gradient(
      to bottom,

      transparent 0%,

      ${token.colorPrimary}00 10%,

      ${token.colorPrimary}99 50%,

      ${token.colorPrimary}00 90%,

      transparent 100%
    );
    box-shadow:
      0 0 20px ${token.colorPrimary}66,
      0 0 40px ${token.colorPrimary}33,
      0 2px 4px ${token.colorPrimary}99;

    animation: qr-scan 2.5s ease-in-out infinite;

    @keyframes qr-scan {
      0% {
        transform: translateY(-30px);
        opacity: 0;
      }

      10% {
        opacity: 1;
      }

      90% {
        opacity: 1;
      }

      100% {
        transform: translateY(calc(100% + 300px));
        opacity: 0;
      }
    }

    &::before {
      content: '';

      position: absolute;
      inset-block-start: -25px;
      inset-inline: 0;

      height: 30px;

      background: linear-gradient(to bottom, transparent 0%, ${token.colorPrimary}22 100%);
    }

    &::after {
      content: '';

      position: absolute;
      inset-block-end: -25px;
      inset-inline: 0;

      height: 30px;

      background: linear-gradient(to top, transparent 0%, ${token.colorPrimary}22 100%);
    }
  `,

  statusBar: css`
    margin-block-end: ${token.marginLG}px;
    padding-block: ${token.paddingLG}px;
    padding-inline: ${token.paddingXL}px;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 8%);
  `,

  statusIndicator: css`
    position: relative;

    width: 14px;
    height: 14px;
    border-radius: 50%;

    background: ${token.colorSuccess};

    animation: pulse 2s ease-in-out infinite;

    &::after {
      content: '';

      position: absolute;
      inset: 0;

      border-radius: 50%;

      background: ${token.colorSuccess};

      animation: ping 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }

      50% {
        opacity: 0.5;
      }
    }

    @keyframes ping {
      0% {
        transform: scale(1);
        opacity: 1;
      }

      100% {
        transform: scale(2);
        opacity: 0;
      }
    }
  `,

  stepNumber: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 36px;
    height: 36px;
    border-radius: 50%;

    font-size: ${token.fontSize}px;
    font-weight: 700;
    color: ${token.colorWhite};

    background: ${token.colorPrimary};
    box-shadow: 0 2px 6px rgba(0, 0, 0, 15%);
  `,

  timeLeft: css`
    margin-inline-start: ${token.marginXS}px;
    font-size: ${token.fontSizeHeading4}px;
    font-weight: 700;
    letter-spacing: -0.5px;
  `,

  timeLeftDanger: css`
    color: ${token.colorError};
  `,

  timeLeftNormal: css`
    color: ${token.colorSuccess};
  `,

  timeLeftWarning: css`
    color: ${token.colorWarning};
  `,

  timeoutCard: css`
    margin-block-end: ${token.marginLG}px;
    padding: ${token.paddingXL}px;
    border: 1px solid ${token.colorWarningBorder};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorWarningBg};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 8%);
  `,

  timerBadge: css`
    padding-block: ${token.paddingSM}px;
    padding-inline: ${token.paddingMD}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;

    background: ${token.colorBgLayout};
  `,

  twoColumnLayout: css`
    display: grid;
    grid-template-columns: 40% 60%;
    gap: ${token.marginLG}px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: ${token.marginMD}px;
    }
  `,

  urgentBadge: css`
    padding-block: ${token.paddingXXS}px;
    padding-inline: ${token.paddingSM}px;
    border-radius: ${token.borderRadiusSM}px;

    font-size: ${token.fontSizeSM}px;
    font-weight: 700;
    color: ${token.colorWhite};

    background: ${token.colorError};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 20%);
  `,

  validityInfo: css`
    padding-block: ${token.paddingMD}px;
    padding-inline: ${token.paddingLG}px;
    border: 1px solid ${token.colorPrimaryBorder};
    border-radius: ${token.borderRadius}px;

    text-align: center;

    background: ${token.colorPrimaryBg};
  `,
}));

interface PaymentStatus {
  message?: string;

  orderId?: string;

  status: 'waiting' | 'success' | 'failed' | 'timeout';

  transactionId?: string;
}

interface PaymentSessionDetails {
  amount?: number;

  bankAccount?: string;

  bankName?: string;

  billingCycle?: string;

  currency?: string;

  manualVerificationEnabled?: boolean;

  planId?: string;

  qrCodeUrl?: string;

  status?: string;

  transactionId?: string;
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);

  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

function PaymentWaitingContent() {
  const { styles, cx, theme } = useStyles();

  const router = useRouter();

  const variants = useServerConfigStore((s) => s.segmentVariants);

  const searchParams = useSearchParams();

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'waiting' });

  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds

  const [polling, setPolling] = useState(true);

  const [verifying, setVerifying] = useState(false);

  const [mounted, setMounted] = useState(false);

  const [sessionDetails, setSessionDetails] = useState<PaymentSessionDetails | null>(null);

  const [sessionLoading, setSessionLoading] = useState(false);

  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const pollNumberRef = useRef(0);

  const orderId = searchParams.get('orderId');

  const normalizedVariants = useMemo(() => {
    if (!variants) return '';

    return variants.replace(/^\/+/, '').replace(/\/+$/, '');
  }, [variants]);

  const buildPath = useCallback(
    (path: string) => {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;

      return normalizedVariants ? `/${normalizedVariants}${normalizedPath}` : normalizedPath;
    },

    [normalizedVariants],
  );

  const amountValue = sessionDetails?.amount;

  const currency = sessionDetails?.currency ?? 'VND';

  const bankAccount = sessionDetails?.bankAccount;

  const bankName = sessionDetails?.bankName;

  const qrCodeUrl = sessionDetails?.qrCodeUrl;

  const manualVerificationFeatureEnabled = sessionDetails?.manualVerificationEnabled === true;

  // Copy to clipboard function

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);

      setCopiedField(field);

      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);

      message.error('Failed to copy to clipboard. Please try again.');
    }
  };

  // Prevent hydration mismatch

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug log (only on client)

  useEffect(() => {
    if (mounted) {
      console.log('Waiting page params:', { orderId, variants });
    }
  }, [mounted, variants, orderId]);

  // Load payment session details from server

  useEffect(() => {
    if (!mounted || !orderId) return;

    let cancelled = false;

    const loadSessionDetails = async () => {
      setSessionLoading(true);

      try {
        const response = await fetch(
          `/api/payment/sepay/order-details?orderId=${encodeURIComponent(orderId)}`,

          { cache: 'no-store' },
        );

        const data = await response.json();

        if (cancelled) return;

        if (response.ok && data.success) {
          setSessionDetails(data);

          if (data.status === 'success') {
            setPaymentStatus({
              message: 'Payment completed successfully!',

              orderId: data.orderId,

              status: 'success',

              transactionId: data.transactionId,
            });

            setPolling(false);
          } else if (data.status === 'failed') {
            setPaymentStatus({
              message: data.message || 'Payment failed',

              orderId: data.orderId,

              status: 'failed',
            });

            setPolling(false);
          }
        } else {
          const errorMessage = data.message || 'Unable to load payment details';

          message.error(errorMessage);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load payment session details:', error);

          const fallbackMessage = 'Failed to load payment details. Please refresh the page.';

          message.error(fallbackMessage);
        }
      } finally {
        if (!cancelled) {
          setSessionLoading(false);
        }
      }
    };

    loadSessionDetails();

    return () => {
      cancelled = true;
    };
  }, [mounted, orderId]);

  // Poll payment status every 15 seconds (reduced from 5s to avoid rate limiting)

  const checkPaymentStatus = useCallback(async () => {
    if (!orderId || !polling) {
      console.log(' Polling skipped:', { orderId, polling });

      return;
    }

    const now = new Date();

    // increment poll number without causing hook dependencies to change

    pollNumberRef.current += 1;

    const pollNumber = pollNumberRef.current;

    setLastCheckTime(now);

    try {
      const statusUrl = `/api/payment/sepay/status?orderId=${orderId}`;

      console.log(
        ` [Poll #${pollNumber}] ${now.toLocaleTimeString()} - Checking payment status:`,

        statusUrl,
      );

      const response = await fetch(statusUrl, { cache: 'no-store' });

      const data = await response.json();

      console.log(` [Poll #${pollNumber}] ${now.toLocaleTimeString()} - Response:`, {
        fullData: data,

        message: data.message,

        status: data.status,

        success: data.success,

        transactionId: data.transactionId,
      });

      if (data.success && data.status === 'success') {
        console.log(` [Poll #${pollNumber}] Payment successful! Redirecting in 2 seconds...`);

        setPaymentStatus({
          message: 'Payment completed successfully!',

          orderId,

          status: 'success',

          transactionId: data.transactionId,
        });

        setPolling(false);

        // Redirect to success page after 2 seconds

        const redirectUrl = buildPath(
          '/payment/success?orderId=' +
            orderId +
            '&status=success&transactionId=' +
            data.transactionId,
        );

        console.log(
          '[Poll #' + pollNumber + '] Redirect URL:',
          redirectUrl,
          '(variants:',
          variants,
          ')',
        );

        setTimeout(() => {
          console.log('[Poll #' + pollNumber + '] Executing redirect now...');

          router.push(redirectUrl);
        }, 2000);
      } else if (data.status === 'failed') {
        console.log(` [Poll #${pollNumber}] Payment failed:`, data.message);

        setPaymentStatus({
          message: data.message || 'Payment failed',

          orderId,

          status: 'failed',
        });

        setPolling(false);
      } else {
        console.log(
          ` [Poll #${pollNumber}] Payment still pending... Will check again in 15 seconds.`,
        );
      }
    } catch (error) {
      console.error(` [Poll #${pollNumber}] Error checking payment status:`, error);

      console.error(` [Poll #${pollNumber}] Error details:`, {
        message: error instanceof Error ? error.message : String(error),

        name: error instanceof Error ? error.name : 'Unknown',

        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }, [orderId, polling, router, variants]);

  // Countdown timer

  useEffect(() => {
    if (timeLeft <= 0) {
      setPaymentStatus({ orderId: orderId || undefined, status: 'timeout' });

      setPolling(false);

      return;
    }

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, orderId]);

  // Start polling

  useEffect(() => {
    if (polling && paymentStatus.status === 'waiting') {
      console.log(' Starting payment status polling (every 15 seconds)...');

      console.log('Polling configuration:', {
        amount: sessionDetails?.amount,

        orderId,

        paymentStatus: paymentStatus.status,

        polling,
      });

      // Check immediately on mount

      checkPaymentStatus();

      const interval = setInterval(checkPaymentStatus, 15_000); // 15 seconds

      return () => {
        console.log(' Stopping payment status polling');

        clearInterval(interval);
      };
    } else {
      console.log(' Polling not started:', {
        paymentStatus: paymentStatus.status,

        polling,
      });
    }
  }, [polling, paymentStatus.status, checkPaymentStatus, orderId]);

  const handleRetry = () => {
    router.push(buildPath('/subscription/checkout'));
  };

  const handleCancel = () => {
    router.push(buildPath('/settings/subscription'));
  };

  const handleManualVerification = async () => {
    if (!manualVerificationFeatureEnabled) {
      message.warning('Manual verification is currently disabled. Please contact support.');

      return;
    }

    if (!orderId || verifying) return;

    setVerifying(true);

    try {
      const response = await fetch('/api/payment/sepay/verify-manual', {
        body: JSON.stringify({
          amount: typeof sessionDetails?.amount === 'number' ? sessionDetails.amount : undefined,

          description: 'Manual payment verification - User confirmed payment completed',

          orderId,
        }),

        headers: {
          'Content-Type': 'application/json',
        },

        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setPaymentStatus({
          message: 'Payment manually verified and subscription activated!',

          orderId,

          status: 'success',

          transactionId: data.transactionId,
        });

        setPolling(false);

        message.success('Payment manually verified successfully.');

        // Redirect to success page after 2 seconds

        setTimeout(() => {
          router.push(
            buildPath(
              `/payment/success?orderId=${orderId}&status=success&transactionId=${data.transactionId}`,
            ),
          );
        }, 2000);
      } else {
        const errorMessage = data.message || 'Manual verification failed';

        message.error(errorMessage);
      }
    } catch (error) {
      console.error('Manual verification error:', error);

      message.error('Failed to verify payment. Please try again or contact support.');
    } finally {
      setVerifying(false);
    }
  };

  if (paymentStatus.status === 'success') {
    return (
      <div className={styles.container}>
        <Flexbox align="center" gap={theme.marginXL} style={{ textAlign: 'center' }}>
          <div
            style={{
              alignItems: 'center',

              background: theme.colorSuccessBg,

              borderRadius: '50%',

              boxShadow: `0 4px 12px ${theme.colorSuccess}33`,

              display: 'flex',

              height: 100,

              justifyContent: 'center',

              width: 100,
            }}
          >
            <Check color={theme.colorSuccess} size={50} strokeWidth={3} />
          </div>

          <Title
            level={2}
            style={{
              color: theme.colorTextHeading,

              fontSize: theme.fontSizeHeading2,

              fontWeight: 700,

              marginBottom: 0,
            }}
          >
            Payment successful!
          </Title>

          <Paragraph
            style={{
              color: theme.colorText,

              fontSize: theme.fontSizeLG,

              lineHeight: 1.6,
            }}
          >
            Redirecting to the confirmation page...
          </Paragraph>

          <Spin size="large" />
        </Flexbox>
      </div>
    );
  }

  if (paymentStatus.status === 'failed' || paymentStatus.status === 'timeout') {
    const isTimeout = paymentStatus.status === 'timeout';
    return (
      <div className={styles.container}>
        <Card className={styles.mainCard} style={{ maxWidth: 600 }}>
          <Flexbox align="center" gap={theme.marginLG}>
            <div
              className={styles.headerIcon}
              style={{
                background: theme.colorErrorBg,
                boxShadow: `0 4px 12px ${theme.colorError}33`,
              }}
            >
              <Clock color={theme.colorError} size={40} />
            </div>
            <Title
              level={2}
              style={{
                color: theme.colorTextHeading,
                fontSize: theme.fontSizeHeading3,
                fontWeight: 700,
                marginBottom: 0,
              }}
            >
              {isTimeout ? 'Payment timed out' : 'Payment failed'}
            </Title>
            <Paragraph
              style={{
                color: theme.colorText,
                fontSize: theme.fontSize,
                lineHeight: 1.6,
                textAlign: 'center',
              }}
            >
              {isTimeout
                ? 'We did not detect a payment within 15 minutes. If you already transferred the funds, you can request a manual review.'
                : paymentStatus.message || 'Please try again or contact support.'}
            </Paragraph>
            {isTimeout && manualVerificationFeatureEnabled && (
              <div className={styles.timeoutCard} style={{ width: '100%' }}>
                <Title
                  level={4}
                  style={{
                    color: theme.colorTextHeading,
                    fontSize: theme.fontSizeLG,
                    fontWeight: 600,
                  }}
                >
                  Already completed the transfer?
                </Title>
                <Paragraph
                  style={{
                    color: theme.colorText,
                    fontSize: theme.fontSize,
                    lineHeight: 1.6,
                  }}
                >
                  If the funds have left your account but the system has not updated yet, please ask
                  us to verify it manually.
                </Paragraph>
                <Button
                  block
                  disabled={verifying || !manualVerificationFeatureEnabled}
                  loading={verifying}
                  onClick={handleManualVerification}
                  size="large"
                  style={{ fontWeight: 600, height: 48 }}
                  type="primary"
                >
                  {verifying ? 'Verifying...' : 'I have paid - request verification'}
                </Button>
              </div>
            )}
            <Flexbox gap={theme.marginSM} horizontal style={{ width: '100%' }}>
              <Button
                onClick={handleRetry}
                size="large"
                style={{ flex: 1, fontWeight: 600, height: 48 }}
                type="primary"
              >
                {isTimeout ? 'Retry payment' : 'Try again'}
              </Button>
              <Button
                onClick={handleCancel}
                size="large"
                style={{
                  borderColor: theme.colorBorder,
                  color: theme.colorText,
                  flex: 1,
                  fontWeight: 600,
                  height: 48,
                }}
              >
                Cancel
              </Button>
            </Flexbox>
          </Flexbox>
        </Card>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className={styles.container}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainCard}>
        {/* Header */}

        <Flexbox
          align="center"
          gap={16}
          style={{ marginBottom: theme.marginXL * 1.5, textAlign: 'center' }}
        >
          <div className={styles.headerIcon}>
            <Clock color={theme.colorPrimary} size={40} />
          </div>

          <Title
            level={1}
            style={{
              color: theme.colorTextHeading,

              fontSize: theme.fontSizeHeading2,

              fontWeight: 700,

              marginBottom: theme.marginXS,
            }}
          >
            Complete Your Payment
          </Title>

          <Paragraph
            style={{
              color: theme.colorText,

              fontSize: theme.fontSizeLG,

              lineHeight: 1.6,

              marginBottom: 0,
            }}
          >
            Scan the QR code with your banking app
          </Paragraph>
        </Flexbox>

        {/* Status & Timer Bar */}

        <div className={styles.statusBar}>
          <Flexbox align="center" gap={16} horizontal justify="space-between">
            <Flexbox align="center" gap={12} horizontal>
              <div className={styles.statusIndicator} />

              <Flexbox gap={4}>
                <Text
                  strong
                  style={{
                    color: theme.colorText,

                    fontSize: theme.fontSize,

                    fontWeight: 600,
                  }}
                >
                  Checking payment status...
                </Text>

                {lastCheckTime && (
                  <Text
                    style={{
                      color: theme.colorTextSecondary,

                      fontSize: theme.fontSizeSM,
                    }}
                  >
                    Last: {lastCheckTime.toLocaleTimeString('vi-VN')}
                  </Text>
                )}
              </Flexbox>
            </Flexbox>

            <Flexbox align="center" className={styles.timerBadge} gap={8} horizontal>
              <Clock color={theme.colorTextSecondary} size={18} />

              <Text
                style={{
                  color: theme.colorText,

                  fontSize: theme.fontSize,

                  fontWeight: 500,
                }}
              >
                Time:
              </Text>

              <Text
                className={cx(
                  styles.timeLeft,

                  timeLeft < 300
                    ? styles.timeLeftDanger
                    : timeLeft < 600
                      ? styles.timeLeftWarning
                      : styles.timeLeftNormal,
                )}
              >
                {formatTime(timeLeft)}
              </Text>

              {timeLeft < 300 && <span className={styles.urgentBadge}>Hurry!</span>}
            </Flexbox>
          </Flexbox>
        </div>

        {/* Main Content Grid - 2 Column Layout */}

        <div className={styles.twoColumnLayout} style={{ marginBottom: theme.marginLG }}>
          {/* QR Code Section - Left Column (40%) */}

          <div className={styles.qrSection}>
            <Flexbox
              align="center"
              gap={8}
              style={{ marginBottom: theme.marginLG, textAlign: 'center' }}
            >
              <Title
                level={3}
                style={{
                  color: theme.colorTextHeading,

                  fontSize: theme.fontSizeHeading4,

                  fontWeight: 600,

                  marginBottom: theme.marginXS,
                }}
              >
                Payment QR Code
              </Title>

              <Text
                style={{
                  color: theme.colorTextSecondary,

                  fontSize: theme.fontSize,

                  lineHeight: 1.6,
                }}
              >
                Scan to complete payment instantly
              </Text>
            </Flexbox>

            <Flexbox align="center" justify="center" style={{ flex: 1, marginBottom: 24 }}>
              <div className={styles.qrCodeContainer}>
                {qrCodeUrl ? (
                  <div className={styles.qrCodeWrapper}>
                    {/* QR Code Image */}

                    <img
                      alt="Payment QR Code"
                      onError={(e) => {
                        console.error('QR Code failed to load:', qrCodeUrl);

                        e.currentTarget.style.display = 'none';
                      }}
                      src={qrCodeUrl}
                      style={{ height: '100%', objectFit: 'contain', width: '100%' }}
                    />

                    {/* Animated Scanning Line Effect */}

                    <div className={styles.scanLine} />
                  </div>
                ) : (
                  <Flexbox align="center" className={styles.qrCodeLoading} justify="center">
                    <div style={{ position: 'relative' }}>
                      <QrCode size={128} style={{ color: theme.colorTextQuaternary }} />

                      <div
                        style={{
                          alignItems: 'center',

                          display: 'flex',

                          inset: 0,

                          justifyContent: 'center',

                          position: 'absolute',
                        }}
                      >
                        <Spin size="large" />
                      </div>
                    </div>
                  </Flexbox>
                )}
              </div>
            </Flexbox>

            <div className={styles.validityInfo}>
              <Text
                strong
                style={{
                  color: theme.colorPrimary,

                  fontSize: theme.fontSize,

                  fontWeight: 600,
                }}
              >
                Valid for: {formatTime(timeLeft)}
              </Text>

              <br />

              <Text
                style={{
                  color: theme.colorPrimary,

                  fontSize: theme.fontSizeSM,

                  marginTop: theme.marginXXS,
                }}
              >
                QR code expires after 15 minutes
              </Text>
            </div>
          </div>

          {/* Payment Details Section - Right Column (60%) */}

          <div className={styles.qrSection}>
            <Title
              level={3}
              style={{
                color: theme.colorTextHeading,

                fontSize: theme.fontSizeHeading4,

                fontWeight: 600,

                marginBottom: theme.marginLG,
              }}
            >
              Payment Details
            </Title>

            <Flexbox gap={theme.marginMD} style={{ flex: 1 }}>
              {/* Amount */}

              <div className={styles.amountCard}>
                <div className={styles.label} style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Amount to Pay
                </div>

                <div className={styles.amountText}>
                  {typeof amountValue === 'number'
                    ? new Intl.NumberFormat('vi-VN', {
                        currency,

                        maximumFractionDigits: 0,

                        style: 'currency',
                      }).format(amountValue)
                    : sessionLoading
                      ? 'Loading...'
                      : '--'}
                </div>

                <Text
                  style={{
                    color: 'rgba(255,255,255,0.85)',

                    fontSize: theme.fontSizeSM,

                    fontWeight: 500,
                  }}
                >
                  Transfer exact amount
                </Text>
              </div>

              {/* Bank Details */}

              {bankAccount && bankName && (
                <Flexbox gap={theme.marginMD}>
                  <div>
                    <div className={styles.label}>Bank Name</div>

                    <div className={styles.bankDetailRow}>
                      <Text
                        strong
                        style={{
                          color: theme.colorTextHeading,

                          fontSize: theme.fontSizeLG,

                          fontWeight: 600,
                        }}
                      >
                        {decodeURIComponent(bankName)}
                      </Text>
                    </div>
                  </div>

                  <div>
                    <div className={styles.label}>Account Number</div>

                    <div className={styles.bankDetailRow}>
                      <Text
                        code
                        strong
                        style={{
                          color: theme.colorTextHeading,

                          fontSize: theme.fontSizeLG,

                          fontWeight: 600,
                        }}
                      >
                        {bankAccount}
                      </Text>

                      <button
                        aria-label="Copy account number"
                        className={styles.copyButton}
                        onClick={() => copyToClipboard(bankAccount, 'account')}
                        type="button"
                      >
                        {copiedField === 'account' ? (
                          <Check color={theme.colorSuccess} size={18} />
                        ) : (
                          <Copy color={theme.colorTextSecondary} size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className={styles.label}>Transfer Reference</div>

                    <div className={styles.referenceBox}>
                      <Flexbox align="center" gap={8} horizontal justify="space-between">
                        <div className={styles.referenceText}>{orderId}</div>

                        <button
                          aria-label="Copy order ID"
                          className={styles.copyButton}
                          onClick={() => copyToClipboard(orderId || '', 'orderId')}
                          type="button"
                        >
                          {copiedField === 'orderId' ? (
                            <Check color={theme.colorSuccess} size={18} />
                          ) : (
                            <Copy color={theme.colorTextSecondary} size={18} />
                          )}
                        </button>
                      </Flexbox>
                    </div>
                  </div>
                </Flexbox>
              )}
            </Flexbox>
          </div>
        </div>

        {/* Instructions - Condensed */}

        <div className={styles.instructionCard}>
          <Title
            level={4}
            style={{
              color: theme.colorTextHeading,

              fontSize: theme.fontSizeHeading4,

              fontWeight: 600,

              marginBottom: theme.marginLG,
            }}
          >
            How to Pay
          </Title>

          <Flexbox
            gap={theme.marginMD}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}
          >
            {[
              { icon: '', step: 'Open your banking app' },

              { icon: '', step: 'Select "Scan QR" or "Transfer"' },

              { icon: '', step: 'Scan the QR code above' },

              { icon: '', step: 'Confirm and complete payment' },
            ].map((item, index) => (
              <div className={styles.instructionStep} key={index}>
                <div className={styles.stepNumber}>{index + 1}</div>

                <Text
                  style={{
                    color: theme.colorText,

                    fontSize: theme.fontSize,

                    fontWeight: 500,

                    lineHeight: 1.6,
                  }}
                >
                  {item.step}
                </Text>
              </div>
            ))}
          </Flexbox>
        </div>

        {/* Action Cards - Grouped */}

        <Flexbox gap={theme.marginLG} horizontal style={{ marginBottom: theme.marginLG }}>
          {/* Manual Verification */}

          {manualVerificationFeatureEnabled && (
            <div className={styles.actionCard} style={{ flex: 1 }}>
              <Title
                level={5}
                style={{
                  color: theme.colorTextHeading,
                  fontSize: theme.fontSizeLG,
                  fontWeight: 600,
                  marginBottom: theme.marginXS,
                }}
              >
                Already paid?
              </Title>
              <Paragraph
                style={{
                  color: theme.colorText,
                  fontSize: theme.fontSize,
                  lineHeight: 1.6,
                  marginBottom: theme.marginMD,
                }}
              >
                Start a manual review if the payment went through but is still pending in the
                system.
              </Paragraph>
              <Button
                block
                className={styles.actionButton}
                disabled={verifying || !manualVerificationFeatureEnabled}
                loading={verifying}
                onClick={handleManualVerification}
                size="large"
                type="primary"
              >
                {verifying ? 'Verifying...' : 'Verify payment'}
              </Button>
            </div>
          )}

          {/* Quick Actions */}

          <div className={styles.cancelCard} style={{ flex: 1 }}>
            <Title
              level={5}
              style={{
                color: theme.colorTextHeading,

                fontSize: theme.fontSizeLG,

                fontWeight: 600,

                marginBottom: theme.marginMD,
              }}
            >
              Quick Actions
            </Title>

            <Flexbox gap={theme.marginSM}>
              <Button
                block
                className={styles.actionButton}
                disabled={!polling}
                onClick={checkPaymentStatus}
                size="large"
                type="primary"
              >
                Check status now
              </Button>

              <Button
                block
                className={styles.actionButton}
                onClick={handleCancel}
                size="large"
                style={{
                  borderColor: theme.colorBorder,

                  color: theme.colorText,
                }}
              >
                Cancel payment
              </Button>
            </Flexbox>
          </div>
        </Flexbox>

        {/* Footer Note */}

        <Flexbox align="center" gap={theme.marginXS} style={{ textAlign: 'center' }}>
          <Text
            style={{
              color: theme.colorTextSecondary,

              fontSize: theme.fontSize,

              lineHeight: 1.6,
            }}
          >
            System checks payment status automatically every 15 seconds
          </Text>

          <Text
            style={{
              color: theme.colorTextSecondary,

              fontSize: theme.fontSize,

              lineHeight: 1.6,
            }}
          >
            Need help? Contact support if you encounter any issues
          </Text>
        </Flexbox>
      </div>
    </div>
  );
}

export default function PaymentWaitingPage() {
  const { styles } = useStyles();

  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <Spin size="large" />
        </div>
      }
    >
      <PaymentWaitingContent />
    </Suspense>
  );
}
