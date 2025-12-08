'use client';

import { useUser } from '@clerk/nextjs';
import { Alert, Button, Card, Divider, Modal, Radio, Spin, Tag, Typography, message } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

const { Title, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  backButton: css`
    margin-block-end: ${token.marginMD}px;
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
    flex: 0 1 1000px;

    width: 100%;
    max-width: 1000px;
    margin-block: 0;
    margin-inline: auto;
    padding: ${token.paddingLG}px;

    @media (max-width: 768px) {
      padding: ${token.padding}px;
    }
  `,
  planCard: css`
    cursor: pointer;

    padding: ${token.paddingLG}px;
    border: 2px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;

    transition: all 0.3s ease;

    &:hover {
      border-color: ${token.colorPrimary};
      box-shadow: ${token.boxShadowSecondary};
    }

    &.selected {
      border-color: ${token.colorPrimary};
      background: ${token.colorPrimaryBg};
    }
  `,
}));

interface CurrentSubscription {
  billingCycle: 'monthly' | 'yearly';
  currentPeriodEnd: string;
  id: string;
  planId: 'starter' | 'premium' | 'ultimate';
}

/**
 * Plan interface based on PRICING_MASTERPLAN.md.md
 */
interface Plan {
  code: string;
  description: string;
  features: string[];
  id: 'vn_free' | 'vn_basic' | 'vn_pro' | 'starter' | 'premium' | 'ultimate';
  monthlyPoints: number;
  monthlyPrice: number;
  name: string;
  yearlyPrice: number;
}

/**
 * Vietnam Plans based on PRICING_MASTERPLAN.md.md
 * Uses Phở Points system with tiered model access
 */
const plans: Plan[] = [
  {
    code: 'vn_free',
    description: 'Trải nghiệm miễn phí với Tier 1 models',
    features: [
      'Tier 1 models only (GPT-4o-mini, Gemini Flash)',
      '50,000 Phở Points/month',
      'Không lưu lịch sử',
    ],
    id: 'vn_free',
    monthlyPoints: 50_000,
    monthlyPrice: 0,
    name: 'Phở Không Người Lái',
    yearlyPrice: 0,
  },
  {
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
    id: 'vn_basic',
    monthlyPoints: 300_000,
    monthlyPrice: 69_000,
    name: 'Phở Tái',
    yearlyPrice: 690_000,
  },
  {
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
    id: 'vn_pro',
    monthlyPoints: 2_000_000,
    monthlyPrice: 199_000,
    name: 'Phở Đặc Biệt',
    yearlyPrice: 1_990_000,
  },
];

export default function UpgradeClient() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { styles } = useStyles();

  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    daysRemaining: number;
    isDowngrade: boolean;
    isUpgrade: boolean;
    message: string;
    proratedAmount: number;
  } | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push('/');
      return;
    }

    // Fetch current subscription
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/subscription/current');
        if (response.ok) {
          const data = await response.json();
          setCurrentSubscription(data);
          setSelectedPlan(data.planId);
          setBillingCycle(data.billingCycle);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [isLoaded, user, router]);

  // Fetch preview when plan or billing cycle changes
  useEffect(() => {
    if (!selectedPlan || !currentSubscription) return;
    if (
      selectedPlan === currentSubscription.planId &&
      billingCycle === currentSubscription.billingCycle
    ) {
      setPreviewData(null);
      return;
    }

    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const response = await fetch('/api/subscription/preview-upgrade', {
          body: JSON.stringify({ billingCycle, newPlanId: selectedPlan }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        });
        if (response.ok) {
          const data = await response.json();
          setPreviewData(data);
        }
      } catch (error) {
        console.error('Failed to fetch preview:', error);
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchPreview();
  }, [selectedPlan, billingCycle, currentSubscription]);

  // Show confirmation modal before processing
  const handleConfirmClick = () => {
    if (!selectedPlan || selectedPlan === currentSubscription?.planId) return;
    setConfirmModalOpen(true);
  };

  // Process the actual upgrade/downgrade
  const handleUpgrade = async () => {
    if (!selectedPlan || !currentSubscription) return;

    setConfirmModalOpen(false);
    setProcessing(true);
    try {
      const response = await fetch('/api/subscription/upgrade', {
        body: JSON.stringify({
          billingCycle,
          newPlanId: selectedPlan,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        message.error(data.error || 'Failed to upgrade subscription');
        return;
      }

      // Check if payment is required (upgrade case)
      if (data.paymentRequired && data.paymentUrl) {
        message.info('Redirecting to payment...');
        // Redirect to Sepay payment page
        window.location.href = data.paymentUrl;
        return;
      }

      // No payment required (downgrade or plan change within same tier)
      message.success(data.message);
      setTimeout(() => {
        router.push('/subscription/manage');
      }, 1500);
    } catch (error) {
      message.error('Failed to process upgrade');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Spin size="large" tip="Loading subscription..." />
      </div>
    );
  }

  if (!currentSubscription) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Alert
            description="You don't have an active subscription. Please start with a plan."
            message="No Active Subscription"
            showIcon
            type="info"
          />
          <Button
            onClick={() => router.push('/subscription/checkout')}
            style={{ marginTop: 16 }}
            type="primary"
          >
            Choose a Plan
          </Button>
        </div>
      </div>
    );
  }

  const currentPlan = plans.find((p) => p.id === currentSubscription.planId);
  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Button
          className={styles.backButton}
          icon={<ArrowLeft size={20} />}
          onClick={() => router.back()}
          type="text"
        >
          Back
        </Button>

        <Title level={2}>Manage Your Subscription</Title>
        <Text type="secondary">
          Current plan: <strong>{currentPlan?.name}</strong> ({currentSubscription.billingCycle})
        </Text>

        <Divider />

        <Title level={4}>Select a Plan</Title>

        <Radio.Group
          onChange={(e) => setBillingCycle(e.target.value)}
          style={{ marginBottom: 24 }}
          value={billingCycle}
        >
          <Radio.Button value="monthly">Monthly</Radio.Button>
          <Radio.Button value="yearly">Yearly (17% off)</Radio.Button>
        </Radio.Group>

        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            marginBottom: 24,
          }}
        >
          {plans.map((plan) => (
            <Card
              className={`${styles.planCard} ${selectedPlan === plan.id ? 'selected' : ''}`}
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              style={{ cursor: 'pointer' }}
            >
              <Flexbox gap={12}>
                <div
                  style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}
                >
                  <Title level={4} style={{ margin: 0 }}>
                    {plan.name}
                  </Title>
                  {currentSubscription.planId === plan.id && <Tag color="blue">Current</Tag>}
                </div>

                <Text type="secondary">{plan.description}</Text>

                <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {(billingCycle === 'monthly'
                    ? plan.monthlyPrice
                    : plan.yearlyPrice
                  ).toLocaleString()}{' '}
                  VND
                  <span style={{ color: '#999', fontSize: 14, fontWeight: 'normal' }}>
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} style={{ fontSize: 12, marginBottom: 4 }}>
                      <Check
                        size={14}
                        style={{ color: '#52c41a', display: 'inline', marginRight: 4 }}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Flexbox>
            </Card>
          ))}
        </div>

        {selectedPlan && selectedPlan !== currentSubscription.planId && (
          <Card style={{ background: '#f0f5ff', marginBottom: 24 }}>
            <Title level={5}>Plan Change Summary</Title>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div>
                <Text type="secondary">Current Plan</Text>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>{currentPlan?.name}</div>
              </div>
              <div>
                <Text type="secondary">New Plan</Text>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>{selectedPlanData?.name}</div>
              </div>
              <div>
                <Text type="secondary">
                  {previewLoading
                    ? 'Calculating...'
                    : previewData?.isUpgrade
                      ? 'Upgrade Fee'
                      : previewData?.isDowngrade
                        ? 'Credit'
                        : 'Amount'}
                </Text>
                <div
                  style={{
                    color:
                      previewData?.proratedAmount && previewData.proratedAmount > 0
                        ? '#cf1322'
                        : '#389e0d',
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}
                >
                  {previewLoading
                    ? '...'
                    : previewData
                      ? previewData.proratedAmount > 0
                        ? `+${previewData.proratedAmount.toLocaleString()} VND`
                        : previewData.proratedAmount < 0
                          ? `${previewData.proratedAmount.toLocaleString()} VND (credit)`
                          : 'No charge'
                      : '...'}
                </div>
              </div>
            </div>
            {previewData && previewData.daysRemaining > 0 && (
              <div style={{ color: '#666', fontSize: 12, marginTop: 12 }}>
                {previewData.daysRemaining} days remaining in current billing period
              </div>
            )}
            {previewData?.isUpgrade && previewData.proratedAmount > 0 && (
              <Alert
                description={`You will be charged ${previewData.proratedAmount.toLocaleString()} VND for the upgrade.`}
                message="Payment Required"
                showIcon
                style={{ marginTop: 12 }}
                type="info"
              />
            )}
            {previewData?.isDowngrade && (
              <Alert
                description={`Your plan will be changed immediately. ${previewData.proratedAmount < 0 ? `Credit of ${Math.abs(previewData.proratedAmount).toLocaleString()} VND will be noted for your records.` : 'No credit applicable.'}`}
                message="Downgrade Notice"
                showIcon
                style={{ marginTop: 12 }}
                type="warning"
              />
            )}
          </Card>
        )}

        <Button
          disabled={!selectedPlan || selectedPlan === currentSubscription.planId || previewLoading}
          loading={processing}
          onClick={handleConfirmClick}
          size="large"
          style={{ width: '100%' }}
          type="primary"
        >
          {selectedPlan === currentSubscription.planId
            ? 'Already on this plan'
            : previewData?.isUpgrade
              ? `Upgrade to ${selectedPlanData?.name}`
              : previewData?.isDowngrade
                ? `Downgrade to ${selectedPlanData?.name}`
                : 'Confirm Plan Change'}
        </Button>

        {/* Confirmation Modal */}
        <Modal
          cancelText="Cancel"
          centered
          okButtonProps={{ danger: previewData?.isDowngrade, loading: processing }}
          okText={previewData?.isUpgrade ? 'Proceed to Payment' : 'Confirm Downgrade'}
          onCancel={() => setConfirmModalOpen(false)}
          onOk={handleUpgrade}
          open={confirmModalOpen}
          title={previewData?.isUpgrade ? '🚀 Confirm Upgrade' : '⚠️ Confirm Downgrade'}
        >
          <div style={{ padding: '16px 0' }}>
            <div
              style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}
            >
              <div>
                <Text type="secondary">Current Plan</Text>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>{currentPlan?.name}</div>
              </div>
              <div>
                <Text type="secondary">New Plan</Text>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>{selectedPlanData?.name}</div>
              </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {previewData?.isUpgrade && previewData.proratedAmount > 0 && (
              <Alert
                description={
                  <div>
                    <p style={{ margin: 0 }}>
                      You will be redirected to complete payment of{' '}
                      <strong>{previewData.proratedAmount.toLocaleString()} VND</strong>.
                    </p>
                    <p style={{ color: '#666', fontSize: 12, marginBottom: 0, marginTop: 8 }}>
                      Your new plan will be activated immediately after payment.
                    </p>
                  </div>
                }
                message="Payment Required"
                showIcon
                type="info"
              />
            )}

            {previewData?.isDowngrade && (
              <Alert
                description={
                  <div>
                    <p style={{ margin: 0 }}>
                      Your plan will be changed to <strong>{selectedPlanData?.name}</strong>{' '}
                      immediately.
                    </p>
                    {previewData.proratedAmount < 0 && (
                      <p style={{ color: '#666', fontSize: 12, marginBottom: 0, marginTop: 8 }}>
                        Credit of {Math.abs(previewData.proratedAmount).toLocaleString()} VND noted
                        for your records.
                      </p>
                    )}
                    <p style={{ color: '#fa8c16', fontSize: 12, marginBottom: 0, marginTop: 8 }}>
                      You will lose access to features not included in the new plan.
                    </p>
                  </div>
                }
                message="Downgrade Warning"
                showIcon
                type="warning"
              />
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
