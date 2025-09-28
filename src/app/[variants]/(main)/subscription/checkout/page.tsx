'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { 
  Button, 
  Card, 
  Divider, 
  Form, 
  Input, 
  Radio, 
  Typography, 
  message,
  Spin,
  Alert
} from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, CreditCard, Shield } from 'lucide-react';
import { Flexbox } from 'react-layout-kit';

const { Title, Text, Paragraph } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    min-height: 100vh;
    padding: ${token.paddingLG}px;
    background: ${token.colorBgLayout};
  `,
  content: css`
    max-width: 800px;
    margin: 0 auto;
  `,
  checkoutCard: css`
    margin-bottom: ${token.marginLG}px;
  `,
  planSummary: css`
    background: ${token.colorFillAlter};
    border-radius: ${token.borderRadius}px;
    padding: ${token.padding}px;
    margin-bottom: ${token.marginLG}px;
  `,
  priceRow: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${token.marginSM}px;
    
    &:last-child {
      margin-bottom: 0;
      font-weight: 600;
      font-size: 16px;
      border-top: 1px solid ${token.colorBorder};
      padding-top: ${token.marginSM}px;
    }
  `,
  securityNote: css`
    display: flex;
    align-items: center;
    gap: ${token.marginSM}px;
    color: ${token.colorTextSecondary};
    font-size: 12px;
    margin-top: ${token.marginLG}px;
  `,
}));

const plans = {
  starter: { name: 'Starter', monthlyPrice: 9.9, yearlyPrice: 118.8 },
  premium: { name: 'Premium', monthlyPrice: 19.9, yearlyPrice: 238.8 },
  ultimate: { name: 'Ultimate', monthlyPrice: 39.9, yearlyPrice: 478.8 },
};

export default function CheckoutPage() {
  const { styles } = useStyles();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const planId = searchParams.get('plan') as keyof typeof plans;
  const plan = plans[planId];

  useEffect(() => {
    if (!planId || !plan) {
      message.error('Invalid plan selected');
      router.push('/subscription/plans');
      return;
    }

    // Pre-fill form with user data
    if (user) {
      form.setFieldsValue({
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.fullName || '',
        phone: user.phoneNumbers[0]?.phoneNumber || '',
      });
    }
  }, [planId, plan, user, form, router]);

  const handleSubmit = async (values: any) => {
    if (!plan) return;

    setLoading(true);
    try {
      const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice * 12;
      const vndAmount = Math.round(price * 25000); // Convert USD to VND

      const response = await fetch('/api/payment/sepay/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingCycle,
          amount: vndAmount,
          currency: 'VND',
          customerInfo: {
            email: values.email,
            name: values.name,
            phone: values.phone,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        // Redirect to Sepay payment page
        window.location.href = data.paymentUrl;
      } else {
        message.error(data.message || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      message.error('Unable to process checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Flexbox align="center" justify="center" style={{ minHeight: '50vh' }}>
            <Spin size="large" />
          </Flexbox>
        </div>
      </div>
    );
  }

  if (!planId || !plan) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Alert
            message="Invalid Plan"
            description="The selected plan is not valid. Please choose a plan from our pricing page."
            type="error"
            action={
              <Button size="small" onClick={() => router.push('/subscription/plans')}>
                View Plans
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const currentPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice * 12;
  const monthlyEquivalent = billingCycle === 'yearly' ? plan.yearlyPrice / 12 : plan.monthlyPrice;
  const savings = billingCycle === 'yearly' ? (plan.monthlyPrice * 12) - plan.yearlyPrice : 0;
  const vndAmount = Math.round(currentPrice * 25000);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Flexbox gap={24}>
          <Flexbox align="center" gap={16} horizontal>
            <Button 
              icon={<ArrowLeft />} 
              onClick={() => router.back()}
              type="text"
            >
              Back
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              Complete Your Purchase
            </Title>
          </Flexbox>

          <Card className={styles.checkoutCard}>
            <div className={styles.planSummary}>
              <Title level={4}>Order Summary</Title>
              <div className={styles.priceRow}>
                <Text>{plan.name} Plan</Text>
                <Text>${currentPrice.toFixed(2)}</Text>
              </div>
              {savings > 0 && (
                <div className={styles.priceRow}>
                  <Text type="success">Yearly Discount</Text>
                  <Text type="success">-${savings.toFixed(2)}</Text>
                </div>
              )}
              <div className={styles.priceRow}>
                <Text strong>Total (USD)</Text>
                <Text strong>${currentPrice.toFixed(2)}</Text>
              </div>
              <div className={styles.priceRow}>
                <Text strong>Total (VND)</Text>
                <Text strong>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(vndAmount)}
                </Text>
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              size="large"
            >
              <Title level={4}>Billing Cycle</Title>
              <Form.Item name="billingCycle">
                <Radio.Group 
                  value={billingCycle} 
                  onChange={(e) => setBillingCycle(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Radio.Button value="yearly" style={{ width: '50%', textAlign: 'center' }}>
                    <div>
                      <div>Yearly</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        ${monthlyEquivalent.toFixed(2)}/month
                      </div>
                    </div>
                  </Radio.Button>
                  <Radio.Button value="monthly" style={{ width: '50%', textAlign: 'center' }}>
                    <div>
                      <div>Monthly</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        ${plan.monthlyPrice}/month
                      </div>
                    </div>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Divider />

              <Title level={4}>Contact Information</Title>
              
              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input placeholder="your@email.com" />
              </Form.Item>

              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Please enter your full name' }]}
              >
                <Input placeholder="Your full name" />
              </Form.Item>

              <Form.Item
                label="Phone Number (Optional)"
                name="phone"
              >
                <Input placeholder="+84 xxx xxx xxx" />
              </Form.Item>

              <Button
                block
                htmlType="submit"
                icon={<CreditCard />}
                loading={loading}
                size="large"
                type="primary"
              >
                {loading ? 'Processing...' : `Pay ${new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(vndAmount)}`}
              </Button>

              <div className={styles.securityNote}>
                <Shield size={16} />
                <Text>
                  Secure payment powered by Sepay. Your payment information is encrypted and secure.
                </Text>
              </div>
            </Form>
          </Card>
        </Flexbox>
      </div>
    </div>
  );
}
