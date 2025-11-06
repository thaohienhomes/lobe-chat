import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SepayPaymentGateway } from './index';

describe('SepayPaymentGateway', () => {
  let gateway: SepayPaymentGateway;
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    gateway = new SepayPaymentGateway({
      apiUrl: 'https://api.sepay.vn',
      merchantId: 'test_merchant_id',
      secretKey: 'test_secret_key',
      returnUrl: 'https://pho.chat/payment/success',
      cancelUrl: 'https://pho.chat/payment/cancel',
      notifyUrl: 'https://pho.chat/api/payment/sepay/webhook',
      creditCardEnabled: true,
      creditCardApiKey: 'test_cc_api_key',
    });
  });

  describe.skip('generateOrderId', () => {
    it('should generate order ID with correct prefix', () => {
      const orderId = SepayPaymentGateway.generateOrderId('PHO_QR');
      expect(orderId).toMatch(/^PHO_QR_\d+$/);
    });

    it('should generate unique order IDs', () => {
      const id1 = SepayPaymentGateway.generateOrderId('PHO_QR');
      const id2 = SepayPaymentGateway.generateOrderId('PHO_QR');
      expect(id1).not.toBe(id2);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should reject invalid webhook signature', () => {
      const webhookData = {
        orderId: 'PHO_QR_123456',
        amount: 100000,
        currency: 'VND',
        status: 'success' as const,
        signature: 'invalid_signature_hash',
        timestamp: new Date().toISOString(),
        transactionId: 'TXN_123456',
      };

      const isValid = gateway.verifyWebhookSignature(webhookData);
      expect(isValid).toBe(false);
    });
  });

  describe('createPayment', () => {
    it('should create bank transfer payment successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          orderId: 'PHO_QR_123456',
          qrCodeUrl: 'https://api.sepay.vn/qr/PHO_QR_123456',
          message: 'Payment created successfully',
        }),
      });

      const result = await gateway.createPayment({
        amount: 100000,
        currency: 'VND',
        description: 'Premium subscription',
        orderId: 'PHO_QR_123456',
        paymentMethod: 'bank_transfer',
      });

      expect(result.success).toBe(true);
      expect(result.orderId).toBe('PHO_QR_123456');
    });

    it('should handle payment creation errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Invalid amount',
          message: 'Amount must be at least 1000 VND',
        }),
      });

      const result = await gateway.createPayment({
        amount: 500,
        currency: 'VND',
        description: 'Premium subscription',
        orderId: 'PHO_QR_123456',
        paymentMethod: 'bank_transfer',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid amount');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await gateway.createPayment({
        amount: 100000,
        currency: 'VND',
        description: 'Premium subscription',
        orderId: 'PHO_QR_123456',
        paymentMethod: 'bank_transfer',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('queryPaymentStatus', () => {
    it('should query payment status successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          status: 'success',
          transactionId: 'TXN_123456',
          amount: 100000,
        }),
      });

      const result = await gateway.queryPaymentStatus('PHO_QR_123456');

      expect(result.success).toBe(true);
    });

    it('should handle query errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Payment not found',
        }),
      });

      const result = await gateway.queryPaymentStatus('PHO_QR_NONEXISTENT');

      expect(result.success).toBe(false);
    });
  });
});
