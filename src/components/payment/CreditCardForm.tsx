'use client';

import { Alert, Button, Form, Input, Space, message } from 'antd';
import { CreditCard, Lock } from 'lucide-react';
import React, { useState } from 'react';

interface CreditCardFormProps {
  amount: number;
  loading?: boolean;
  onSubmit: (cardData: CreditCardFormData) => Promise<void>;
}

export interface CreditCardFormData {
  cardCvv: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardHolderName: string;
  cardNumber: string;
}

/**
 * Luhn Algorithm - Validates credit card numbers
 */
function validateLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replaceAll(/\D/g, '');
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
}

/**
 * Format expiry date as MM/YY
 */
function handleExpiryChange(e: React.ChangeEvent<HTMLInputElement>): void {
  let value = e.target.value.replaceAll(/\D/g, '');
  if (value.length > 4) value = value.slice(0, 4);

  if (value.length >= 2) {
    value = value.slice(0, 2) + '/' + value.slice(2);
  }

  e.target.value = value;
}

/**
 * Format CVV as 3-4 digits
 */
function handleCVVChange(e: React.ChangeEvent<HTMLInputElement>): void {
  let value = e.target.value.replaceAll(/\D/g, '');
  if (value.length > 4) value = value.slice(0, 4);
  e.target.value = value;
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
   * Format card number as XXXX XXXX XXXX XXXX
   */
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replaceAll(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);

    const formatted = value.replaceAll(/(\d{4})/g, '$1 ').trim();
    setCardNumberFormatted(formatted);
    form.setFieldValue('cardNumber', value);
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
        description="Your card information is encrypted and secure. We never store your full card number."
        icon={<Lock size={16} />}
        message="Secure Payment"
        showIcon
        style={{ marginBottom: 16 }}
        type="info"
      />

      <Form.Item
        label="Cardholder Name"
        name="cardholderName"
        rules={[
          { message: 'Please enter cardholder name', required: true },
          { message: 'Name must be at least 3 characters', min: 3 },
          { message: 'Name can only contain letters and spaces', pattern: /^[\sA-Za-z]+$/ },
        ]}
      >
        <Input placeholder="John Doe" />
      </Form.Item>

      <Form.Item
        label="Card Number"
        name="cardNumber"
        rules={[
          { message: 'Please enter card number', required: true },
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve();
              const digits = value.replaceAll(/\D/g, '');
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
          maxLength={19}
          onChange={handleCardNumberChange}
          placeholder="1234 5678 9012 3456"
          prefix={<CreditCard size={16} />}
          value={cardNumberFormatted}
        />
      </Form.Item>

      <Space size="large" style={{ width: '100%' }}>
        <Form.Item
          label="Expiry Date"
          name="expiry"
          rules={[
            { message: 'Please enter expiry date', required: true },
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
          <Input maxLength={5} onChange={handleExpiryChange} placeholder="MM/YY" />
        </Form.Item>

        <Form.Item
          label="CVV"
          name="cvv"
          rules={[
            { message: 'Please enter CVV', required: true },
            { message: 'CVV must be 3-4 digits', pattern: /^\d{3,4}$/ },
          ]}
          style={{ flex: 1 }}
        >
          <Input maxLength={4} onChange={handleCVVChange} placeholder="123" />
        </Form.Item>
      </Space>

      <Form.Item style={{ marginTop: 24 }}>
        <Button
          block
          htmlType="submit"
          icon={<Lock size={16} />}
          loading={loading}
          size="large"
          type="primary"
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
