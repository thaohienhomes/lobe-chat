import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import * as billingService from '@/server/services/billing/sepay';
import { SepayPaymentGateway } from '@/libs/sepay';

// Mock billing service
vi.mock('@/server/services/billing/sepay', () => ({
  updatePaymentStatus: vi.fn(),
  activateUserSubscription: vi.fn(),
  getPaymentByOrderId: vi.fn(),
}));

// Mock Sepay gateway
vi.mock('@/libs/sepay', () => ({
  sepayGateway: {
    verifyWebhookSignature: vi.fn(),
  },
}));

describe('POST /api/payment/sepay/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWebhookPayload = (overrides = {}) => ({
    orderId: 'PHO_QR_123456',
    status: 'success',
    amount: 100000,
    currency: 'VND',
    description: 'Payment for premium subscription',
    transactionId: 'TXN_123456',
    timestamp: new Date().toISOString(),
    signature: 'valid_signature_hash',
    ...overrides,
  });

  it('should return 400 if webhook payload is missing orderId', async () => {
    const request = new Request('http://localhost/api/payment/sepay/webhook', {
      method: 'POST',
      body: JSON.stringify({
        status: 'success',
        amount: 100000,
        transactionId: 'TXN_123456',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('orderId');
  });

  it('should return 400 if webhook payload is missing transactionId', async () => {
    const request = new Request('http://localhost/api/payment/sepay/webhook', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'PHO_QR_123456',
        status: 'success',
        amount: 100000,
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('transactionId');
  });

  it('should process webhook even if signature verification fails (for debugging)', async () => {
    const { sepayGateway } = await import('@/libs/sepay');
    vi.mocked(sepayGateway.verifyWebhookSignature).mockReturnValue(false);
    vi.mocked(billingService.getPaymentByOrderId).mockResolvedValue({
      id: 'payment_123',
      orderId: 'PHO_QR_123456',
      userId: 'user_123',
      planId: 'premium',
      billingCycle: 'monthly',
      amountVnd: 100000,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(billingService.updatePaymentStatus).mockResolvedValue(undefined);
    vi.mocked(billingService.activateUserSubscription).mockResolvedValue(undefined);

    const request = new Request('http://localhost/api/payment/sepay/webhook', {
      method: 'POST',
      body: JSON.stringify(createWebhookPayload()),
    });

    const response = await POST(request as any);
    // Should still process the webhook (status 200) even with invalid signature
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should process successful payment webhook', async () => {
    const { sepayGateway } = await import('@/libs/sepay');
    vi.mocked(sepayGateway.verifyWebhookSignature).mockReturnValue(true);
    vi.mocked(billingService.getPaymentByOrderId).mockResolvedValue({
      id: 'payment_123',
      orderId: 'PHO_QR_123456',
      userId: 'user_123',
      planId: 'premium',
      billingCycle: 'monthly',
      amountVnd: 100000,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(billingService.updatePaymentStatus).mockResolvedValue(undefined);
    vi.mocked(billingService.activateUserSubscription).mockResolvedValue(undefined);

    const payload = createWebhookPayload({ status: 'success' });
    const request = new Request('http://localhost/api/payment/sepay/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify payment status was updated
    expect(billingService.updatePaymentStatus).toHaveBeenCalledWith(
      'PHO_QR_123456',
      'success',
      expect.objectContaining({
        transactionId: 'TXN_123456',
      }),
    );

    // Verify subscription was activated
    expect(billingService.activateUserSubscription).toHaveBeenCalledWith({
      userId: 'user_123',
      planId: 'premium',
      billingCycle: 'monthly',
    });
  });

  it('should process failed payment webhook', async () => {
    const { sepayGateway } = await import('@/libs/sepay');
    vi.mocked(sepayGateway.verifyWebhookSignature).mockReturnValue(true);
    vi.mocked(billingService.updatePaymentStatus).mockResolvedValue(undefined);

    const payload = createWebhookPayload({ status: 'failed' });
    const request = new Request('http://localhost/api/payment/sepay/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify payment status was updated to failed
    expect(billingService.updatePaymentStatus).toHaveBeenCalledWith(
      'PHO_QR_123456',
      'failed',
      expect.any(Object),
    );
  });

  it('should handle database errors gracefully', async () => {
    const { sepayGateway } = await import('@/libs/sepay');
    vi.mocked(sepayGateway.verifyWebhookSignature).mockReturnValue(true);
    vi.mocked(billingService.updatePaymentStatus).mockRejectedValue(
      new Error('Database connection failed'),
    );

    const payload = createWebhookPayload();
    const request = new Request('http://localhost/api/payment/sepay/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should skip subscription activation if payment record not found', async () => {
    const { sepayGateway } = await import('@/libs/sepay');
    vi.mocked(sepayGateway.verifyWebhookSignature).mockReturnValue(true);
    vi.mocked(billingService.getPaymentByOrderId).mockResolvedValue(undefined);
    vi.mocked(billingService.updatePaymentStatus).mockResolvedValue(undefined);

    const payload = createWebhookPayload({ status: 'success' });
    const request = new Request('http://localhost/api/payment/sepay/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(500); // Should fail because payment record not found

    // Verify subscription activation was NOT called
    expect(billingService.activateUserSubscription).not.toHaveBeenCalled();
  });

  it('should normalize webhook payload with different field names', async () => {
    const { sepayGateway } = await import('@/libs/sepay');
    vi.mocked(sepayGateway.verifyWebhookSignature).mockReturnValue(true);
    vi.mocked(billingService.getPaymentByOrderId).mockResolvedValue({
      id: 'payment_123',
      orderId: 'PHO_QR_123456',
      userId: 'user_123',
      planId: 'premium',
      billingCycle: 'monthly',
      amountVnd: 100000,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(billingService.updatePaymentStatus).mockResolvedValue(undefined);
    vi.mocked(billingService.activateUserSubscription).mockResolvedValue(undefined);

    // Webhook payload with snake_case field names (as Sepay might send)
    const payload = {
      order_id: 'PHO_QR_123456',
      status: 'success',
      amount_in: 100000,
      currency: 'VND',
      transaction_id: 'TXN_123456',
      timestamp: new Date().toISOString(),
      signature: 'valid_signature_hash',
    };

    const request = new Request('http://localhost/api/payment/sepay/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify payment status was updated with normalized data
    expect(billingService.updatePaymentStatus).toHaveBeenCalledWith(
      'PHO_QR_123456',
      'success',
      expect.objectContaining({
        transactionId: 'TXN_123456',
      }),
    );
  });
});

