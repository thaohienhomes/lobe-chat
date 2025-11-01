import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { auth } from '@clerk/nextjs/server';
import * as billingService from '@/server/services/billing/sepay';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock billing service
vi.mock('@/server/services/billing/sepay', () => ({
  getPaymentByOrderId: vi.fn(),
  updatePaymentStatus: vi.fn(),
  activateUserSubscription: vi.fn(),
}));

describe('POST /api/payment/sepay/verify-manual', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    const request = new Request('http://localhost/api/payment/sepay/verify-manual', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'PHO_QR_123456',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should return 400 if order ID is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);

    const request = new Request('http://localhost/api/payment/sepay/verify-manual', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should return 404 if payment record not found', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);
    vi.mocked(billingService.getPaymentByOrderId).mockResolvedValue(undefined);

    const request = new Request('http://localhost/api/payment/sepay/verify-manual', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'PHO_QR_NONEXISTENT',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should return 403 if payment does not belong to user', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);
    vi.mocked(billingService.getPaymentByOrderId).mockResolvedValue({
      id: 'payment_123',
      orderId: 'PHO_QR_123456',
      userId: 'user_456', // Different user
      planId: 'premium',
      billingCycle: 'monthly',
      amountVnd: 100000,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = new Request('http://localhost/api/payment/sepay/verify-manual', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'PHO_QR_123456',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should verify payment and activate subscription successfully', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);
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

    const request = new Request('http://localhost/api/payment/sepay/verify-manual', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'PHO_QR_123456',
        transactionId: 'TXN_123456',
        amount: 100000,
        description: 'Manual verification',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify payment status was updated
    expect(billingService.updatePaymentStatus).toHaveBeenCalledWith(
      'PHO_QR_123456',
      'success',
      expect.any(Object),
    );

    // Verify subscription was activated
    expect(billingService.activateUserSubscription).toHaveBeenCalledWith({
      userId: 'user_123',
      planId: 'premium',
      billingCycle: 'monthly',
    });
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);
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
    vi.mocked(billingService.updatePaymentStatus).mockRejectedValue(
      new Error('Database error'),
    );

    const request = new Request('http://localhost/api/payment/sepay/verify-manual', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'PHO_QR_123456',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should use provided transaction ID or generate one', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);
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

    const request = new Request('http://localhost/api/payment/sepay/verify-manual', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'PHO_QR_123456',
        transactionId: 'CUSTOM_TXN_123',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.transactionId).toBe('CUSTOM_TXN_123');
  });
});

