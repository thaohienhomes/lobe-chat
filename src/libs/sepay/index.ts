import crypto from 'node:crypto';

import { PAYMENT_CONFIG } from '@/config/customizations';

// Payment Method Types
export type PaymentMethod = 'bank_transfer' | 'credit_card';

// Sepay Configuration Interface
export interface SepayConfig {
  apiUrl: string;
  cancelUrl: string;
  creditCardApiKey?: string;
  // Credit Card configuration
  creditCardEnabled?: boolean;
  merchantId: string;
  notifyUrl: string;
  returnUrl: string;
  secretKey: string;
}

// Credit Card Payment Request Interface
export interface CreditCardPaymentRequest {
  amount: number;
  cardCvv: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardHolderName: string;
  cardNumber: string;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  description: string;
  orderId: string;
}

// Payment Request Interface (supports both bank transfer and credit card)
export interface SepayPaymentRequest {
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  description: string;
  orderId: string;
  paymentMethod?: PaymentMethod; // 'bank_transfer' | 'credit_card'
}

// Payment Response Interface
export interface SepayPaymentResponse {
  bankAccount?: string;
  bankName?: string;
  error?: string;
  message: string;
  orderId: string;
  paymentMethod?: PaymentMethod;
  paymentUrl?: string;
  qrCodeUrl?: string;
  success: boolean;
  transactionId?: string;
}

// Webhook Notification Interface
export interface SepayWebhookData {
  amount: number;
  currency: string;
  maskedCardNumber?: string; // For credit card payments (e.g., '****-****-****-0366')
  orderId: string;
  paymentMethod?: PaymentMethod;
  signature: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  transactionId: string;
}

// Sepay Transaction API Response
export interface SepayTransaction {
  account_number: string;
  accumulated: string;
  amount_in: string;
  amount_out: string;
  bank_account_id: string;
  bank_brand_name: string;
  code?: string;
  id: string;
  reference_number: string;
  sub_account?: string;
  transaction_content: string;
  transaction_date: string;
}

// Sepay API Response for transactions
export interface SepayTransactionResponse {
  count_transactions?: number;
  error: string | null;
  messages: {
    success: boolean;
  };
  status: number;
  transaction?: SepayTransaction;
  transactions?: SepayTransaction[];
}

/**
 * Sepay Payment Gateway Integration
 * Vietnamese payment gateway for pho.chat subscription system
 */
export class SepayPaymentGateway {
  private config: SepayConfig;

  constructor(config: SepayConfig) {
    this.config = config;
  }

  /**
   * Generate signature for payment request
   */
  private generateSignature(data: Record<string, any>): string {
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(data).sort();
    const signString = sortedKeys.map((key) => `${key}=${data[key]}`).join('&');

    // Add secret key
    const stringToSign = `${signString}&key=${this.config.secretKey}`;

    // Generate MD5 hash
    return crypto.createHash('md5').update(stringToSign).digest('hex').toUpperCase();
  }

  /**
   * Validate credit card number using Luhn algorithm
   */
  private validateCreditCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replaceAll(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate credit card expiry date
   */
  private validateCreditCardExpiry(month: string, year: string): boolean {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const expiryYear = parseInt(year, 10);
    const expiryMonth = parseInt(month, 10);

    if (expiryMonth < 1 || expiryMonth > 12) return false;
    if (expiryYear < currentYear) return false;
    if (expiryYear === currentYear && expiryMonth < currentMonth) return false;

    return true;
  }

  /**
   * Validate CVV (3-4 digits)
   */
  private validateCVV(cvv: string): boolean {
    return /^\d{3,4}$/.test(cvv);
  }

  /**
   * Mask credit card number for logging (show last 4 digits only)
   */
  private maskCardNumber(cardNumber: string): string {
    const digits = cardNumber.replaceAll(/\D/g, '');
    return `****-****-****-${digits.slice(-4)}`;
  }

  /**
   * Verify webhook signature
   */
  public verifyWebhookSignature(data: SepayWebhookData): boolean {
    const { signature, ...payloadData } = data;
    const expectedSignature = this.generateSignature(payloadData);
    return signature === expectedSignature;
  }

  /**
   * Get bank account information for QR code generation
   * Since Sepay API endpoints may not be available, use configured bank info
   */
  private getBankAccountInfo(): { accountNumber: string; bankName: string } | null {
    // Use centralized config for bank account configuration
    const accountNumber = PAYMENT_CONFIG.sepay.bankAccount;
    const bankName = PAYMENT_CONFIG.sepay.bankName;

    console.log('🏦 Bank Account Configuration Check:');
    console.log('SEPAY_BANK_ACCOUNT:', accountNumber);
    console.log('SEPAY_BANK_NAME:', bankName);

    if (accountNumber && bankName) {
      return { accountNumber, bankName };
    }

    console.error(
      '❌ Bank account information not configured. Please set SEPAY_BANK_ACCOUNT and SEPAY_BANK_NAME environment variables.',
    );
    return null;
  }

  /**
   * Create payment request
   */
  public async createPayment(request: SepayPaymentRequest): Promise<SepayPaymentResponse> {
    try {
      // Check if real Sepay API should be used
      // Both SEPAY_SECRET_KEY and SEPAY_MERCHANT_ID are required for Sepay Payment Gateway
      const useRealSepayAPI = process.env.SEPAY_SECRET_KEY && process.env.SEPAY_MERCHANT_ID;

      if (!useRealSepayAPI) {
        console.log(
          '🧪 MOCK SEPAY: Using mock implementation (missing SEPAY_SECRET_KEY or SEPAY_MERCHANT_ID)',
        );

        // Simulate API delay
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });

        // Generate mock payment waiting URL with QR code
        // IMPORTANT: Always use production URL in production environment
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3010');
        // Use a data URL for the mock QR code (1x1 transparent PNG)
        const mockQrCodeUrl =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const mockPaymentUrl = `${baseUrl}/en-US__0__light/payment/waiting?orderId=${request.orderId}&amount=${request.amount}&qrCodeUrl=${encodeURIComponent(mockQrCodeUrl)}&bankAccount=1234567890&bankName=Mock%20Bank`;

        return {
          message: 'Payment created successfully (MOCK)',
          orderId: request.orderId,
          paymentUrl: mockPaymentUrl,
          success: true,
          transactionId: `MOCK_TXN_${Date.now()}`,
        };
      }

      console.log('🏦 REAL SEPAY: Using real Sepay API integration');

      // Get bank account information for QR code generation
      const bankInfo = this.getBankAccountInfo();
      if (!bankInfo) {
        return {
          error: 'No bank account configured',
          message:
            'Unable to retrieve bank account information. Please configure SEPAY_BANK_ACCOUNT and SEPAY_BANK_NAME.',
          orderId: request.orderId,
          success: false,
        };
      }

      // Generate QR code URL using Sepay's QR service
      // Note: Sepay QR service requires specific parameters
      const qrParams = new URLSearchParams({
        acc: bankInfo.accountNumber,
        amount: request.amount.toString(),
        bank: bankInfo.bankName,
        des: `${request.description} - ${request.orderId}`,
      });
      const qrCodeUrl = `https://qr.sepay.vn/img?${qrParams.toString()}`;

      // Generate payment waiting URL with real QR code
      // IMPORTANT: Always use production URL in production environment
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3010');

      // Construct the payment URL with proper encoding
      const paymentUrlParams = new URLSearchParams({
        amount: request.amount.toString(),
        bankAccount: bankInfo.accountNumber,
        bankName: bankInfo.bankName,
        orderId: request.orderId,
        qrCodeUrl: qrCodeUrl,
      });

      const paymentUrl = `${baseUrl}/en-US__0__light/payment/waiting?${paymentUrlParams.toString()}`;

      console.log('🏦 REAL SEPAY: Payment created with QR code');
      console.log('Bank Account:', bankInfo.accountNumber);
      console.log('Bank Name:', bankInfo.bankName);
      console.log('QR Code URL:', qrCodeUrl);
      console.log('Payment URL:', paymentUrl);

      return {
        bankAccount: bankInfo.accountNumber,
        bankName: bankInfo.bankName,
        message: 'Payment created successfully',
        orderId: request.orderId,
        paymentUrl,
        qrCodeUrl,
        success: true,
        transactionId: `SEPAY_${request.orderId}_${Date.now()}`,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Network error occurred',
        orderId: request.orderId,
        success: false,
      };
    }
  }

  /**
   * Create credit card payment request
   * Supports international credit card payments
   */
  public async createCreditCardPayment(
    request: CreditCardPaymentRequest,
  ): Promise<SepayPaymentResponse> {
    try {
      // Validate credit card information
      if (!this.validateCreditCardNumber(request.cardNumber)) {
        return {
          error: 'Invalid credit card number',
          message: 'The credit card number failed validation',
          orderId: request.orderId,
          success: false,
        };
      }

      if (!this.validateCreditCardExpiry(request.cardExpiryMonth, request.cardExpiryYear)) {
        return {
          error: 'Invalid expiry date',
          message: 'The credit card has expired or expiry date is invalid',
          orderId: request.orderId,
          success: false,
        };
      }

      if (!this.validateCVV(request.cardCvv)) {
        return {
          error: 'Invalid CVV',
          message: 'The CVV must be 3-4 digits',
          orderId: request.orderId,
          success: false,
        };
      }

      // Check if real Sepay API should be used
      const useRealSepayAPI = process.env.SEPAY_SECRET_KEY && process.env.SEPAY_MERCHANT_ID;

      if (!useRealSepayAPI) {
        console.log('🧪 MOCK SEPAY: Using mock credit card implementation');
        console.log('Card:', this.maskCardNumber(request.cardNumber));

        // Simulate API delay
        await new Promise((resolve) => {
          setTimeout(resolve, 1500);
        });

        // Generate mock payment response
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3010';
        const mockPaymentUrl = `${baseUrl}/en-US__0__light/payment/success?orderId=${request.orderId}&method=credit_card`;

        return {
          message: 'Credit card payment processed successfully (MOCK)',
          orderId: request.orderId,
          paymentMethod: 'credit_card',
          paymentUrl: mockPaymentUrl,
          success: true,
          transactionId: `MOCK_CC_${Date.now()}`,
        };
      }

      console.log('💳 REAL SEPAY: Processing credit card payment');
      console.log('Card:', this.maskCardNumber(request.cardNumber));
      console.log('Amount:', request.amount, request.currency);

      // Prepare credit card payment request for Sepay API
      const paymentData = {
        amount: request.amount,
        cardCvv: request.cardCvv,
        cardExpiryMonth: request.cardExpiryMonth,
        cardExpiryYear: request.cardExpiryYear,
        cardHolderName: request.cardHolderName,
        cardNumber: request.cardNumber,
        currency: request.currency,
        customerEmail: request.customerEmail,
        customerName: request.customerName,
        customerPhone: request.customerPhone,
        description: request.description,
        merchantId: this.config.merchantId,
        orderId: request.orderId,
        returnUrl: this.config.returnUrl,
        timestamp: new Date().toISOString(),
      };

      // Generate signature for the request
      const signature = this.generateSignature(paymentData);

      // Call Sepay Credit Card API endpoint
      const response = await fetch(`${this.config.apiUrl}/payment/credit-card`, {
        body: JSON.stringify({
          ...paymentData,
          signature,
        }),
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Sepay API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ REAL SEPAY: Credit card payment created successfully');
        console.log('Transaction ID:', result.transactionId);

        return {
          message: 'Credit card payment created successfully',
          orderId: request.orderId,
          paymentMethod: 'credit_card',
          paymentUrl: result.paymentUrl || this.config.returnUrl,
          success: true,
          transactionId: result.transactionId,
        };
      } else {
        return {
          error: result.error || 'Payment processing failed',
          message: result.message || 'Unable to process credit card payment',
          orderId: request.orderId,
          success: false,
        };
      }
    } catch (error) {
      console.error('❌ REAL SEPAY: Error processing credit card payment:', error);

      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to process credit card payment',
        orderId: request.orderId,
        success: false,
      };
    }
  }

  /**
   * Query payment status by checking recent transactions
   */
  public async queryPaymentStatus(
    orderId: string,
    expectedAmount?: number,
  ): Promise<SepayPaymentResponse> {
    try {
      // Check if real Sepay API should be used
      const useRealSepayAPI = process.env.SEPAY_SECRET_KEY && process.env.SEPAY_MERCHANT_ID;

      if (!useRealSepayAPI) {
        console.log('🧪 MOCK SEPAY: Simulating payment status query for orderId:', orderId);

        // Simulate API delay
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });

        // Mock successful payment status
        return {
          message: 'Payment completed successfully (MOCK)',
          orderId,
          success: true,
          transactionId: `MOCK_TXN_${Date.now()}`,
        };
      }

      console.log('🔍 REAL SEPAY: Checking payment status for orderId:', orderId);

      // Get recent transactions from Sepay API
      const response = await fetch(`https://my.sepay.vn/userapi/transactions/list?limit=50`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.config.secretKey}`,
        },
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Sepay API error: ${response.status}`);
      }

      const result: SepayTransactionResponse = await response.json();

      if (result.status !== 200 || !result.messages.success || !result.transactions) {
        return {
          error: result.error || 'Failed to fetch transactions',
          message: 'Unable to check payment status',
          orderId,
          success: false,
        };
      }

      // Look for a transaction that matches our order ID in the transaction content
      const matchingTransaction = result.transactions.find((transaction) => {
        const content = transaction.transaction_content.toLowerCase();
        const orderIdLower = orderId.toLowerCase();

        // Check if order ID is mentioned in transaction content
        const hasOrderId = content.includes(orderIdLower);

        // Check if amount matches (if provided)
        const amountMatches =
          !expectedAmount ||
          parseFloat(transaction.amount_in) === expectedAmount ||
          parseFloat(transaction.amount_in) === expectedAmount / 100; // Handle different currency formats

        return hasOrderId && amountMatches && parseFloat(transaction.amount_in) > 0;
      });

      if (matchingTransaction) {
        console.log('✅ REAL SEPAY: Payment found!', {
          amount: matchingTransaction.amount_in,
          content: matchingTransaction.transaction_content,
          transactionId: matchingTransaction.id,
        });

        return {
          message: 'Payment completed successfully',
          orderId,
          success: true,
          transactionId: matchingTransaction.id,
        };
      } else {
        console.log('⏳ REAL SEPAY: Payment not found yet for orderId:', orderId);

        return {
          message: 'Payment not found yet',
          orderId,
          success: false,
        };
      }
    } catch (error) {
      console.error('❌ REAL SEPAY: Error checking payment status:', error);

      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to check payment status',
        orderId,
        success: false,
      };
    }
  }

  /**
   * Format amount for Vietnamese currency (VND)
   */
  public static formatVNDAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      currency: 'VND',
      style: 'currency',
    }).format(amount);
  }

  /**
   * Generate unique order ID
   */
  public static generateOrderId(prefix: string = 'PHO'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }
}

// Default Sepay configuration for pho.chat
export const createSepayConfig = (): SepayConfig => {
  // IMPORTANT: Always use production URL in production environment
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3010');

  return {
    apiUrl: PAYMENT_CONFIG.sepay.apiUrl,
    cancelUrl: PAYMENT_CONFIG.sepay.cancelUrl || `${baseUrl}/payment/cancel`,
    creditCardApiKey: PAYMENT_CONFIG.sepay.creditCardApiKey,
    creditCardEnabled: PAYMENT_CONFIG.sepay.creditCardEnabled,
    merchantId: PAYMENT_CONFIG.sepay.merchantId || '',
    notifyUrl: PAYMENT_CONFIG.sepay.webhookUrl || `${baseUrl}/api/payment/sepay/webhook`,
    returnUrl: PAYMENT_CONFIG.sepay.returnUrl || `${baseUrl}/payment/success`,
    secretKey: PAYMENT_CONFIG.sepay.secretKey || '',
  };
};

// Export singleton instance
export const sepayGateway = new SepayPaymentGateway(createSepayConfig());
