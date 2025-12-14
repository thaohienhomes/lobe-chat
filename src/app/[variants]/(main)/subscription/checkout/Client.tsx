'use client';

import { useUser } from '@clerk/nextjs';
import { Alert, Button, Card, Divider, Form, Input, Radio, Spin, Typography, message } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, Check, CreditCard, Lock, Shield } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import ConfettiCelebration from '@/components/ConfettiCelebration';
import { usePricingGeo } from '@/hooks/usePricingGeo';
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

/**
 * Vietnam Plans based on PRICING_MASTERPLAN.md.md
 * Uses Phở Points system with tiered model access
 */
const plans = {
  gl_lifetime: {
    code: 'gl_lifetime',
    description: 'One-time payment, lifetime access',
    features: [
      'All Premium features forever',
      '500,000 Phở Points/month (reset monthly)',
      'Priority support',
      'Early access to new features',
      'No recurring payments',
    ],
    monthlyPoints: 500_000,
    monthlyPriceUSD: 149.99, // Match Polar Dashboard
    monthlyPriceVND: 0,
    name: 'Lifetime Deal',
    yearlyPriceUSD: 149.99, // Match Polar Dashboard
    yearlyPriceVND: 0, // One-time payment
  },

  gl_premium: {
    code: 'gl_premium',
    description: 'For power users and professionals',
    features: [
      'Unlimited Tier 1 & 2 models',
      '50 Tier 3 messages/day',
      '2,000,000 Phở Points/month',
      'Priority support',
      'Advanced features',
    ],
    monthlyPoints: 2_000_000,
    monthlyPriceUSD: 19.99, // Match Polar Dashboard
    monthlyPriceVND: 0,
    name: 'Premium',
    yearlyPriceUSD: 199.99, // Match Polar Dashboard
    yearlyPriceVND: 0,
  },

  // ============================================================================
  // GLOBAL PLANS (USD) - For international users via Polar.sh
  // ============================================================================
  gl_standard: {
    code: 'gl_standard',
    description: 'For individual users and students',
    features: [
      'Unlimited Tier 1 models',
      '30 Tier 2 messages/day',
      '500,000 Phở Points/month',
      'Chat history',
      'File uploads',
      'No ads',
    ],
    monthlyPoints: 500_000,
    monthlyPriceUSD: 9.99, // Match Polar Dashboard
    monthlyPriceVND: 0,
    name: 'Standard',
    yearlyPriceUSD: 99.99, // Match Polar Dashboard
    yearlyPriceVND: 0,
  },

  // Legacy mappings (for backward compatibility with existing URLs)
  premium: {
    code: 'vn_basic',
    description: 'Dành cho sinh viên và người dùng cá nhân',
    features: [
      'Unlimited Tier 1 models',
      '30 Tier 2 messages/day',
      '300,000 Phở Points/month',
      'Lưu trữ lịch sử hội thoại',
      'Upload file',
      'Không quảng cáo',
    ],
    monthlyPoints: 300_000,
    monthlyPriceVND: 69_000,
    name: 'Phở Tái',
    yearlyPriceVND: 690_000,
  },

  starter: {
    code: 'vn_free',
    description: 'Trải nghiệm miễn phí',
    features: ['Tier 1 models only', '50,000 Phở Points/month'],
    monthlyPoints: 50_000,
    monthlyPriceVND: 0,
    name: 'Phở Không Người Lái',
    yearlyPriceVND: 0,
  },

  ultimate: {
    code: 'vn_pro',
    description: 'Cho người dùng chuyên nghiệp',
    features: [
      'Unlimited Tier 1 & 2 models',
      '50 Tier 3 messages/day',
      '2,000,000 Phở Points/month',
      'Priority support',
    ],
    monthlyPoints: 2_000_000,
    monthlyPriceVND: 199_000,
    name: 'Phở Đặc Biệt',
    yearlyPriceVND: 1_990_000,
  },

  // Basic tier (Student) - vn_basic
  vn_basic: {
    code: 'vn_basic',
    description: 'Dành cho sinh viên và người dùng cá nhân',
    features: [
      'Unlimited Tier 1 models (GPT-4o-mini, Gemini Flash)',
      '30 Tier 2 messages/day (GPT-4o, Claude Sonnet)',
      '300,000 Phở Points/month',
      'Lưu trữ lịch sử hội thoại',
      'Upload file',
      'Không quảng cáo',
    ],
    monthlyPoints: 300_000,
    monthlyPriceVND: 69_000,
    name: 'Phở Tái',
    yearlyPriceVND: 690_000,
  },

  // Free tier - vn_free (for reference, not purchasable)
  vn_free: {
    code: 'vn_free',
    description: 'Trải nghiệm miễn phí với Tier 1 models',
    features: [
      'Tier 1 models only (GPT-4o-mini, Gemini Flash)',
      '50,000 Phở Points/month',
      'Không lưu lịch sử',
    ],
    monthlyPoints: 50_000,
    monthlyPriceVND: 0,
    name: 'Phở Không Người Lái',
    yearlyPriceVND: 0,
  },
  // Pro tier - vn_pro
  vn_pro: {
    code: 'vn_pro',
    description: 'Cho người dùng chuyên nghiệp và doanh nghiệp',
    features: [
      'Unlimited Tier 1 & 2 models',
      '50 Tier 3 messages/day (Claude Opus, GPT-4 Turbo)',
      '2,000,000 Phở Points/month',
      'Priority support',
      'Advanced features',
      'Team collaboration',
      'Export & backup',
      'Không quảng cáo',
    ],
    monthlyPoints: 2_000_000,
    monthlyPriceUSD: 9.9,
    monthlyPriceVND: 199_000,
    name: 'Phở Đặc Biệt',
    yearlyPriceUSD: 99,
    yearlyPriceVND: 1_990_000,
  },
};

// Format price based on currency type - moved to outer scope for ESLint
const formatPrice = (amount: number, isUSD: boolean) => {
  if (isUSD) {
    return new Intl.NumberFormat('en-US', {
      currency: 'USD',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
      style: 'currency',
    }).format(amount);
  }
  return new Intl.NumberFormat('vi-VN', {
    currency: 'VND',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: 'currency',
  }).format(amount);
};

function CheckoutContent() {
  const { styles } = useStyles();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  usePricingGeo(); // Hook called for potential future use
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [showConfetti, setShowConfetti] = useState(false);

  // Confetti completion handler - redirect after animation
  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  // Normalize planId to lowercase to handle case-insensitive URLs
  const planIdRaw = searchParams.get('plan');
  const planId = planIdRaw?.toLowerCase() as keyof typeof plans;
  const plan = plans[planId];

  // Check if payment was successful (from Sepay callback or Polar redirect)
  const paymentSuccess = searchParams.get('success') === 'true';
  const activated = searchParams.get('activated') === 'true';

  // 🎉 Show confetti when returning from successful payment
  useEffect(() => {
    if (paymentSuccess || activated) {
      setShowConfetti(true);
      // Redirect to subscription page after showing confetti
      const timer = setTimeout(() => {
        router.push('/settings?active=subscription&activated=true');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, activated, router]);

  // Determine if this is a global plan (gl_*) or Vietnam plan (vn_*)
  const isGlobalPlan = planId?.startsWith('gl_');
  const isVietnamPlan =
    planId?.startsWith('vn_') || ['starter', 'premium', 'ultimate'].includes(planId);

  // Determine if this is a FREE plan (no payment needed)
  const FREE_PLAN_IDS = ['vn_free', 'gl_starter', 'starter'];
  const isFreePlan = FREE_PLAN_IDS.includes(planId);

  // Auto-select payment method based on plan type and region
  // Global plans MUST use Polar (credit_card)
  // Vietnam plans MUST use Sepay (bank_transfer)
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'credit_card'>(
    isGlobalPlan ? 'credit_card' : 'bank_transfer',
  );

  // Update payment method when plan type is determined
  useEffect(() => {
    if (isGlobalPlan) {
      setPaymentMethod('credit_card');
    } else if (isVietnamPlan) {
      setPaymentMethod('bank_transfer');
    }
  }, [isGlobalPlan, isVietnamPlan]);

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

  // Handler for FREE plan activation (no payment needed)
  const handleFreePlanActivation = async () => {
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
      const values = form.getFieldsValue();

      console.log('🆓 Activating FREE plan:', { planId });

      const response = await fetch('/api/subscription/activate-free', {
        body: JSON.stringify({
          customerEmail: values.email || user?.emailAddresses?.[0]?.emailAddress,
          customerName: values.name || user?.fullName,
          planId,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      const data = await response.json();

      console.log('🆓 Free Plan Activation Response:', data);

      if (data.success) {
        message.success(data.message || 'Gói miễn phí đã được kích hoạt!');
        // 🎉 Show confetti celebration animation
        setShowConfetti(true);
        // Redirect after a short delay to show confetti
        setTimeout(() => {
          router.push(data.redirectUrl || '/settings?active=subscription&activated=true');
        }, 2000);
      } else {
        console.error('❌ Free plan activation failed:', data);
        message.error(data.message || 'Không thể kích hoạt gói miễn phí');
      }
    } catch (error) {
      console.error('❌ Free plan activation error:', error);
      message.error('Đã xảy ra lỗi. Vui lòng thử lại.');
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

  // Calculate prices based on plan type (VND for Vietnam, USD for Global)
  const planWithUSD = plan as typeof plan & { monthlyPriceUSD?: number; yearlyPriceUSD?: number };
  const isLifetimePlan = planId === 'gl_lifetime';

  // For Global plans, use USD pricing
  const currentPriceUSD = isLifetimePlan
    ? planWithUSD.monthlyPriceUSD || 149 // Lifetime is one-time
    : billingCycle === 'yearly'
      ? planWithUSD.yearlyPriceUSD || 0
      : planWithUSD.monthlyPriceUSD || 0;

  // For Vietnam plans, use VND pricing
  const currentPriceVND = billingCycle === 'yearly' ? plan.yearlyPriceVND : plan.monthlyPriceVND;
  const monthlyEquivalentVND =
    billingCycle === 'yearly' ? plan.yearlyPriceVND / 12 : plan.monthlyPriceVND;
  const savingsVND =
    billingCycle === 'yearly' ? plan.monthlyPriceVND * 12 - plan.yearlyPriceVND : 0;
  const vndAmount = currentPriceVND;

  // Display price based on plan type
  const displayPrice = isGlobalPlan
    ? formatPrice(currentPriceUSD, true)
    : formatPrice(currentPriceVND, false);

  return (
    <>
      {/* 🎉 Confetti celebration animation */}
      <ConfettiCelebration
        duration={3000}
        onComplete={handleConfettiComplete}
        show={showConfetti}
      />

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
                      {isGlobalPlan && (
                        <Text style={{ display: 'block', marginTop: 4 }} type="secondary">
                          🌍 International Plan (USD)
                        </Text>
                      )}
                    </div>

                    <div className={styles.priceRow}>
                      <Text>{isGlobalPlan ? 'Price' : 'Giá gói'}</Text>
                      <Text>{displayPrice}</Text>
                    </div>

                    {/* Show savings for yearly billing (Vietnam plans only) */}
                    {!isGlobalPlan && savingsVND > 0 && (
                      <>
                        <div className={styles.priceRow}>
                          <Text type="success">Giảm giá hàng năm</Text>
                          <Text type="success">-{formatPrice(savingsVND, false)}</Text>
                        </div>
                        <div className={styles.savingsBadge}>
                          🎉 Tiết kiệm{' '}
                          {Math.round((savingsVND / (plan.monthlyPriceVND * 12)) * 100)}% khi thanh
                          toán hàng năm
                        </div>
                      </>
                    )}

                    {/* Show lifetime badge for lifetime plan */}
                    {isLifetimePlan && (
                      <div className={styles.savingsBadge}>
                        ⭐ One-time payment, lifetime access!
                      </div>
                    )}

                    <div className={styles.priceRow}>
                      <Text strong>{isGlobalPlan ? 'Total' : 'Tổng cộng'}</Text>
                      <Text strong>{displayPrice}</Text>
                    </div>
                  </Flexbox>
                </div>

                {/* Plan Features */}
                <div className={styles.planFeatures}>
                  <Title level={4} style={{ marginBlockEnd: 16 }}>
                    {isGlobalPlan ? 'Features Included' : 'Tính năng bao gồm'}
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
                  onFinish={
                    paymentMethod === 'bank_transfer' ? handleBankTransferSubmit : undefined
                  }
                  size="large"
                >
                  <Flexbox gap={24}>
                    {/* Billing Cycle - Hide for lifetime plans */}
                    {!isLifetimePlan && (
                      <>
                        <div>
                          <Title level={4} style={{ marginBlockEnd: 12 }}>
                            {isGlobalPlan ? 'Billing Cycle' : 'Chu kỳ thanh toán'}
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
                                    {isGlobalPlan ? 'Yearly' : 'Hàng năm'}
                                  </div>
                                  <div
                                    style={{ color: '#52c41a', fontSize: 13, marginBlockEnd: 4 }}
                                  >
                                    {isGlobalPlan
                                      ? `$${(planWithUSD.yearlyPriceUSD || 0) / 12}/mo`
                                      : `${formatPrice(monthlyEquivalentVND, false)}/tháng`}
                                  </div>
                                  <div style={{ color: '#52c41a', fontSize: 12, fontWeight: 500 }}>
                                    ✨ {isGlobalPlan ? 'Save 17%' : 'Tiết kiệm 17%'}
                                  </div>
                                </div>
                              </Radio.Button>
                              <Radio.Button value="monthly">
                                <div>
                                  <div style={{ fontSize: 16, fontWeight: 500, marginBlockEnd: 8 }}>
                                    {isGlobalPlan ? 'Monthly' : 'Hàng tháng'}
                                  </div>
                                  <div style={{ color: '#666', fontSize: 13, marginBlockEnd: 4 }}>
                                    {isGlobalPlan
                                      ? `$${planWithUSD.monthlyPriceUSD || 0}/mo`
                                      : `${formatPrice(plan.monthlyPriceVND, false)}/tháng`}
                                  </div>
                                  <div style={{ color: '#999', fontSize: 12 }}>
                                    {isGlobalPlan ? 'Flexible' : 'Linh hoạt'}
                                  </div>
                                </div>
                              </Radio.Button>
                            </Radio.Group>
                          </Form.Item>
                        </div>

                        <Divider style={{ margin: 0 }} />
                      </>
                    )}

                    {/* Lifetime plan notice */}
                    {isLifetimePlan && (
                      <>
                        <Alert
                          description="This is a one-time payment for lifetime access. No recurring charges."
                          message="⭐ Lifetime Deal"
                          showIcon
                          type="success"
                        />
                        <Divider style={{ margin: 0 }} />
                      </>
                    )}

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

                    {/* Payment Method - Hide for free plans */}
                    <div>
                      {!isFreePlan && (
                        <Title level={4} style={{ marginBlockEnd: 12 }}>
                          {isGlobalPlan ? 'Payment Method' : 'Phương thức thanh toán'}
                        </Title>
                      )}

                      {/* Show payment method selection only for PAID Vietnam plans */}
                      {!isGlobalPlan && !isFreePlan && (
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
                      )}

                      {/* FREE PLANS: Show activate button (no payment needed) */}
                      {isFreePlan && (
                        <div>
                          <Alert
                            description={
                              isGlobalPlan
                                ? 'This is a free plan. No payment required - just activate!'
                                : 'Đây là gói miễn phí. Không cần thanh toán - chỉ cần kích hoạt!'
                            }
                            message={isGlobalPlan ? '🆓 Free Plan' : '🆓 Gói Miễn Phí'}
                            showIcon
                            style={{ marginBlockEnd: 16 }}
                            type="success"
                          />
                          <Button
                            block
                            icon={<Check size={16} />}
                            loading={loading}
                            onClick={handleFreePlanActivation}
                            size="large"
                            style={{ background: '#52c41a', borderColor: '#52c41a' }}
                            type="primary"
                          >
                            {loading
                              ? isGlobalPlan
                                ? 'Activating...'
                                : 'Đang kích hoạt...'
                              : isGlobalPlan
                                ? 'Activate Free Plan'
                                : 'Kích hoạt gói miễn phí'}
                          </Button>
                        </div>
                      )}

                      {/* Global PAID plans: Always use Polar (credit card) */}
                      {isGlobalPlan && !isFreePlan && (
                        <div>
                          <Alert
                            description="You will be redirected to Polar.sh secure checkout to complete your payment."
                            message="Secure International Payment via Polar.sh"
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
                            {loading ? 'Processing...' : `Pay ${displayPrice}`}
                          </Button>
                        </div>
                      )}

                      {/* Vietnam PAID plans: Show selected payment method */}
                      {!isGlobalPlan && !isFreePlan && paymentMethod === 'bank_transfer' && (
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
                            : `Thanh toán ${formatPrice(vndAmount, false)}`}
                        </Button>
                      )}

                      {!isGlobalPlan && !isFreePlan && paymentMethod === 'credit_card' && (
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
                        {isGlobalPlan
                          ? 'Secure payment powered by Polar.sh. Your payment information is encrypted and protected.'
                          : paymentMethod === 'bank_transfer'
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
    </>
  );
}

export default function CheckoutClient() {
  return <CheckoutContent />;
}
