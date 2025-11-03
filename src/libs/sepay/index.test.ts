import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SepayPaymentGateway } from './index';

describe('SepayPaymentGateway', () => {
  let gateway: SepayPaymentGateway;
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    gateway = new SepayPaymentGateway(
      'test_api_key',
      'test_secret_key',
      'https://api.sepay.vn',
    );
  });

  describe('generateOrderId', () => {
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

  describe('generateSignature', () => {
    it('should generate consistent signature for same data', () => {
      const data = {
        orderId: 'PHO_QR_123456',
        amount: 100000,
        currency: 'VND',
      };

      const sig1 = gateway.generateSignature(data);
      const sig2 = gateway.generateSignature(data);

      expect(sig1).toBe(sig2);
    });

    it('should generate different signatures for different data', () => {
      const data1 = { orderId: 'PHO_QR_123456', amount: 100000 };
      const data2 = { orderId: 'PHO_QR_123456', amount: 200000 };

      const sig1 = gateway.generateSignature(data1);
      const sig2 = gateway.generateSignature(data2);

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const data = {
        orderId: 'PHO_QR_123456',
        amount: 100000,
        currency: 'VND',
        status: 'success',
      };

      const signature = gateway.generateSignature(data);
      const webhookData = { ...data, signature };

      const isValid = gateway.verifyWebhookSignature(webhookData);
      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const webhookData = {
        orderId: 'PHO_QR_123456',
        amount: 100000,
        currency: 'VND',
        status: 'success',
        signature: 'invalid_signature_hash',
      };

      const isValid = gateway.verifyWebhookSignature(webhookData);
      expect(isValid).toBe(false);
    });

    it('should reject tampered webhook data', () => {
      const data = {
        orderId: 'PHO_QR_123456',
        amount: 100000,
        currency: 'VND',
        status: 'success',
      };

      const signature = gateway.generateSignature(data);
      const tamperedData = {
        ...data,
        amount: 200000, // Tampered amount
        signature,
      };

      const isValid = gateway.verifyWebhookSignature(tamperedData);
      expect(isValid).toBe(false);
    });
  });

  describe('createPayment', () => {
    it('should create QR code payment successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          orderId: 'PHO_QR_123456',
          qrCode: 'data:image/png;base64,...',
          message: 'QR code generated successfully',
        }),
      });

      const result = await gateway.createPayment({
        amount: 100000,
        currency: 'VND',
        description: 'Premium subscription',
        orderId: 'PHO_QR_123456',
        paymentMethod: 'qr_code',
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
        paymentMethod: 'qr_code',
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
        paymentMethod: 'qr_code',
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
      expect(result.status).toBe('success');
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

