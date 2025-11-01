import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPaymentRecord,
  updatePaymentStatus,
  activateUserSubscription,
  getPaymentByOrderId,
} from './sepay';
import * as dbModule from '@/server/db';

// Mock database
vi.mock('@/server/db', () => ({
  getServerDB: vi.fn(),
}));

describe('Billing Service - Sepay', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(dbModule.getServerDB).mockResolvedValue(mockDb);
  });

  describe('createPaymentRecord', () => {
    it('should create a payment record successfully', async () => {
      const params = {
        orderId: 'PHO_QR_123456',
        userId: 'user_123',
        planId: 'premium',
        billingCycle: 'monthly' as const,
        amountVnd: 100000,
        currency: 'VND',
      };

      await createPaymentRecord(params);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({
        orderId: params.orderId,
        userId: params.userId,
        planId: params.planId,
      }));
    });

    it('should throw error if database insert fails', async () => {
      mockDb.values.mockRejectedValue(new Error('Database error'));

      const params = {
        orderId: 'PHO_QR_123456',
        userId: 'user_123',
        planId: 'premium',
        billingCycle: 'monthly' as const,
        amountVnd: 100000,
        currency: 'VND',
      };

      await expect(createPaymentRecord(params)).rejects.toThrow('Failed to create payment record');
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      await updatePaymentStatus('PHO_QR_123456', 'success', {
        transactionId: 'TXN_123456',
      });

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
      }));
    });

    it('should throw error if database update fails', async () => {
      mockDb.where.mockRejectedValue(new Error('Database error'));

      await expect(
        updatePaymentStatus('PHO_QR_123456', 'failed'),
      ).rejects.toThrow('Failed to update payment status');
    });

    it('should include transaction ID in update', async () => {
      await updatePaymentStatus('PHO_QR_123456', 'success', {
        transactionId: 'TXN_123456',
      });

      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
        transactionId: 'TXN_123456',
      }));
    });
  });

  describe('activateUserSubscription', () => {
    it('should create new subscription if none exists', async () => {
      mockDb.limit.mockResolvedValue([]);

      await activateUserSubscription({
        userId: 'user_123',
        planId: 'premium',
        billingCycle: 'monthly',
      });

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should update existing subscription', async () => {
      mockDb.limit.mockResolvedValue([{ id: 'sub_123' }]);

      await activateUserSubscription({
        userId: 'user_123',
        planId: 'premium',
        billingCycle: 'monthly',
      });

      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should calculate correct end date for monthly billing', async () => {
      mockDb.limit.mockResolvedValue([]);

      await activateUserSubscription({
        userId: 'user_123',
        planId: 'premium',
        billingCycle: 'monthly',
      });

      const callArgs = mockDb.values.mock.calls[0][0];
      const startDate = new Date(callArgs.currentPeriodStart);
      const endDate = new Date(callArgs.currentPeriodEnd);
      const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBe(30);
    });

    it('should calculate correct end date for yearly billing', async () => {
      mockDb.limit.mockResolvedValue([]);

      await activateUserSubscription({
        userId: 'user_123',
        planId: 'premium',
        billingCycle: 'yearly',
      });

      const callArgs = mockDb.values.mock.calls[0][0];
      const startDate = new Date(callArgs.currentPeriodStart);
      const endDate = new Date(callArgs.currentPeriodEnd);
      const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBe(365);
    });

    it('should throw error if database operation fails', async () => {
      mockDb.limit.mockRejectedValue(new Error('Database error'));

      await expect(
        activateUserSubscription({
          userId: 'user_123',
          planId: 'premium',
          billingCycle: 'monthly',
        }),
      ).rejects.toThrow('Failed to activate subscription');
    });
  });

  describe('getPaymentByOrderId', () => {
    it('should retrieve payment record by order ID', async () => {
      const mockPayment = {
        id: 'payment_123',
        orderId: 'PHO_QR_123456',
        userId: 'user_123',
        status: 'success',
      };
      mockDb.limit.mockResolvedValue([mockPayment]);

      const result = await getPaymentByOrderId('PHO_QR_123456');

      expect(result).toEqual(mockPayment);
    });

    it('should return undefined if payment not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await getPaymentByOrderId('PHO_QR_NONEXISTENT');

      expect(result).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      mockDb.limit.mockRejectedValue(new Error('Database error'));

      const result = await getPaymentByOrderId('PHO_QR_123456');

      expect(result).toBeUndefined();
    });
  });
});

