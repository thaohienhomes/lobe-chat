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
   * Create payment request
   */
  public async createPayment(request: SepayPaymentRequest): Promise<SepayPaymentResponse> {
    try {
      const paymentData = {
        amount: request.amount,
        cancel_url: this.config.cancelUrl,
        currency: request.currency,
        customer_email: request.customerEmail || '',
        customer_name: request.customerName || '',
        customer_phone: request.customerPhone || '',
        description: request.description,
        merchant_id: this.config.merchantId,
        notify_url: this.config.notifyUrl,
        order_id: request.orderId,
        return_url: this.config.returnUrl,
        timestamp: Date.now().toString(),
      };

      // Generate signature
      const signature = this.generateSignature(paymentData);
      const requestPayload = { ...paymentData, signature };

      // Make API request to Sepay
      const response = await fetch(`${this.config.apiUrl}/create-payment`, {
        body: JSON.stringify(requestPayload),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          message: 'Payment created successfully',
          orderId: request.orderId,
          paymentUrl: result.payment_url,
          success: true,
          transactionId: result.transaction_id,
        };
      } else {
        return {
          error: result.error,
          message: result.message || 'Payment creation failed',
          orderId: request.orderId,
          success: false,
        };
      }
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
   * Query payment status
   */
  public async queryPaymentStatus(orderId: string): Promise<SepayPaymentResponse> {
    try {
      const queryData = {
        merchant_id: this.config.merchantId,
        order_id: orderId,
        timestamp: Date.now().toString(),
      };

      const signature = this.generateSignature(queryData);
      const requestPayload = { ...queryData, signature };

      const response = await fetch(`${this.config.apiUrl}/query-payment`, {
        body: JSON.stringify(requestPayload),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const result = await response.json();

      return {
        error: result.error,
        message: result.message || 'Query completed',
        orderId,
        success: result.success || false,
        transactionId: result.transaction_id,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Query failed',
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
