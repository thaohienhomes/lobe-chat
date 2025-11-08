/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */
'use client';

import { Button } from '@lobehub/ui';
import { Card, Spin, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Check, Clock, Copy, QrCode } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useServerConfigStore } from '@/store/serverConfig';

/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

const { Title, Paragraph, Text } = Typography;

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const useStyles = createStyles(({ css, token }) => ({
  actionButton: css`
    width: 100%;
  `,
  actionCard: css`
    padding: ${token.paddingLG}px;
    border: 1px solid ${token.colorWarningBorder};
    border-radius: ${token.borderRadiusLG}px;

    background: linear-gradient(
      135deg,
      ${token.colorWarningBg} 0%,
      ${token.colorWarningBgHover} 100%
    );

    transition: all 0.3s ease;

    &:hover {
      box-shadow: ${token.boxShadowSecondary};
    }
  `,
  amountCard: css`
    padding: ${token.paddingLG}px;
    border-radius: ${token.borderRadiusLG}px;

    color: ${token.colorWhite};
    text-align: center;

    background: linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%);
  `,
  amountText: css`
    margin-block: ${token.marginXS}px;
    margin-inline: 0;

    font-size: 32px;
    font-weight: bold;
    color: ${token.colorWhite};
  `,
  bankDetailRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;

    margin-block-end: ${token.marginSM}px;
    padding-block: ${token.paddingSM}px;
    padding-inline: ${token.padding}px;
    border-radius: ${token.borderRadius}px;

    background: ${token.colorFillQuaternary};
  `,
  cancelCard: css`
    padding: ${token.paddingLG}px;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};

    transition: all 0.3s ease;

    &:hover {
      box-shadow: ${token.boxShadowSecondary};
    }
  `,
  container: css`
    display: flex;
    align-items: center;
    justify-content: center;

    min-height: 100vh;
    padding: ${token.padding}px;

    background: #f5f5f5;
  `,
  copyButton: css`
    cursor: pointer;
    padding: ${token.paddingXS}px;
    border-radius: ${token.borderRadiusSM}px;
    transition: all 0.2s ease;

    &:hover {
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

    width: 64px;
    height: 64px;
    margin-block-end: ${token.margin}px;
    border-radius: 50%;

    background: ${token.colorPrimaryBg};
  `,
  instructionCard: css`
    margin-block-end: ${token.marginLG}px;
    padding: ${token.paddingLG}px;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};
  `,
  instructionStep: css`
    display: flex;
    gap: ${token.marginSM}px;
    align-items: center;

    padding-block: ${token.paddingSM}px;
    padding-inline: ${token.padding}px;
    border-radius: ${token.borderRadius}px;

    background: ${token.colorFillQuaternary};
  `,
  mainCard: css`
    width: 100%;
    max-width: 1200px;
    padding: ${token.paddingLG}px;
  `,
  qrCodeContainer: css`
    position: relative;

    aspect-ratio: 1;
    width: 100%;
    max-width: 300px;
    margin-block: 0 ${token.marginLG}px;
    margin-inline: auto;
  `,
  qrCodeWrapper: css`
    position: relative;

    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    height: 100%;
    padding: ${token.paddingLG}px;
    border-radius: ${token.borderRadiusLG}px;

    background: linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%);
    box-shadow: inset 0 0 0 1px rgba(24, 144, 255, 20%);
  `,

  qrSection: css`
    display: flex;
    flex-direction: column;

    padding: ${token.paddingLG}px;
    border: 1px solid #f0f0f0;
    border-radius: ${token.borderRadiusLG}px;

    background: #fff;

    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 10%);
    }
  `,

  referenceBox: css`
    padding-block: ${token.paddingSM}px;
    padding-inline: ${token.padding}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorFillQuaternary};
  `,

  referenceText: css`
    padding-block: ${token.paddingXS}px;
    padding-inline: ${token.paddingSM}px;
    border-radius: ${token.borderRadiusSM}px;

    font-family: ${token.fontFamilyCode};
    font-size: ${token.fontSizeSM}px;
    font-weight: 600;
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
    padding-block: ${token.padding}px;
    padding-inline: ${token.paddingLG}px;
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};
    box-shadow: ${token.boxShadow};
  `,
  statusIndicator: css`
    position: relative;

    width: 12px;
    height: 12px;
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

    width: 32px;
    height: 32px;
    border-radius: 50%;

    font-size: ${token.fontSizeSM}px;
    font-weight: 600;
    color: ${token.colorWhite};

    background: ${token.colorPrimary};
  `,
  timeLeft: css`
    margin-inline-start: ${token.marginXS}px;
    font-size: 24px;
    font-weight: bold;
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
    padding: ${token.paddingLG}px;
    border: 1px solid ${token.colorWarningBorder};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorWarningBg};
  `,
  validityInfo: css`
    padding-block: ${token.paddingSM}px;
    padding-inline: ${token.padding}px;
    border: 1px solid #91caff;
    border-radius: ${token.borderRadius}px;

    text-align: center;

    background: #e6f4ff;
  `,
}));

interface PaymentStatus {
  message?: string;
  orderId?: string;
  status: 'waiting' | 'success' | 'failed' | 'timeout';
  transactionId?: string;
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

function PaymentWaitingContent() {
  const { styles, cx } = useStyles();
  const router = useRouter();
  const variants = useServerConfigStore((s) => s.segmentVariants);
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'waiting' });
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [polling, setPolling] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const pollNumberRef = useRef(0);

  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const qrCodeUrl = searchParams.get('qrCodeUrl');
  const bankAccount = searchParams.get('bankAccount');
  const bankName = searchParams.get('bankName');

  // Copy to clipboard function
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug log (only on client)
  useEffect(() => {
    if (mounted) {
      console.log('🎯 Waiting page params:', { amount, orderId, qrCodeUrl, variants });
    }
  }, [mounted, variants, orderId, amount, qrCodeUrl]);

  // Poll payment status every 15 seconds (reduced from 5s to avoid rate limiting)
  const checkPaymentStatus = useCallback(async () => {
    if (!orderId || !polling) {
      console.log('⏸️ Polling skipped:', { orderId, polling });
      return;
    }

    const now = new Date();
    // increment poll number without causing hook dependencies to change
    pollNumberRef.current += 1;
    const pollNumber = pollNumberRef.current;
    setLastCheckTime(now);

    try {
      const statusUrl = `/api/payment/sepay/status?orderId=${orderId}${amount ? `&amount=${amount}` : ''}`;
      console.log(
        `🔍 [Poll #${pollNumber}] ${now.toLocaleTimeString()} - Checking payment status:`,
        statusUrl,
      );

      const response = await fetch(statusUrl, { cache: 'no-store' });
      const data = await response.json();

      console.log(`📊 [Poll #${pollNumber}] ${now.toLocaleTimeString()} - Response:`, {
        fullData: data,
        message: data.message,
        status: data.status,
        success: data.success,
        transactionId: data.transactionId,
      });

      if (data.success && data.status === 'success') {
        console.log(`✅ [Poll #${pollNumber}] Payment successful! Redirecting in 2 seconds...`);
        setPaymentStatus({
          message: 'Payment completed successfully!',
          orderId,
          status: 'success',
          transactionId: data.transactionId,
        });
        setPolling(false);

        // Redirect to success page after 2 seconds
        const variantPath = variants || '';
        const redirectUrl = variantPath
          ? `/${variantPath}/payment/success?orderId=${orderId}&status=success&transactionId=${data.transactionId}`
          : `/payment/success?orderId=${orderId}&status=success&transactionId=${data.transactionId}`;
        console.log(
          `🔀 [Poll #${pollNumber}] Redirect URL:`,
          redirectUrl,
          '(variants:',
          variants,
          ')',
        );

        setTimeout(() => {
          console.log(`🚀 [Poll #${pollNumber}] Executing redirect now...`);
          router.push(redirectUrl);
        }, 2000);
      } else if (data.status === 'failed') {
        console.log(`❌ [Poll #${pollNumber}] Payment failed:`, data.message);
        setPaymentStatus({
          message: data.message || 'Payment failed',
          orderId,
          status: 'failed',
        });
        setPolling(false);
      } else {
        console.log(
          `⏳ [Poll #${pollNumber}] Payment still pending... Will check again in 15 seconds.`,
        );
      }
    } catch (error) {
      console.error(`❌ [Poll #${pollNumber}] Error checking payment status:`, error);
      console.error(`❌ [Poll #${pollNumber}] Error details:`, {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }, [orderId, amount, polling, router, variants]);

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
      console.log('🚀 Starting payment status polling (every 15 seconds)...');
      console.log('📋 Polling configuration:', {
        amount,
        orderId,
        paymentStatus: paymentStatus.status,
        polling,
      });

      // Check immediately on mount
      checkPaymentStatus();

      const interval = setInterval(checkPaymentStatus, 15_000); // 15 seconds
      return () => {
        console.log('🛑 Stopping payment status polling');
        clearInterval(interval);
      };
    } else {
      console.log('⏸️ Polling not started:', {
        paymentStatus: paymentStatus.status,
        polling,
      });
    }
  }, [polling, paymentStatus.status, checkPaymentStatus, orderId, amount]);

  const handleRetry = () => {
    router.push(`/${variants}/subscription/checkout`);
  };

  const handleCancel = () => {
    router.push(`/${variants}/settings/subscription`);
  };

  const handleManualVerification = async () => {
    if (!orderId || verifying) return;

    setVerifying(true);
    try {
      const response = await fetch('/api/payment/sepay/verify-manual', {
        body: JSON.stringify({
          amount: amount ? parseInt(amount) : undefined,
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

        // Redirect to success page after 2 seconds
        setTimeout(() => {
          router.push(
            `/${variants}/payment/success?orderId=${orderId}&status=success&transactionId=${data.transactionId}`,
          );
        }, 2000);
      } else {
        alert(`Verification failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Manual verification error:', error);
      alert('Failed to verify payment. Please try again or contact support.');
    } finally {
      setVerifying(false);
    }
  };

  if (paymentStatus.status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Thanh toán thành công!</h2>
          <p className="text-gray-600">Đang chuyển hướng đến trang xác nhận...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus.status === 'failed' || paymentStatus.status === 'timeout') {
    const isTimeout = paymentStatus.status === 'timeout';
    return (
      <div className={styles.container}>
        <Card className={styles.mainCard} style={{ maxWidth: 600 }}>
          <Flexbox align="center" gap={24}>
            <div className={styles.headerIcon} style={{ background: '#fff1f0' }}>
              <Clock size={40} style={{ color: '#ff4d4f' }} />
            </div>
            <Title level={2} style={{ marginBottom: 0 }}>
              {isTimeout ? 'Hết thời gian thanh toán' : 'Thanh toán thất bại'}
            </Title>
            <Paragraph style={{ fontSize: 16, textAlign: 'center' }}>
              {isTimeout
                ? 'Hệ thống không phát hiện thanh toán trong vòng 15 phút. Nếu bạn đã hoàn tất chuyển khoản, vui lòng xác nhận thủ công.'
                : paymentStatus.message || 'Vui lòng thử lại hoặc liên hệ hỗ trợ'}
            </Paragraph>

            {isTimeout && (
              <div className={styles.timeoutCard} style={{ width: '100%' }}>
                <Title level={4}>💡 Bạn đã hoàn tất thanh toán?</Title>
                <Paragraph>
                  Nếu bạn đã chuyển khoản thành công nhưng hệ thống chưa cập nhật, bạn có thể xác
                  nhận thủ công để kích hoạt ngay gói dịch vụ.
                </Paragraph>
                <Button
                  block
                  disabled={verifying}
                  loading={verifying}
                  onClick={handleManualVerification}
                  size="large"
                  type="primary"
                >
                  {verifying ? 'Đang xác nhận...' : '✓ Tôi đã thanh toán - Xác nhận ngay'}
                </Button>
              </div>
            )}

            <Flexbox gap={12} horizontal style={{ width: '100%' }}>
              <Button onClick={handleRetry} size="large" style={{ flex: 1 }} type="primary">
                {isTimeout ? 'Thanh toán lại' : 'Thử lại'}
              </Button>
              <Button onClick={handleCancel} size="large" style={{ flex: 1 }}>
                Hủy bỏ
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
        <Flexbox align="center" gap={16} style={{ marginBottom: 32, textAlign: 'center' }}>
          <div className={styles.headerIcon}>
            <Clock size={32} />
          </div>
          <Title level={1} style={{ marginBottom: 8 }}>
            Complete Your Payment
          </Title>
          <Paragraph style={{ fontSize: 16 }}>Scan the QR code with your banking app</Paragraph>
        </Flexbox>

        {/* Status & Timer Bar */}
        <div className={styles.statusBar}>
          <Flexbox align="center" gap={16} horizontal justify="space-between">
            <Flexbox align="center" gap={12} horizontal>
              <div className={styles.statusIndicator} />
              <Flexbox gap={4}>
                <Text strong>Checking payment status...</Text>
                {lastCheckTime && (
                  <Text style={{ fontSize: 12 }} type="secondary">
                    Last: {lastCheckTime.toLocaleTimeString('vi-VN')}
                  </Text>
                )}
              </Flexbox>
            </Flexbox>
            <Flexbox
              align="center"
              gap={8}
              horizontal
              style={{
                background: '#f5f5f5',
                borderRadius: 12,
                padding: '8px 16px',
              }}
            >
              <Clock size={16} />
              <Text style={{ fontSize: 14 }}>Time:</Text>
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
              {timeLeft < 300 && (
                <span
                  style={{
                    background: '#ff4d4f',
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    marginLeft: 4,
                    padding: '2px 8px',
                  }}
                >
                  Hurry!
                </span>
              )}
            </Flexbox>
          </Flexbox>
        </div>

        {/* Main Content Grid - Equal Height Cards */}
        <Flexbox gap={24} horizontal style={{ marginBottom: 24 }}>
          {/* QR Code Section */}
          <div className={styles.qrSection} style={{ flex: 1 }}>
            <Flexbox align="center" gap={8} style={{ marginBottom: 24, textAlign: 'center' }}>
              <Title level={3} style={{ marginBottom: 4 }}>
                Payment QR Code
              </Title>
              <Text type="secondary">Scan to complete payment instantly</Text>
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
                  <Flexbox
                    align="center"
                    justify="center"
                    style={{
                      background: '#f5f5f5',
                      borderRadius: 16,
                      height: '100%',
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <QrCode size={128} style={{ color: '#d9d9d9' }} />
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
              <Text strong style={{ color: '#1890ff' }}>
                Valid for: {formatTime(timeLeft)}
              </Text>
              <br />
              <Text style={{ color: '#1890ff', fontSize: 12 }}>
                QR code expires after 15 minutes
              </Text>
            </div>
          </div>

          {/* Payment Details Section */}
          <div className={styles.qrSection} style={{ flex: 1 }}>
            <Title level={3} style={{ marginBottom: 24 }}>
              Payment Details
            </Title>

            <Flexbox gap={16} style={{ flex: 1 }}>
              {/* Amount */}
              <div className={styles.amountCard}>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Amount to Pay</Text>
                <div className={styles.amountText}>
                  {amount
                    ? new Intl.NumberFormat('vi-VN', {
                        currency: 'VND',
                        maximumFractionDigits: 0,
                        style: 'currency',
                      }).format(parseInt(amount))
                    : 'Loading...'}
                </div>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>
                  Transfer exact amount
                </Text>
              </div>

              {/* Bank Details */}
              {bankAccount && bankName && (
                <Flexbox gap={12}>
                  <div className={styles.bankDetailRow}>
                    <Text type="secondary">Bank</Text>
                    <Text strong>{decodeURIComponent(bankName)}</Text>
                  </div>
                  <div className={styles.bankDetailRow}>
                    <Text type="secondary">Account</Text>
                    <Flexbox align="center" gap={8} horizontal>
                      <Text code strong>
                        {bankAccount}
                      </Text>
                      <button
                        aria-label="Copy account number"
                        className={styles.copyButton}
                        onClick={() => copyToClipboard(bankAccount, 'account')}
                        type="button"
                      >
                        {copiedField === 'account' ? (
                          <Check size={16} style={{ color: '#52c41a' }} />
                        ) : (
                          <Copy size={16} style={{ color: '#8c8c8c' }} />
                        )}
                      </button>
                    </Flexbox>
                  </div>
                  <div className={styles.referenceBox}>
                    <Flexbox align="center" gap={8} horizontal justify="space-between">
                      <Text type="secondary">Reference</Text>
                      <button
                        aria-label="Copy order ID"
                        className={styles.copyButton}
                        onClick={() => copyToClipboard(orderId || '', 'orderId')}
                        type="button"
                      >
                        {copiedField === 'orderId' ? (
                          <Check size={16} style={{ color: '#52c41a' }} />
                        ) : (
                          <Copy size={16} style={{ color: '#8c8c8c' }} />
                        )}
                      </button>
                    </Flexbox>
                    <div className={styles.referenceText}>{orderId}</div>
                  </div>
                </Flexbox>
              )}
            </Flexbox>
          </div>
        </Flexbox>

        {/* Instructions - Condensed */}
        <div className={styles.instructionCard}>
          <Title level={4} style={{ marginBottom: 20 }}>
            How to Pay
          </Title>
          <Flexbox
            gap={12}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}
          >
            {[
              { icon: '📱', step: 'Open your banking app' },
              { icon: '🔍', step: 'Select "Scan QR" or "Transfer"' },
              { icon: '📷', step: 'Scan the QR code above' },
              { icon: '✓', step: 'Confirm and complete payment' },
            ].map((item, index) => (
              <div className={styles.instructionStep} key={index}>
                <div className={styles.stepNumber}>{index + 1}</div>
                <Text>{item.step}</Text>
              </div>
            ))}
          </Flexbox>
        </div>

        {/* Action Cards - Grouped */}
        <Flexbox gap={20} horizontal style={{ marginBottom: 24 }}>
          {/* Manual Verification */}
          <div className={styles.actionCard} style={{ flex: 1 }}>
            <Title level={5} style={{ marginBottom: 8 }}>
              Already paid?
            </Title>
            <Paragraph style={{ fontSize: 14, marginBottom: 16 }}>
              Manually verify if payment completed but not detected
            </Paragraph>
            <Button
              block
              disabled={verifying}
              loading={verifying}
              onClick={handleManualVerification}
              size="large"
              type="primary"
            >
              {verifying ? 'Verifying...' : '✓ Verify Payment'}
            </Button>
          </div>

          {/* Quick Actions */}
          <div className={styles.cancelCard} style={{ flex: 1 }}>
            <Title level={5} style={{ marginBottom: 12 }}>
              Quick Actions
            </Title>
            <Flexbox gap={12}>
              <Button
                block
                disabled={!polling}
                onClick={checkPaymentStatus}
                size="large"
                type="primary"
              >
                🔍 Check Status Now
              </Button>
              <Button block onClick={handleCancel} size="large">
                ✕ Cancel Payment
              </Button>
            </Flexbox>
          </div>
        </Flexbox>

        {/* Footer Note */}
        <Flexbox align="center" gap={8} style={{ textAlign: 'center' }}>
          <Text type="secondary">System checks payment status automatically every 15 seconds</Text>
          <Text type="secondary">Need help? Contact support if you encounter any issues</Text>
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
