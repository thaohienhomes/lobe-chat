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
  createPaymentRecord: vi.fn(),
}));

// Mock Sepay gateway
vi.mock('@/libs/sepay', () => ({
  SepayPaymentGateway: {
    generateOrderId: vi.fn((prefix) => `${prefix}_${Date.now()}`),
  },
  sepayGateway: {
    createCreditCardPayment: vi.fn(),
  },
}));

describe('POST /api/payment/sepay/create-credit-card', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    const request = new Request('http://localhost/api/payment/sepay/create-credit-card', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100000,
        billingCycle: 'monthly',
        cardCvv: '123',
        cardExpiryMonth: '12',
        cardExpiryYear: '2025',
        cardHolderName: 'John Doe',
        cardNumber: '4532015112830366',
        currency: 'VND',
        planId: 'premium',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 400 if required fields are missing', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user123' } as any);

    const request = new Request('http://localhost/api/payment/sepay/create-credit-card', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100000,
        billingCycle: 'monthly',
        // Missing card fields
        planId: 'premium',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('Missing required fields');
  });

  it('should return 400 if amount is less than 1000 VND', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user123' } as any);

    const request = new Request('http://localhost/api/payment/sepay/create-credit-card', {
      method: 'POST',
      body: JSON.stringify({
        amount: 500,
        billingCycle: 'monthly',
        cardCvv: '123',
        cardExpiryMonth: '12',
        cardExpiryYear: '2025',
        cardHolderName: 'John Doe',
        cardNumber: '4532015112830366',
        currency: 'VND',
        planId: 'premium',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('Amount must be at least 1000 VND');
  });

  it('should create credit card payment successfully', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user123' } as any);
    vi.mocked(billingService.createPaymentRecord).mockResolvedValue(undefined);

    const { sepayGateway } = await import('@/libs/sepay');
    vi.mocked(sepayGateway.createCreditCardPayment).mockResolvedValue({
      success: true,
      orderId: 'PHO_CC_123456',
      transactionId: 'TXN_123456',
      paymentUrl: 'https://payment.sepay.vn/pay/PHO_CC_123456',
      message: 'Payment created successfully',
    });

    const request = new Request('http://localhost/api/payment/sepay/create-credit-card', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100000,
        billingCycle: 'monthly',
        cardCvv: '123',
        cardExpiryMonth: '12',
        cardExpiryYear: '2025',
        cardHolderName: 'John Doe',
        cardNumber: '4532015112830366',
        currency: 'VND',
        customerInfo: {
          email: 'john@example.com',
          name: 'John Doe',
          phone: '+84912345678',
        },
        planId: 'premium',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.orderId).toBe('PHO_CC_123456');
    expect(data.transactionId).toBe('TXN_123456');
    expect(data.paymentUrl).toBe('https://payment.sepay.vn/pay/PHO_CC_123456');
  });

  it('should handle payment creation errors', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user123' } as any);

    const { sepayGateway } = await import('@/libs/sepay');
    vi.mocked(sepayGateway.createCreditCardPayment).mockResolvedValue({
      success: false,
      error: 'Invalid card number',
      message: 'Payment creation failed',
      orderId: '',
    });

    const request = new Request('http://localhost/api/payment/sepay/create-credit-card', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100000,
        billingCycle: 'monthly',
        cardCvv: '123',
        cardExpiryMonth: '12',
        cardExpiryYear: '2025',
        cardHolderName: 'John Doe',
        cardNumber: '4532015112830366',
        currency: 'VND',
        planId: 'premium',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid card number');
  });

  it('should handle server errors gracefully', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user123' } as any);

    const { sepayGateway } = await import('@/libs/sepay');
    vi.mocked(sepayGateway.createCreditCardPayment).mockRejectedValue(
      new Error('Network error'),
    );

    const request = new Request('http://localhost/api/payment/sepay/create-credit-card', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100000,
        billingCycle: 'monthly',
        cardCvv: '123',
        cardExpiryMonth: '12',
        cardExpiryYear: '2025',
        cardHolderName: 'John Doe',
        cardNumber: '4532015112830366',
        currency: 'VND',
        planId: 'premium',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Internal server error');
  });

  it('should persist payment record after successful payment', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user123' } as any);
    vi.mocked(billingService.createPaymentRecord).mockResolvedValue(undefined);

    const { sepayGateway } = await import('@/libs/sepay');
    vi.mocked(sepayGateway.createCreditCardPayment).mockResolvedValue({
      success: true,
      orderId: 'PHO_CC_123456',
      transactionId: 'TXN_123456',
      paymentUrl: 'https://payment.sepay.vn/pay/PHO_CC_123456',
      message: 'Payment created successfully',
    });

    const request = new Request('http://localhost/api/payment/sepay/create-credit-card', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100000,
        billingCycle: 'monthly',
        cardCvv: '123',
        cardExpiryMonth: '12',
        cardExpiryYear: '2025',
        cardHolderName: 'John Doe',
        cardNumber: '4532015112830366',
        currency: 'VND',
        planId: 'premium',
      }),
    });

    await POST(request as any);

    expect(billingService.createPaymentRecord).toHaveBeenCalledWith({
      amountVnd: 100000,
      billingCycle: 'monthly',
      currency: 'VND',
      orderId: expect.stringContaining('PHO_CC_'),
      planId: 'premium',
      userId: 'user123',
    });
  });
});

