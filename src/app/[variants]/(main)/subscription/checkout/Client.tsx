'use client';

import { useUser } from '@clerk/nextjs';
import { Alert, Button, Card, Divider, Form, Input, Radio, Spin, Typography, message } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, CreditCard, Shield } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

const { Title, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  checkoutCard: css`
    margin-block-end: ${token.marginLG}px;
  `,
  container: css`
    min-height: 100vh;
    padding: ${token.paddingLG}px;
    background: ${token.colorBgLayout};
  `,
  content: css`
    max-width: 800px;
    margin-block: 0;
    margin-inline: auto;
  `,
  planSummary: css`
    margin-block-end: ${token.marginLG}px;
    padding: ${token.padding}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorFillAlter};
  `,
  priceRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: ${token.marginSM}px;

    &:last-child {
      margin-block-end: 0;
      padding-block-start: ${token.marginSM}px;
      border-block-start: 1px solid ${token.colorBorder};

      font-size: 16px;
      font-weight: 600;
    }
  `,
  securityNote: css`
    display: flex;
    gap: ${token.marginSM}px;
    align-items: center;

    margin-block-start: ${token.marginLG}px;

    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
}));

const plans = {
  premium: { monthlyPriceVND: 99_000, name: 'Premium', yearlyPriceVND: 990_000 },
  starter: { monthlyPriceVND: 29_000, name: 'Starter', yearlyPriceVND: 290_000 },
  ultimate: { monthlyPriceVND: 289_000, name: 'Ultimate', yearlyPriceVND: 2_890_000 },
};

function CheckoutContent() {
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
      // Use direct VND amounts based on plan pricing
      const vndAmount = billingCycle === 'yearly' ? plan.yearlyPriceVND : plan.monthlyPriceVND;

      const response = await fetch('/api/payment/sepay/create', {
        body: JSON.stringify({
          amount: vndAmount,
          billingCycle,
          currency: 'VND',
          customerInfo: { email: values.email, name: values.name, phone: values.phone },
          planId,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
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
            action={
              <Button onClick={() => router.push('/subscription/plans')} size="small">
                View Plans
              </Button>
            }
            description="The selected plan is not valid. Please choose a plan from our pricing page."
            message="Invalid Plan"
            type="error"
          />
        </div>
      </div>
    );
  }

  const currentPriceVND = billingCycle === 'yearly' ? plan.yearlyPriceVND : plan.monthlyPriceVND;
  const monthlyEquivalentVND = billingCycle === 'yearly' ? plan.yearlyPriceVND / 12 : plan.monthlyPriceVND;
  const savingsVND = billingCycle === 'yearly' ? plan.monthlyPriceVND * 12 - plan.yearlyPriceVND : 0;
  const vndAmount = currentPriceVND;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Flexbox gap={24}>
          <Flexbox align="center" gap={16} horizontal>
            <Button icon={<ArrowLeft />} onClick={() => router.back()} type="text">
              Back
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              Hoàn tất Thanh toán
            </Title>
          </Flexbox>

          <Card className={styles.checkoutCard}>
            <div className={styles.planSummary}>
              <Title level={4}>Tóm tắt Đơn hàng</Title>
              <div className={styles.priceRow}>
                <Text>{plan.name} Plan</Text>
                <Text>
                  {new Intl.NumberFormat('vi-VN', {
                    currency: 'VND',
                    maximumFractionDigits: 0,
                    minimumFractionDigits: 0,
                    style: 'currency'
                  }).format(currentPriceVND)}
                </Text>
              </div>
              {savingsVND > 0 && (
                <div className={styles.priceRow}>
                  <Text type="success">Giảm giá hàng năm</Text>
                  <Text type="success">
                    -{new Intl.NumberFormat('vi-VN', {
                      currency: 'VND',
                      maximumFractionDigits: 0,
                      minimumFractionDigits: 0,
                      style: 'currency'
                    }).format(savingsVND)}
                  </Text>
                </div>
              )}
              <div className={styles.priceRow}>
                <Text strong>Tổng cộng</Text>
                <Text strong>
                  {new Intl.NumberFormat('vi-VN', {
                    currency: 'VND',
                    maximumFractionDigits: 0,
                    minimumFractionDigits: 0,
                    style: 'currency'
                  }).format(vndAmount)}
                </Text>
              </div>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
              <Title level={4}>Billing Cycle</Title>
              <Form.Item name="billingCycle">
                <Radio.Group
                  onChange={(e) => setBillingCycle(e.target.value)}
                  style={{ width: '100%' }}
                  value={billingCycle}
                >
                  <Radio.Button style={{ textAlign: 'center', width: '50%' }} value="yearly">
                    <div>
                      <div>Hàng năm</div>
                      <div style={{ color: '#666', fontSize: 12 }}>
                        {new Intl.NumberFormat('vi-VN', {
                          currency: 'VND',
                          maximumFractionDigits: 0,
                          minimumFractionDigits: 0,
                          style: 'currency'
                        }).format(monthlyEquivalentVND)}/tháng
                      </div>
                    </div>
                  </Radio.Button>
                  <Radio.Button style={{ textAlign: 'center', width: '50%' }} value="monthly">
                    <div>
                      <div>Hàng tháng</div>
                      <div style={{ color: '#666', fontSize: 12 }}>
                        {new Intl.NumberFormat('vi-VN', {
                          currency: 'VND',
                          maximumFractionDigits: 0,
                          minimumFractionDigits: 0,
                          style: 'currency'
                        }).format(plan.monthlyPriceVND)}/tháng
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
                  { message: 'Please enter your email', required: true },
                  { message: 'Please enter a valid email', type: 'email' },
                ]}
              >
                <Input placeholder="your@email.com" />
              </Form.Item>

              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ message: 'Please enter your full name', required: true }]}
              >
                <Input placeholder="Your full name" />
              </Form.Item>

              <Form.Item label="Phone Number (Optional)" name="phone">
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
                {loading
                  ? 'Đang xử lý...'
                  : `Thanh toán ${new Intl.NumberFormat('vi-VN', {
                      currency: 'VND',
                      maximumFractionDigits: 0,
                      minimumFractionDigits: 0,
                      style: 'currency'
                    }).format(vndAmount)}`}
              </Button>

              <div className={styles.securityNote}>
                <Shield size={16} />
                <Text>
                  Thanh toán an toàn được hỗ trợ bởi Sepay. Thông tin thanh toán của bạn được mã hóa và bảo mật.
                </Text>
              </div>
            </Form>
          </Card>
        </Flexbox>
      </div>
    </div>
  );
}

export default function CheckoutClient() {
  return <CheckoutContent />;
}
