/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */
'use client';

import { Button } from '@lobehub/ui';
import { Clock, QrCode, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

import { useServerConfigStore } from '@/store/serverConfig';

/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

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
  const router = useRouter();
  const variants = useServerConfigStore((s) => s.segmentVariants);
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'waiting' });
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [polling, setPolling] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const qrCodeUrl = searchParams.get('qrCodeUrl'); // Real QR code URL from SePay
  const bankAccount = searchParams.get('bankAccount');
  const bankName = searchParams.get('bankName');

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

  // Poll payment status every 5 seconds
  const checkPaymentStatus = useCallback(async () => {
    if (!orderId || !polling) {
      console.log('⏸️ Polling skipped:', { orderId, polling });
      return;
    }

    const now = new Date();
    const pollNumber = pollCount + 1;
    setPollCount(pollNumber);
    setLastCheckTime(now);

    try {
      const statusUrl = `/api/payment/sepay/status?orderId=${orderId}${amount ? `&amount=${amount}` : ''}`;
      console.log(
        `🔍 [Poll #${pollNumber}] ${now.toLocaleTimeString()} - Checking payment status:`,
        statusUrl,
      );

      const response = await fetch(statusUrl);
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
          `⏳ [Poll #${pollNumber}] Payment still pending... Will check again in 5 seconds.`,
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
  }, [orderId, amount, polling, router, variants, pollCount]);

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
      console.log('🚀 Starting payment status polling (every 5 seconds)...');
      console.log('📋 Polling configuration:', {
        amount,
        orderId,
        paymentStatus: paymentStatus.status,
        polling,
      });

      // Check immediately on mount
      checkPaymentStatus();

      const interval = setInterval(checkPaymentStatus, 5000);
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
      <div
        style={{
          alignItems: 'center',
          background: '#f5f5f5',
          display: 'flex',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            Thanh toán thành công!
          </h2>
          <p style={{ color: '#666' }}>Đang chuyển hướng đến trang xác nhận...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus.status === 'failed' || paymentStatus.status === 'timeout') {
    const isTimeout = paymentStatus.status === 'timeout';
    return (
      <div
        style={{
          alignItems: 'center',
          background: '#f5f5f5',
          display: 'flex',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>
            {isTimeout ? '⏱️' : '❌'}
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            {isTimeout ? 'Hết thời gian thanh toán' : 'Thanh toán thất bại'}
          </h2>
          <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.6' }}>
            {isTimeout
              ? 'Hệ thống không phát hiện thanh toán trong vòng 15 phút. Nếu bạn đã hoàn tất chuyển khoản, vui lòng xác nhận thủ công hoặc liên hệ hỗ trợ.'
              : paymentStatus.message || 'Vui lòng thử lại hoặc liên hệ hỗ trợ'}
          </p>

          {isTimeout && (
            <div
              style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                marginBottom: '24px',
                padding: '16px',
                textAlign: 'left',
              }}
            >
              <h4 style={{ margin: '0 0 12px 0', color: '#856404', fontWeight: 'bold' }}>
                💡 Bạn đã hoàn tất thanh toán?
              </h4>
              <p style={{ margin: '0 0 12px 0', color: '#856404', fontSize: '14px' }}>
                Nếu bạn đã chuyển khoản thành công nhưng hệ thống chưa cập nhật, bạn có thể xác nhận
                thủ công để kích hoạt ngay gói dịch vụ.
              </p>
              <Button
                className="bg-yellow-600 hover:bg-yellow-700 w-full"
                disabled={verifying}
                onClick={handleManualVerification}
              >
                {verifying ? 'Đang xác nhận...' : '✓ Tôi đã thanh toán - Xác nhận ngay'}
              </Button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button onClick={handleRetry}>
              {isTimeout ? 'Thanh toán lại' : 'Thử lại'}
            </Button>
            <Button onClick={handleCancel}>Hủy bỏ</Button>
          </div>

          {isTimeout && (
            <div
              style={{
                background: '#e7f3ff',
                border: '1px solid #b3d9ff',
                borderRadius: '8px',
                marginTop: '24px',
                padding: '16px',
                textAlign: 'left',
              }}
            >
              <h4 style={{ margin: '0 0 12px 0', color: '#004085', fontWeight: 'bold' }}>
                📞 Cần hỗ trợ?
              </h4>
              <p style={{ margin: '0', color: '#004085', fontSize: '14px' }}>
                Nếu bạn gặp vấn đề, vui lòng liên hệ với đội hỗ trợ của chúng tôi qua email hoặc
                chat trực tiếp.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Prevent hydration mismatch - don't render until mounted
  if (!mounted) {
    return (
      <div
        style={{
          alignItems: 'center',
          background: '#f5f5f5',
          display: 'flex',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div
      style={{
        alignItems: 'center',
        background: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '600px',
          padding: '32px',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div className="mb-6">
          <Clock className="mx-auto mb-4 text-blue-600" size={56} />
          <h2 className="text-3xl font-extrabold mb-3 text-gray-900">Đang chờ thanh toán</h2>
          <p className="text-base text-gray-900 font-medium">
            Vui lòng quét mã QR bằng ứng dụng ngân hàng để hoàn tất thanh toán
          </p>
        </div>

        {/* QR Code Display */}
        <div className="mb-6">
          {qrCodeUrl ? (
            <div className="mx-auto w-64 h-64 border-2 border-gray-200 rounded-lg flex items-center justify-center bg-white">
              <img
                alt="QR Code thanh toán"
                className="max-w-full max-h-full"
                onError={(e) => {
                  console.error('QR Code failed to load:', qrCodeUrl);
                  e.currentTarget.style.display = 'none';
                }}
                src={qrCodeUrl}
              />
            </div>
          ) : (
            <div className="mx-auto w-64 h-64 border-2 border-gray-200 rounded-lg flex items-center justify-center">
              <QrCode className="text-gray-400" size={120} />
              <div className="absolute">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            </div>
          )}
        </div>

        {/* Bank Information */}
        {bankAccount && bankName && (
          <div className="mb-6 p-6 bg-blue-100 rounded-lg border-2 border-blue-400 shadow-md">
            <h4 className="text-xl font-extrabold mb-4 text-blue-950">Thông tin chuyển khoản</h4>
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="font-bold text-gray-900 text-base">Ngân hàng:</span>
                <span className="font-extrabold text-blue-900 text-lg">
                  {decodeURIComponent(bankName)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="font-bold text-gray-900 text-base">Số tài khoản:</span>
                <span className="font-mono text-2xl font-extrabold text-blue-900">
                  {bankAccount}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="font-bold text-gray-900 text-base">Nội dung:</span>
                <span className="font-mono text-sm font-bold text-gray-900 break-all">
                  {orderId}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="mb-6 p-6 bg-yellow-50 rounded-lg border-2 border-yellow-400 shadow-md">
          <div className="flex justify-between items-center mb-3 p-2 bg-white rounded">
            <span className="font-bold text-gray-900 text-base">Số tiền:</span>
            <span className="text-2xl font-extrabold text-red-600">
              {amount
                ? new Intl.NumberFormat('vi-VN', {
                    currency: 'VND',
                    maximumFractionDigits: 0,
                    style: 'currency',
                  }).format(parseInt(amount))
                : 'Đang tải...'}
            </span>
          </div>
          <div className="flex justify-between items-center mb-3 p-2 bg-white rounded">
            <span className="font-bold text-gray-900 text-base">Mã đơn hàng:</span>
            <span className="font-mono text-sm font-bold text-gray-900 break-all">{orderId}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded">
            <span className="font-bold text-gray-900 text-base">Thời gian còn lại:</span>
            <div className="flex items-center gap-2">
              <span
                className={`font-extrabold text-lg ${
                  timeLeft < 300
                    ? 'text-red-600 animate-pulse'
                    : timeLeft < 600
                      ? 'text-orange-600'
                      : 'text-green-600'
                }`}
              >
                {formatTime(timeLeft)}
              </span>
              {timeLeft < 300 && (
                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                  ⚠️ Sắp hết
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 text-left p-4 bg-gray-100 rounded-lg border border-gray-300">
          <h4 className="text-xl font-extrabold mb-4 text-gray-900">Hướng dẫn thanh toán:</h4>
          <ol className="list-decimal list-inside space-y-2 text-base text-gray-900 font-medium">
            <li>Mở ứng dụng ngân hàng trên điện thoại của bạn</li>
            <li>Chọn chức năng "Quét QR" hoặc "Chuyển khoản QR"</li>
            <li>Quét mã QR hiển thị ở trên</li>
            <li>Xác nhận thông tin và hoàn tất thanh toán</li>
            <li className="font-bold text-blue-900">
              Chờ xác nhận từ hệ thống (tự động chuyển trang)
            </li>
          </ol>
        </div>

        {/* Status Indicator */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-300">
          <div className="flex items-center justify-center mb-2">
            <RefreshCw className="animate-spin mr-2 text-blue-600" size={20} />
            <span className="text-blue-900 font-bold text-base">
              Đang kiểm tra trạng thái thanh toán...
            </span>
          </div>
          {lastCheckTime && (
            <div className="text-center text-sm text-gray-700">
              <span className="font-semibold">Lần kiểm tra cuối:</span>{' '}
              <span className="font-mono">{lastCheckTime.toLocaleTimeString('vi-VN')}</span>{' '}
              <span className="text-gray-600">(Lần thứ {pollCount})</span>
            </div>
          )}
          <div className="text-center text-xs text-gray-600 mt-1">
            Hệ thống tự động kiểm tra mỗi 5 giây
          </div>
        </div>

        {/* Manual Verification Notice */}
        {timeLeft < 600 && ( // Show after 5 minutes
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="text-lg font-semibold mb-2 text-yellow-800">Đã hoàn tất thanh toán?</h4>
            <p className="text-sm text-yellow-700 mb-3">
              Nếu bạn đã chuyển khoản thành công nhưng hệ thống chưa cập nhật, bạn có thể xác nhận
              thủ công để kích hoạt ngay gói dịch vụ.
            </p>
            <Button
              className="bg-yellow-600 hover:bg-yellow-700"
              disabled={verifying}
              onClick={handleManualVerification}
            >
              {verifying ? 'Đang xác nhận...' : 'Tôi đã thanh toán - Xác nhận ngay'}
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button disabled={!polling} onClick={checkPaymentStatus}>
            Kiểm tra ngay
          </Button>
          <Button onClick={handleCancel}>Hủy thanh toán</Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentWaitingPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            alignItems: 'center',
            background: '#f5f5f5',
            display: 'flex',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      }
    >
      <PaymentWaitingContent />
    </Suspense>
  );
}
