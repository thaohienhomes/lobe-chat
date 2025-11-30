'use client';

import { useUser } from '@clerk/nextjs';
import { Alert, Button, Card, Divider, Form, Input, Radio, Spin, Typography, message } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, Check, CreditCard, Lock, Shield } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { trackAddPaymentInfo } from '@/utils/tiktok-events';

const { Title, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  backButton: css`
    margin-block-end: ${token.marginMD}px;
  `,
  checkoutCard: css`
    margin-block-end: ${token.marginLG}px;
    box-shadow: ${token.boxShadowTertiary};
  `,
  container: css`
    overflow: hidden auto;
    display: flex;
    align-items: flex-start;
    justify-content: center;

    width: 100%;
    height: 100%;

    background: ${token.colorBgLayout};
  `,
  content: css`
    flex: 0 1 1200px;

    width: 100%;
    max-width: 1200px;
    margin-block: 0;
    margin-inline: auto;
    padding: ${token.paddingLG}px;

    @media (max-width: 1200px) {
      padding: ${token.paddingLG}px;
    }

    @media (max-width: 768px) {
      padding: ${token.padding}px;
    }
  `,
  featureItem: css`
    display: flex;
    gap: ${token.marginSM}px;
    align-items: flex-start;

    padding-block: ${token.paddingSM}px;
    padding-inline: 0;

    svg {
      flex-shrink: 0;
      margin-block-start: 2px;
      color: ${token.colorSuccess};
    }
  `,
  header: css`
    margin-block-end: ${token.marginXL}px;
    text-align: center;

    @media (max-width: 768px) {
      margin-block-end: ${token.marginLG}px;
    }
  `,
  planFeatures: css`
    margin-block-start: ${token.marginLG}px;
    padding: ${token.paddingLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};
  `,
  planSummary: css`
    margin-block-end: ${token.marginLG}px;
    padding: ${token.paddingLG}px;
    border: 1px solid ${token.colorPrimaryBorder};
    border-radius: ${token.borderRadiusLG}px;

    background: linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 100%);
  `,
  priceRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: ${token.marginSM}px;

    &:last-child {
      margin-block: ${token.marginMD}px 0;
      padding-block-start: ${token.marginMD}px;
      border-block-start: 2px solid ${token.colorPrimary};

      font-size: 18px;
      font-weight: 600;
    }
  `,
  radioButtonGroup: css`
    display: flex;
    width: 100%;

    .ant-radio-button-wrapper {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;

      height: auto;
      min-height: 100px;
      padding: 12px !important;

      > div {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        width: 100%;
      }
    }
  `,
  savingsBadge: css`
    display: inline-block;

    margin-block-start: ${token.marginXS}px;
    padding-block: ${token.paddingXXS}px;
    padding-inline: ${token.paddingSM}px;
    border-radius: ${token.borderRadiusSM}px;

    font-size: 12px;
    font-weight: 600;
    color: ${token.colorSuccess};

    background: ${token.colorSuccessBg};
  `,
  securityNote: css`
    display: flex;
    gap: ${token.marginSM}px;
    align-items: center;

    margin-block-start: ${token.marginLG}px;
    padding: ${token.paddingMD}px;
    border-radius: ${token.borderRadius}px;

    font-size: 13px;
    color: ${token.colorTextSecondary};

    background: ${token.colorInfoBg};
  `,
  twoColumnLayout: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${token.marginXL}px;
    align-items: flex-start;

    @media (max-width: 968px) {
      grid-template-columns: 1fr;
      gap: ${token.marginLG}px;
    }
  `,
}));

// Updated pricing (2025-01-08): Aligned with new subscription tiers
const plans = {
  premium: {
    computeCredits: '15,000,000 / Month',
    description: 'Designed for professional users and content creators',
    features: [
      'Access to all AI models (GPT-4, Claude, Gemini, etc.)',
      '15M compute credits per month',
      'Priority support response',
      'Advanced conversation features',
      'File upload and analysis',
      'Custom AI assistants',
      'Export conversation history',
      'No ads',
    ],
    monthlyPriceVND: 129_000,
    name: 'Premium',
    yearlyPriceVND: 1_290_000,
  },
  starter: {
    computeCredits: '5,000,000 / Month',
    description: 'Perfect for occasional AI users and students',
    features: [
      'Access to popular AI models',
      '5M compute credits per month',
      'Standard support',
      'Basic conversation features',
      'File upload (limited)',
      'Pre-built AI assistants',
      'No ads',
    ],
    monthlyPriceVND: 39_000,
    name: 'Starter',
    yearlyPriceVND: 390_000,
  },
  ultimate: {
    computeCredits: '35,000,000 / Month',
    description: 'For enterprises, developers, and AI researchers',
    features: [
      'Access to all AI models including latest releases',
      '35M compute credits per month',
      'Priority support with dedicated channel',
      'Advanced API access',
      'Unlimited file uploads and analysis',
      'Custom AI assistants with fine-tuning',
      'Team collaboration features',
      'Advanced analytics and insights',
      'Export and backup options',
      'No ads',
    ],
    monthlyPriceVND: 349_000,
    name: 'Ultimate',
    yearlyPriceVND: 3_490_000,
  },
};

function CheckoutContent() {
  const { styles } = useStyles();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'credit_card'>(
    'bank_transfer',
  );

  // Normalize planId to lowercase to handle case-insensitive URLs
  const planIdRaw = searchParams.get('plan');
  const planId = planIdRaw?.toLowerCase() as keyof typeof plans;
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

  const handleBankTransferSubmit = async (values: any) => {
    if (!plan) return;
    setLoading(true);
    try {
      const vndAmount = billingCycle === 'yearly' ? plan.yearlyPriceVND : plan.monthlyPriceVND;

      // Track AddPaymentInfo event
      trackAddPaymentInfo(planId, plan.name);

      console.log('🏦 Bank Transfer: Creating payment...', { billingCycle, planId, vndAmount });

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

      console.log('🏦 Bank Transfer Response:', data);

      if (data.success && data.paymentUrl) {
        console.log('✅ Redirecting to payment waiting page:', data.paymentUrl);
        window.location.href = data.paymentUrl;
      } else {
        console.error('❌ Bank transfer failed:', data);
        message.error(data.message || 'Failed to create payment');
      }
    } catch (error) {
      console.error('❌ Bank transfer error:', error);
      message.error('Unable to process checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreditCardSubmit = async () => {
    if (!plan) return;

    // Validate form before proceeding
    try {
      await form.validateFields(['email', 'name']);
    } catch {
      message.error('Vui lòng điền đầy đủ thông tin liên hệ');
      return;
    }

    setLoading(true);
    try {
      // Track AddPaymentInfo event
      trackAddPaymentInfo(planId, plan.name);

      console.log('💳 Credit Card: Creating Polar.sh checkout session...', {
        billingCycle,
        planId,
      });

      // Get form values for customer info
      const values = form.getFieldsValue();

      // Route credit card payments to Polar.sh (international payment gateway)
      const response = await fetch('/api/payment/polar/create', {
        body: JSON.stringify({
          billingCycle,
          customerEmail: values.email || user?.emailAddresses?.[0]?.emailAddress,
          customerName: values.name || user?.fullName,
          planId,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      const data = await response.json();

      console.log('💳 Polar.sh Checkout Response:', data);

      if (data.success && data.checkoutUrl) {
        console.log('✅ Redirecting to Polar.sh checkout:', data.checkoutUrl);
        // Redirect to Polar.sh hosted checkout page
        window.location.href = data.checkoutUrl;
      } else {
        console.error('❌ Polar.sh checkout creation failed:', data);
        message.error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('❌ Credit card payment error:', error);
      message.error('Unable to process credit card payment. Please try again.');
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
  const monthlyEquivalentVND =
    billingCycle === 'yearly' ? plan.yearlyPriceVND / 12 : plan.monthlyPriceVND;
  const savingsVND =
    billingCycle === 'yearly' ? plan.monthlyPriceVND * 12 - plan.yearlyPriceVND : 0;
  const vndAmount = currentPriceVND;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Flexbox gap={32}>
          {/* Header */}
          <div className={styles.header}>
            <Button
              className={styles.backButton}
              icon={<ArrowLeft />}
              onClick={() => router.back()}
              type="text"
            >
              Back
            </Button>
            <Title level={1} style={{ margin: 0, marginBlockEnd: 8 }}>
              Hoàn tất Thanh toán
            </Title>
            <Text type="secondary">Chọn chu kỳ thanh toán và hoàn tất đơn hàng của bạn</Text>
          </div>

          {/* Two Column Layout */}
          <div className={styles.twoColumnLayout}>
            {/* Left Column - Plan Summary & Features */}
            <Flexbox gap={24}>
              {/* Plan Summary */}
              <div className={styles.planSummary}>
                <Flexbox gap={16}>
                  <div>
                    <Title level={3} style={{ margin: 0, marginBlockEnd: 4 }}>
                      {plan.name} Plan
                    </Title>
                    <Text type="secondary">{plan.description}</Text>
                  </div>

                  <div className={styles.priceRow}>
                    <Text>Giá gói</Text>
                    <Text>
                      {new Intl.NumberFormat('vi-VN', {
                        currency: 'VND',
                        maximumFractionDigits: 0,
                        minimumFractionDigits: 0,
                        style: 'currency',
                      }).format(currentPriceVND)}
                    </Text>
                  </div>

                  {savingsVND > 0 && (
                    <>
                      <div className={styles.priceRow}>
                        <Text type="success">Giảm giá hàng năm</Text>
                        <Text type="success">
                          -
                          {new Intl.NumberFormat('vi-VN', {
                            currency: 'VND',
                            maximumFractionDigits: 0,
                            minimumFractionDigits: 0,
                            style: 'currency',
                          }).format(savingsVND)}
                        </Text>
                      </div>
                      <div className={styles.savingsBadge}>
                        🎉 Tiết kiệm {Math.round((savingsVND / (plan.monthlyPriceVND * 12)) * 100)}%
                        khi thanh toán hàng năm
                      </div>
                    </>
                  )}

                  <div className={styles.priceRow}>
                    <Text strong>Tổng cộng</Text>
                    <Text strong>
                      {new Intl.NumberFormat('vi-VN', {
                        currency: 'VND',
                        maximumFractionDigits: 0,
                        minimumFractionDigits: 0,
                        style: 'currency',
                      }).format(vndAmount)}
                    </Text>
                  </div>
                </Flexbox>
              </div>

              {/* Plan Features */}
              <div className={styles.planFeatures}>
                <Title level={4} style={{ marginBlockEnd: 16 }}>
                  Tính năng bao gồm
                </Title>
                <Flexbox gap={8}>
                  {plan.features.map((feature, index) => (
                    <div className={styles.featureItem} key={index}>
                      <Check size={20} />
                      <Text>{feature}</Text>
                    </div>
                  ))}
                </Flexbox>
              </div>
            </Flexbox>

            {/* Right Column - Checkout Form */}
            <Card className={styles.checkoutCard}>
              <Form
                form={form}
                layout="vertical"
                onFinish={paymentMethod === 'bank_transfer' ? handleBankTransferSubmit : undefined}
                size="large"
              >
                <Flexbox gap={24}>
                  {/* Billing Cycle */}
                  <div>
                    <Title level={4} style={{ marginBlockEnd: 12 }}>
                      Chu kỳ thanh toán
                    </Title>
                    <Form.Item name="billingCycle" style={{ marginBlockEnd: 0 }}>
                      <Radio.Group
                        className={styles.radioButtonGroup}
                        onChange={(e) => setBillingCycle(e.target.value)}
                        value={billingCycle}
                      >
                        <Radio.Button value="yearly">
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 500, marginBlockEnd: 8 }}>
                              Hàng năm
                            </div>
                            <div style={{ color: '#52c41a', fontSize: 13, marginBlockEnd: 4 }}>
                              {new Intl.NumberFormat('vi-VN', {
                                currency: 'VND',
                                maximumFractionDigits: 0,
                                minimumFractionDigits: 0,
                                style: 'currency',
                              }).format(monthlyEquivalentVND)}
                              /tháng
                            </div>
                            <div style={{ color: '#52c41a', fontSize: 12, fontWeight: 500 }}>
                              ✨ Tiết kiệm 17%
                            </div>
                          </div>
                        </Radio.Button>
                        <Radio.Button value="monthly">
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 500, marginBlockEnd: 8 }}>
                              Hàng tháng
                            </div>
                            <div style={{ color: '#666', fontSize: 13, marginBlockEnd: 4 }}>
                              {new Intl.NumberFormat('vi-VN', {
                                currency: 'VND',
                                maximumFractionDigits: 0,
                                minimumFractionDigits: 0,
                                style: 'currency',
                              }).format(plan.monthlyPriceVND)}
                              /tháng
                            </div>
                            <div style={{ color: '#999', fontSize: 12 }}>Linh hoạt</div>
                          </div>
                        </Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                  </div>

                  <Divider style={{ margin: 0 }} />

                  {/* Contact Information */}
                  <div>
                    <Title level={4} style={{ marginBlockEnd: 16 }}>
                      Thông tin liên hệ
                    </Title>

                    <Form.Item
                      label="Địa chỉ Email"
                      name="email"
                      rules={[
                        { message: 'Vui lòng nhập email', required: true },
                        { message: 'Email không hợp lệ', type: 'email' },
                      ]}
                    >
                      <Input placeholder="your@email.com" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="Họ và tên"
                      name="name"
                      rules={[{ message: 'Vui lòng nhập họ tên', required: true }]}
                    >
                      <Input placeholder="Nguyễn Văn A" size="large" />
                    </Form.Item>

                    <Form.Item label="Số điện thoại (Tùy chọn)" name="phone">
                      <Input placeholder="+84 xxx xxx xxx" size="large" />
                    </Form.Item>
                  </div>

                  <Divider style={{ margin: 0 }} />

                  {/* Payment Method */}
                  <div>
                    <Title level={4} style={{ marginBlockEnd: 12 }}>
                      Phương thức thanh toán
                    </Title>
                    <Form.Item style={{ marginBlockEnd: 16 }}>
                      <Radio.Group
                        className={styles.radioButtonGroup}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        value={paymentMethod}
                      >
                        <Radio.Button value="bank_transfer">
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 500, marginBlockEnd: 8 }}>
                              Chuyển khoản
                            </div>
                            <div style={{ color: '#666', fontSize: 12 }}>QR Code</div>
                          </div>
                        </Radio.Button>
                        <Radio.Button value="credit_card">
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 500, marginBlockEnd: 8 }}>
                              Thẻ tín dụng
                            </div>
                            <div style={{ color: '#666', fontSize: 12 }}>Visa/Mastercard</div>
                          </div>
                        </Radio.Button>
                      </Radio.Group>
                    </Form.Item>

                    {paymentMethod === 'bank_transfer' ? (
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
                              style: 'currency',
                            }).format(vndAmount)}`}
                      </Button>
                    ) : (
                      <div>
                        <Alert
                          description="Bạn sẽ được chuyển hướng đến trang thanh toán an toàn của Polar.sh để hoàn tất giao dịch."
                          message="Thanh toán quốc tế qua Polar.sh"
                          showIcon
                          style={{ marginBlockEnd: 16 }}
                          type="info"
                        />
                        <Button
                          block
                          icon={<Lock size={16} />}
                          loading={loading}
                          onClick={handleCreditCardSubmit}
                          size="large"
                          type="primary"
                        >
                          {loading ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Security Note */}
                  <div className={styles.securityNote}>
                    <Shield size={16} />
                    <Text>
                      {paymentMethod === 'bank_transfer'
                        ? 'Thanh toán an toàn được hỗ trợ bởi Sepay. Thông tin thanh toán của bạn được mã hóa và bảo mật.'
                        : 'Secure payment powered by Polar.sh. Your payment information is encrypted and protected.'}
                    </Text>
                  </div>
                </Flexbox>
              </Form>
            </Card>
          </div>
        </Flexbox>
      </div>
    </div>
  );
}

export default function CheckoutClient() {
  return <CheckoutContent />;
}
