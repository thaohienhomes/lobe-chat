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

interface Plan {
  description: string;
  features: string[];
  id: 'starter' | 'premium' | 'ultimate';
  monthlyPrice: number;
  name: string;
  yearlyPrice: number;
}

const plans: Plan[] = [
  {
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
    id: 'starter',
    monthlyPrice: 39_000,
    name: 'Starter',
    yearlyPrice: 390_000,
  },
  {
    description: 'Designed for professional users and content creators',
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
    id: 'premium',
    monthlyPrice: 129_000,
    name: 'Premium',
    yearlyPrice: 1_290_000,
  },
  {
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
      'No ads',
    ],
    id: 'ultimate',
    monthlyPrice: 349_000,
    name: 'Ultimate',
    yearlyPrice: 3_490_000,
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
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
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
          disabled={!selectedPlan || selectedPlan === currentSubscription.planId}
          loading={processing}
          onClick={handleUpgrade}
          size="large"
          style={{ width: '100%' }}
          type="primary"
        >
          {selectedPlan === currentSubscription.planId
            ? 'Already on this plan'
            : 'Confirm Plan Change'}
        </Button>
      </div>
    </div>
  );
}
