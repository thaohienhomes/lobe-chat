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
      className="min-h-screen flex items-center justify-center p-4 md:p-6"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <Clock className="text-blue-600" size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
            Đang chờ thanh toán
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-medium">
            Quét mã QR bằng ứng dụng ngân hàng để hoàn tất thanh toán
          </p>
        </div>

        {/* Main Content - 2 Column Layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - QR Code */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Mã QR Thanh Toán</h3>
            {qrCodeUrl ? (
              <div className="relative">
                <div className="w-72 h-72 md:w-80 md:h-80 border-4 border-blue-500 rounded-2xl flex items-center justify-center bg-white shadow-xl p-4 transform hover:scale-105 transition-transform duration-300">
                  <img
                    alt="QR Code thanh toán"
                    className="max-w-full max-h-full rounded-lg"
                    onError={(e) => {
                      console.error('QR Code failed to load:', qrCodeUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    src={qrCodeUrl}
                  />
                </div>
                {/* Decorative corners */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-blue-600 rounded-tl-lg" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-blue-600 rounded-tr-lg" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-blue-600 rounded-bl-lg" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-blue-600 rounded-br-lg" />
              </div>
            ) : (
              <div className="w-72 h-72 md:w-80 md:h-80 border-4 border-gray-300 rounded-2xl flex items-center justify-center bg-gray-50">
                <div className="relative">
                  <QrCode className="text-gray-300" size={160} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-6 text-center max-w-xs">
              Mã QR này chỉ có hiệu lực trong <span className="font-bold text-red-600">15 phút</span>
            </p>
          </div>

          {/* Right Column - Payment Info */}
          <div className="space-y-6">
            {/* Bank Information */}
            {bankAccount && bankName && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-8 bg-blue-600 rounded-full" />
                  Thông tin chuyển khoản
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <span className="font-semibold text-gray-700">Ngân hàng:</span>
                    <span className="font-bold text-blue-900 text-lg">
                      {decodeURIComponent(bankName)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <span className="font-semibold text-gray-700">Số tài khoản:</span>
                    <span className="font-mono text-xl font-bold text-blue-900">{bankAccount}</span>
                  </div>
                  <div className="flex flex-col gap-2 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <span className="font-semibold text-gray-700">Nội dung chuyển khoản:</span>
                    <span className="font-mono text-sm font-bold text-blue-900 break-all bg-white px-3 py-2 rounded-lg">
                      {orderId}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Amount */}
            <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-2xl shadow-xl p-6 text-white">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-2 h-8 bg-white rounded-full" />
                Số tiền thanh toán
              </h4>
              <div className="text-center py-4">
                <div className="text-5xl font-black mb-2 drop-shadow-lg">
                  {amount
                    ? new Intl.NumberFormat('vi-VN', {
                        currency: 'VND',
                        maximumFractionDigits: 0,
                        style: 'currency',
                      }).format(parseInt(amount))
                    : 'Đang tải...'}
                </div>
                <div className="text-sm opacity-90">Vui lòng chuyển đúng số tiền</div>
              </div>
            </div>

            {/* Order Info & Timer */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-semibold text-gray-700">Mã đơn hàng:</span>
                  <span className="font-mono text-sm font-bold text-gray-900">{orderId}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <span className="font-semibold text-gray-700">Thời gian còn lại:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-2xl ${
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
                      <span className="text-xs font-bold text-white bg-red-500 px-3 py-1 rounded-full animate-pulse">
                        ⚠️ Sắp hết
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions - Full Width Below */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
          <h4 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
            <div className="w-3 h-10 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full" />
            Hướng dẫn thanh toán
          </h4>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <span className="text-gray-800 font-medium pt-1">
                Mở ứng dụng ngân hàng trên điện thoại
              </span>
            </li>
            <li className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <span className="text-gray-800 font-medium pt-1">
                Chọn "Quét QR" hoặc "Chuyển khoản QR"
              </span>
            </li>
            <li className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <span className="text-gray-800 font-medium pt-1">Quét mã QR hiển thị ở trên</span>
            </li>
            <li className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <span className="text-gray-800 font-medium pt-1">
                Xác nhận thông tin và hoàn tất thanh toán
              </span>
            </li>
            <li className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 md:col-span-2">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                ✓
              </div>
              <span className="text-green-900 font-bold pt-1">
                Chờ xác nhận từ hệ thống (tự động chuyển trang sau khi thanh toán thành công)
              </span>
            </li>
          </ol>
        </div>

        {/* Status Indicator */}
        <div className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-center mb-3">
            <RefreshCw className="animate-spin mr-3 text-white" size={24} />
            <span className="text-xl font-bold">Đang kiểm tra trạng thái thanh toán...</span>
          </div>
          {lastCheckTime && (
            <div className="text-center text-sm bg-white/20 rounded-lg py-2 px-4 backdrop-blur-sm">
              <span className="font-semibold">Lần kiểm tra cuối:</span>{' '}
              <span className="font-mono font-bold">
                {lastCheckTime.toLocaleTimeString('vi-VN')}
              </span>{' '}
              <span className="opacity-80">(Lần thứ {pollCount})</span>
            </div>
          )}
          <div className="text-center text-sm mt-2 opacity-90">
            🔄 Hệ thống tự động kiểm tra mỗi 5 giây
          </div>
        </div>

        {/* Manual Verification Notice */}
        {timeLeft < 600 && (
          <div className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl shadow-xl p-6 text-white">
            <h4 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <span>✅</span> Đã hoàn tất thanh toán?
            </h4>
            <p className="text-sm mb-4 opacity-90">
              Nếu bạn đã chuyển khoản thành công nhưng hệ thống chưa cập nhật, bạn có thể xác nhận
              thủ công để kích hoạt ngay gói dịch vụ.
            </p>
            <Button
              className="w-full bg-white text-orange-600 hover:bg-gray-100 font-bold py-3 text-lg"
              disabled={verifying}
              onClick={handleManualVerification}
            >
              {verifying ? '⏳ Đang xác nhận...' : '✓ Tôi đã thanh toán - Xác nhận ngay'}
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-lg"
            disabled={!polling}
            onClick={checkPaymentStatus}
          >
            🔍 Kiểm tra ngay
          </Button>
          <Button
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 text-lg"
            onClick={handleCancel}
          >
            ✕ Hủy thanh toán
          </Button>
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
