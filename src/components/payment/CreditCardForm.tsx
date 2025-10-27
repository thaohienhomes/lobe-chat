'use client';

import { CreditCard, Lock } from 'lucide-react';
import { Form, Input, Button, Space, Alert, message } from 'antd';
import { useState } from 'react';

interface CreditCardFormProps {
  onSubmit: (cardData: CreditCardFormData) => Promise<void>;
  loading?: boolean;
  amount: number;
}

export interface CreditCardFormData {
  cardCvv: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardHolderName: string;
  cardNumber: string;
}

/**
 * Credit Card Payment Form Component
 * Handles credit card input with client-side validation
 * Card data is never stored on the server
 */
export function CreditCardForm({ onSubmit, loading = false, amount }: CreditCardFormProps) {
  const [form] = Form.useForm();
  const [cardNumberFormatted, setCardNumberFormatted] = useState('');

  /**
   * Luhn Algorithm - Validates credit card numbers
   */
  const validateLuhn = (cardNumber: string): boolean => {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  /**
   * Format card number as XXXX XXXX XXXX XXXX
   */
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);

    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumberFormatted(formatted);
    form.setFieldValue('cardNumber', value);
  };

  /**
   * Format expiry date as MM/YY
   */
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);

    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }

    e.target.value = value;
  };

  /**
   * Format CVV as 3-4 digits
   */
  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    e.target.value = value;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: any) => {
    try {
      const [month, year] = values.expiry.split('/');

      await onSubmit({
        cardCvv: values.cvv,
        cardExpiryMonth: month,
        cardExpiryYear: year,
        cardHolderName: values.cardholderName,
        cardNumber: values.cardNumber,
      });
    } catch (error) {
      console.error('Credit card form submission error:', error);
      message.error('Failed to process payment. Please try again.');
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Alert
        icon={<Lock size={16} />}
        message="Secure Payment"
        description="Your card information is encrypted and secure. We never store your full card number."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form.Item
        label="Cardholder Name"
        name="cardholderName"
        rules={[
          { required: true, message: 'Please enter cardholder name' },
          { min: 3, message: 'Name must be at least 3 characters' },
          { pattern: /^[a-zA-Z\s]+$/, message: 'Name can only contain letters and spaces' },
        ]}
      >
        <Input placeholder="John Doe" />
      </Form.Item>

      <Form.Item
        label="Card Number"
        name="cardNumber"
        rules={[
          { required: true, message: 'Please enter card number' },
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve();
              const digits = value.replace(/\D/g, '');
              if (digits.length !== 16) {
                return Promise.reject(new Error('Card number must be 16 digits'));
              }
              if (!validateLuhn(value)) {
                return Promise.reject(new Error('Invalid card number'));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Input
          placeholder="1234 5678 9012 3456"
          value={cardNumberFormatted}
          onChange={handleCardNumberChange}
          prefix={<CreditCard size={16} />}
          maxLength={19}
        />
      </Form.Item>

      <Space style={{ width: '100%' }} size="large">
        <Form.Item
          label="Expiry Date"
          name="expiry"
          rules={[
            { required: true, message: 'Please enter expiry date' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const [month, year] = value.split('/');

                if (!month || !year) {
                  return Promise.reject(new Error('Invalid expiry date format'));
                }

                const currentDate = new Date();
                const currentYear = currentDate.getFullYear() % 100;
                const currentMonth = currentDate.getMonth() + 1;

                const expiryYear = parseInt(year, 10);
                const expiryMonth = parseInt(month, 10);

                if (expiryMonth < 1 || expiryMonth > 12) {
                  return Promise.reject(new Error('Invalid month'));
                }

                if (expiryYear < currentYear) {
                  return Promise.reject(new Error('Card expired'));
                }

                if (expiryYear === currentYear && expiryMonth < currentMonth) {
                  return Promise.reject(new Error('Card expired'));
                }

                return Promise.resolve();
              },
            },
          ]}
          style={{ flex: 1 }}
        >
          <Input placeholder="MM/YY" onChange={handleExpiryChange} maxLength={5} />
        </Form.Item>

        <Form.Item
          label="CVV"
          name="cvv"
          rules={[
            { required: true, message: 'Please enter CVV' },
            { pattern: /^\d{3,4}$/, message: 'CVV must be 3-4 digits' },
          ]}
          style={{ flex: 1 }}
        >
          <Input placeholder="123" onChange={handleCVVChange} maxLength={4} />
        </Form.Item>
      </Space>

      <Form.Item style={{ marginTop: 24 }}>
        <Button
          block
          htmlType="submit"
          type="primary"
          size="large"
          loading={loading}
          icon={<Lock size={16} />}
        >
          {loading
            ? 'Processing...'
            : `Pay ${new Intl.NumberFormat('vi-VN', {
                currency: 'VND',
                style: 'currency',
              }).format(amount)}`}
        </Button>
      </Form.Item>
    </Form>
  );
}

