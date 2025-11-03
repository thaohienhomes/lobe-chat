'use client';

import { useUser } from '@clerk/nextjs';
import { Alert, Button, Card, Divider, Radio, Spin, Tag, Typography, message } from 'antd';
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
    border: 2px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingLG}px;
    cursor: pointer;
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
  id: string;
  planId: 'starter' | 'premium' | 'ultimate';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodEnd: string;
}

interface Plan {
  id: 'starter' | 'premium' | 'ultimate';
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for occasional AI users and students',
    monthlyPrice: 39_000,
    yearlyPrice: 390_000,
    features: [
      'Access to popular AI models',
      '5M compute credits per month',
      'Standard support',
      'Basic conversation features',
      'File upload (limited)',
      'Pre-built AI assistants',
      'No ads',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Designed for professional users and content creators',
    monthlyPrice: 129_000,
    yearlyPrice: 1_290_000,
    features: [
      'Access to all AI models',
      '15M compute credits per month',
      'Priority support response',
      'Advanced conversation features',
      'File upload and analysis',
      'Custom AI assistants',
      'Export conversation history',
      'No ads',
    ],
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    description: 'For enterprises, developers, and AI researchers',
    monthlyPrice: 349_000,
    yearlyPrice: 3_490_000,
    features: [
      'Access to all AI models including latest releases',
      '35M compute credits per month',
      'Priority support with dedicated channel',
      'Advanced API access',
      'Unlimited file uploads and analysis',
      'Custom AI assistants with fine-tuning',
      'Team collaboration features',
      'Advanced analytics and insights',
      'No ads',
    ],
  },
];

export default function UpgradeClient() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { styles } = useStyles();

  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'premium' | 'ultimate' | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [proratedAmount, setProratedAmount] = useState<number | null>(null);

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

  const handleUpgrade = async () => {
    if (!selectedPlan || !currentSubscription) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPlanId: selectedPlan,
          billingCycle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        message.error(data.error || 'Failed to upgrade subscription');
        return;
      }

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
            message="No Active Subscription"
            description="You don't have an active subscription. Please start with a plan."
            type="info"
            showIcon
          />
          <Button
            type="primary"
            style={{ marginTop: 16 }}
            onClick={() => router.push('/subscription/checkout')}
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
          type="text"
          icon={<ArrowLeft size={20} />}
          onClick={() => router.back()}
          className={styles.backButton}
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
          value={billingCycle}
          onChange={(e) => setBillingCycle(e.target.value)}
          style={{ marginBottom: 24 }}
        >
          <Radio.Button value="monthly">Monthly</Radio.Button>
          <Radio.Button value="yearly">Yearly (17% off)</Radio.Button>
        </Radio.Group>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`${styles.planCard} ${selectedPlan === plan.id ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
              style={{ cursor: 'pointer' }}
            >
              <Flexbox gap={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {plan.name}
                  </Title>
                  {currentSubscription.planId === plan.id && (
                    <Tag color="blue">Current</Tag>
                  )}
                </div>

                <Text type="secondary">{plan.description}</Text>

                <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice).toLocaleString()} VND
                  <span style={{ fontSize: 14, fontWeight: 'normal', color: '#999' }}>
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} style={{ marginBottom: 4, fontSize: 12 }}>
                      <Check size={14} style={{ display: 'inline', marginRight: 4, color: '#52c41a' }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Flexbox>
            </Card>
          ))}
        </div>

        {selectedPlan && selectedPlan !== currentSubscription.planId && (
          <Card style={{ marginBottom: 24, background: '#f0f5ff' }}>
            <Title level={5}>Plan Change Summary</Title>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <Text type="secondary">Current Plan</Text>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>{currentPlan?.name}</div>
              </div>
              <div>
                <Text type="secondary">New Plan</Text>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>{selectedPlanData?.name}</div>
              </div>
            </div>
          </Card>
        )}

        <Button
          type="primary"
          size="large"
          onClick={handleUpgrade}
          loading={processing}
          disabled={!selectedPlan || selectedPlan === currentSubscription.planId}
          style={{ width: '100%' }}
        >
          {selectedPlan === currentSubscription.planId ? 'Already on this plan' : 'Confirm Plan Change'}
        </Button>
      </div>
    </div>
  );
}

