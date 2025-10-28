/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */
'use client';

import { Button } from '@lobehub/ui';
import { Clock, QrCode, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

import { useServerConfigStore } from '@/store/serverConfig';

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
    if (!orderId || !polling) return;

    try {
      const statusUrl = `/api/payment/sepay/status?orderId=${orderId}${amount ? `&amount=${amount}` : ''}`;
      console.log('🔍 Polling payment status:', statusUrl);
      const response = await fetch(statusUrl);
      const data = await response.json();
      console.log('📊 Payment status response:', data);

      if (data.success && data.status === 'success') {
        console.log('✅ Payment successful! Redirecting...');
        setPaymentStatus({
          message: 'Payment completed successfully!',
          orderId,
          status: 'success',
          transactionId: data.transactionId,
        });
        setPolling(false);

        // Redirect to success page after 2 seconds
        // Use variants if available, otherwise use empty string (will use default route)
        const variantPath = variants || '';
        const redirectUrl = variantPath
          ? `/${variantPath}/payment/success?orderId=${orderId}&status=success&transactionId=${data.transactionId}`
          : `/payment/success?orderId=${orderId}&status=success&transactionId=${data.transactionId}`;
        console.log('🔀 Redirect URL:', redirectUrl, '(variants:', variants, ')');
        setTimeout(() => {
          router.push(redirectUrl);
        }, 2000);
      } else if (data.status === 'failed') {
        console.log('❌ Payment failed');
        setPaymentStatus({
          message: data.message || 'Payment failed',
          orderId,
          status: 'failed',
        });
        setPolling(false);
      } else {
        console.log('⏳ Payment still pending...');
      }
    } catch (error) {
      console.error('❌ Error checking payment status:', error);
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
      const interval = setInterval(checkPaymentStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [polling, paymentStatus.status, checkPaymentStatus]);

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
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            {paymentStatus.status === 'timeout'
              ? 'Hết thời gian thanh toán'
              : 'Thanh toán thất bại'}
          </h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            {paymentStatus.message || 'Vui lòng thử lại hoặc liên hệ hỗ trợ'}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Button onClick={handleRetry}>Thử lại</Button>
            <Button onClick={handleCancel}>Hủy bỏ</Button>
          </div>
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
          <Clock className="mx-auto mb-4 text-blue-500" size={48} />
          <h2 className="text-2xl font-bold mb-2">Đang chờ thanh toán</h2>
          <p className="text-gray-600">
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
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-lg font-semibold mb-3 text-blue-800">Thông tin chuyển khoản</h4>
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Ngân hàng:</span>
                <span className="font-semibold text-blue-600">{decodeURIComponent(bankName)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Số tài khoản:</span>
                <span className="font-mono text-lg font-bold text-blue-600">{bankAccount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Nội dung:</span>
                <span className="font-mono text-sm text-gray-600">{orderId}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Số tiền:</span>
            <span className="text-lg font-semibold text-blue-600">
              {amount
                ? new Intl.NumberFormat('vi-VN', {
                    currency: 'VND',
                    maximumFractionDigits: 0,
                    style: 'currency',
                  }).format(parseInt(amount))
                : 'Đang tải...'}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Mã đơn hàng:</span>
            <span className="font-mono text-sm">{orderId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Thời gian còn lại:</span>
            <span className={`font-semibold ${timeLeft < 300 ? 'text-red-500' : 'text-green-500'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 text-left">
          <h4 className="text-lg font-semibold mb-3">Hướng dẫn thanh toán:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Mở ứng dụng ngân hàng trên điện thoại của bạn</li>
            <li>Chọn chức năng "Quét QR" hoặc "Chuyển khoản QR"</li>
            <li>Quét mã QR hiển thị ở trên</li>
            <li>Xác nhận thông tin và hoàn tất thanh toán</li>
            <li>Chờ xác nhận từ hệ thống (tự động)</li>
          </ol>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center mb-4">
          <RefreshCw className="animate-spin mr-2" size={16} />
          <span className="text-blue-600">Đang kiểm tra trạng thái thanh toán...</span>
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
