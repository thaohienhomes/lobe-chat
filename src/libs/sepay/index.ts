import crypto from 'node:crypto';

// Sepay Configuration Interface
export interface SepayConfig {
  apiUrl: string;
  cancelUrl: string;
  merchantId: string;
  notifyUrl: string;
  returnUrl: string;
  secretKey: string;
}

// Payment Request Interface
export interface SepayPaymentRequest {
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  description: string;
  orderId: string;
}

// Payment Response Interface
export interface SepayPaymentResponse {
  error?: string;
  message: string;
  orderId: string;
  paymentUrl?: string;
  qrCodeUrl?: string;
  bankAccount?: string;
  bankName?: string;
  success: boolean;
  transactionId?: string;
}

// Webhook Notification Interface
export interface SepayWebhookData {
  amount: number;
  currency: string;
  orderId: string;
  signature: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  transactionId: string;
}

// Sepay Transaction API Response
export interface SepayTransaction {
  id: string;
  transaction_date: string;
  account_number: string;
  sub_account?: string;
  amount_in: string;
  amount_out: string;
  accumulated: string;
  code?: string;
  transaction_content: string;
  reference_number: string;
  bank_brand_name: string;
  bank_account_id: string;
}

// Sepay API Response for transactions
export interface SepayTransactionResponse {
  status: number;
  error: string | null;
  messages: {
    success: boolean;
  };
  transactions?: SepayTransaction[];
  transaction?: SepayTransaction;
  count_transactions?: number;
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
    // Use environment variables for bank account configuration
    const accountNumber = process.env.SEPAY_BANK_ACCOUNT;
    const bankName = process.env.SEPAY_BANK_NAME;

    console.log('🏦 Environment Variables Check:');
    console.log('SEPAY_BANK_ACCOUNT:', accountNumber);
    console.log('SEPAY_BANK_NAME:', bankName);

    if (accountNumber && bankName) {
      return { accountNumber, bankName };
    }

    console.error('❌ Bank account information not configured. Please set SEPAY_BANK_ACCOUNT and SEPAY_BANK_NAME environment variables.');
    return null;
  }

  /**
   * Create payment request
   */
  public async createPayment(request: SepayPaymentRequest): Promise<SepayPaymentResponse> {
    try {



      // Check if real Sepay API should be used
      const useRealSepayAPI = process.env.SEPAY_SECRET_KEY && process.env.SEPAY_MERCHANT_ID;

      if (!useRealSepayAPI) {
        console.log('🧪 MOCK SEPAY: Using mock implementation (missing SEPAY_SECRET_KEY or SEPAY_MERCHANT_ID)');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate mock payment waiting URL with QR code
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3010';
        const mockQrCode = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const mockPaymentUrl = `${baseUrl}/en-US__0__light/payment/waiting?orderId=${request.orderId}&amount=${request.amount}&qrCode=${mockQrCode}`;

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
          message: 'Unable to retrieve bank account information. Please configure SEPAY_BANK_ACCOUNT and SEPAY_BANK_NAME.',
          orderId: request.orderId,
          success: false,
        };
      }

      // Generate QR code URL using Sepay's QR service
      const qrParams = new URLSearchParams({
        acc: bankInfo.accountNumber,
        bank: bankInfo.bankName,
        amount: request.amount.toString(),
        des: `${request.description} - ${request.orderId}`,
      });
      const qrCodeUrl = `https://qr.sepay.vn/img?${qrParams.toString()}`;

      // Generate payment waiting URL with real QR code
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3010';
      const paymentUrl = `${baseUrl}/en-US__0__light/payment/waiting?orderId=${request.orderId}&amount=${request.amount}&qrCodeUrl=${encodeURIComponent(qrCodeUrl)}&bankAccount=${bankInfo.accountNumber}&bankName=${encodeURIComponent(bankInfo.bankName)}`;

      console.log('🏦 REAL SEPAY: Payment created with QR code');
      console.log('Bank Account:', bankInfo.accountNumber);
      console.log('Bank Name:', bankInfo.bankName);
      console.log('QR Code URL:', qrCodeUrl);

      return {
        message: 'Payment created successfully',
        orderId: request.orderId,
        paymentUrl,
        qrCodeUrl,
        bankAccount: bankInfo.accountNumber,
        bankName: bankInfo.bankName,
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
   * Query payment status by checking recent transactions
   */
  public async queryPaymentStatus(orderId: string, expectedAmount?: number): Promise<SepayPaymentResponse> {
    try {
      // Check if real Sepay API should be used
      const useRealSepayAPI = process.env.SEPAY_SECRET_KEY && process.env.SEPAY_MERCHANT_ID;

      if (!useRealSepayAPI) {
        console.log('🧪 MOCK SEPAY: Simulating payment status query for orderId:', orderId);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

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
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Accept': 'application/json',
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
      const matchingTransaction = result.transactions.find(transaction => {
        const content = transaction.transaction_content.toLowerCase();
        const orderIdLower = orderId.toLowerCase();

        // Check if order ID is mentioned in transaction content
        const hasOrderId = content.includes(orderIdLower);

        // Check if amount matches (if provided)
        const amountMatches = !expectedAmount ||
          parseFloat(transaction.amount_in) === expectedAmount ||
          parseFloat(transaction.amount_in) === expectedAmount / 100; // Handle different currency formats

        return hasOrderId && amountMatches && parseFloat(transaction.amount_in) > 0;
      });

      if (matchingTransaction) {
        console.log('✅ REAL SEPAY: Payment found!', {
          transactionId: matchingTransaction.id,
          amount: matchingTransaction.amount_in,
          content: matchingTransaction.transaction_content,
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
  return {
    apiUrl: process.env.SEPAY_API_URL || 'https://api.sepay.vn/v1',
    cancelUrl: process.env.SEPAY_CANCEL_URL || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
    merchantId: process.env.SEPAY_MERCHANT_ID || '',
    notifyUrl:
      process.env.SEPAY_NOTIFY_URL ||
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/sepay/webhook`,
    returnUrl:
      process.env.SEPAY_RETURN_URL || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
    secretKey: process.env.SEPAY_SECRET_KEY || '',
  };
};

// Export singleton instance
export const sepayGateway = new SepayPaymentGateway(createSepayConfig());
