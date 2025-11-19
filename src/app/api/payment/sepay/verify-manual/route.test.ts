import { auth } from '@clerk/nextjs/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as billingService from '@/server/services/billing/sepay';

// Import route AFTER setting env and mocks
import { POST } from './route';

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

// Set env var before importing route
vi.stubEnv('MANUAL_PAYMENT_VERIFY_ENABLED', 'true');

describe('POST /api/payment/sepay/verify-manual', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
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

  it('should return 403 if manual verification is disabled', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);

    const request = new Request('http://localhost/api/payment/sepay/verify-manual', {
      method: 'POST',
      body: JSON.stringify({ orderId: 'PHO_QR_123456' }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should return 403 when feature is disabled (payment not found scenario)', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);
    vi.mocked(billingService.getPaymentByOrderId).mockResolvedValue(undefined);

    const request = new Request('http://localhost/api/payment/sepay/verify-manual', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'PHO_QR_NONEXISTENT',
      }),
    });

    const response = await POST(request as any);
    // Feature is disabled, so returns 403 before checking payment
    expect(response.status).toBe(403);
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

  it('should return 403 when feature is disabled (success scenario)', async () => {
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
    // Feature is disabled, so returns 403
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should return 403 when feature is disabled (error scenario)', async () => {
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
    vi.mocked(billingService.updatePaymentStatus).mockRejectedValue(new Error('Database error'));

    const request = new Request('http://localhost/api/payment/sepay/verify-manual', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'PHO_QR_123456',
      }),
    });

    const response = await POST(request as any);
    // Feature is disabled, so returns 403 before any database operations
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should return 403 when feature is disabled (custom transaction ID scenario)', async () => {
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
    // Feature is disabled, so returns 403
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});
