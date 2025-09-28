import crypto from 'crypto';

// Sepay Configuration Interface
export interface SepayConfig {
  merchantId: string;
  secretKey: string;
  apiUrl: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

// Payment Request Interface
export interface SepayPaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
}

// Payment Response Interface
export interface SepayPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  orderId: string;
  transactionId?: string;
  message: string;
  error?: string;
}

// Webhook Notification Interface
export interface SepayWebhookData {
  orderId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  signature: string;
  timestamp: string;
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
    const signString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
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
        merchant_id: this.config.merchantId,
        order_id: request.orderId,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        return_url: this.config.returnUrl,
        cancel_url: this.config.cancelUrl,
        notify_url: this.config.notifyUrl,
        customer_email: request.customerEmail || '',
        customer_name: request.customerName || '',
        customer_phone: request.customerPhone || '',
        timestamp: Date.now().toString(),
      };

      // Generate signature
      const signature = this.generateSignature(paymentData);
      const requestPayload = { ...paymentData, signature };

      // Make API request to Sepay
      const response = await fetch(`${this.config.apiUrl}/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          paymentUrl: result.payment_url,
          orderId: request.orderId,
          transactionId: result.transaction_id,
          message: 'Payment created successfully',
        };
      } else {
        return {
          success: false,
          orderId: request.orderId,
          message: result.message || 'Payment creation failed',
          error: result.error,
        };
      }
    } catch (error) {
      return {
        success: false,
        orderId: request.orderId,
        message: 'Network error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const result = await response.json();

      return {
        success: result.success || false,
        orderId,
        transactionId: result.transaction_id,
        message: result.message || 'Query completed',
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        orderId,
        message: 'Query failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Format amount for Vietnamese currency (VND)
   */
  public static formatVNDAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  /**
   * Generate unique order ID
   */
  public static generateOrderId(prefix: string = 'PHO'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }
}

// Default Sepay configuration for pho.chat
export const createSepayConfig = (): SepayConfig => {
  return {
    merchantId: process.env.SEPAY_MERCHANT_ID || '',
    secretKey: process.env.SEPAY_SECRET_KEY || '',
    apiUrl: process.env.SEPAY_API_URL || 'https://api.sepay.vn/v1',
    returnUrl: process.env.SEPAY_RETURN_URL || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
    cancelUrl: process.env.SEPAY_CANCEL_URL || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
    notifyUrl: process.env.SEPAY_NOTIFY_URL || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/sepay/webhook`,
  };
};

// Export singleton instance
export const sepayGateway = new SepayPaymentGateway(createSepayConfig());
