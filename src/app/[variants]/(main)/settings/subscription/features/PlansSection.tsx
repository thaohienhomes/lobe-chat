'use client';

import { Button } from '@lobehub/ui';
import { Badge, Card, Divider, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { generateFeatureText, getTopModelsForPlan } from '@/utils/messageCalculator';
import { trackViewContent } from '@/utils/tiktok-events';
import { useTikTokTracking } from '@/hooks/useTikTokTracking';

const { Title, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  discount: css`
    font-size: 12px;
    font-weight: 600;
    color: ${token.colorSuccess};
  `,

  feature: css`
    display: flex;
    gap: 8px;
    align-items: center;
    margin-block-end: 8px;

    .anticon {
      flex-shrink: 0;
      color: ${token.colorSuccess};
    }
  `,

  originalPrice: css`
    font-size: 14px;
    color: ${token.colorTextSecondary};
    text-decoration: line-through;
  `,

  planCard: css`
    position: relative;
    border: 2px solid ${token.colorBorder};
    transition: all 0.3s ease;

    &:hover {
      border-color: ${token.colorPrimary};
      box-shadow: 0 8px 24px rgba(0, 0, 0, 12%);
    }

    &.popular {
      border-color: ${token.colorPrimary};
      box-shadow: 0 4px 16px rgba(0, 0, 0, 8%);
    }
  `,

  popularBadge: css`
    position: absolute;
    inset-block-start: -12px;
    inset-inline-start: 50%;
    transform: translateX(-50%);

    padding-block: 4px;
    padding-inline: 16px;
    border-radius: 12px;

    font-size: 12px;
    font-weight: 600;
    color: white;

    background: ${token.colorPrimary};
  `,

  price: css`
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
    color: ${token.colorText};
  `,

  priceUnit: css`
    font-size: 16px;
    font-weight: 400;
    color: ${token.colorTextSecondary};
  `,
}));

interface PlansSectionProps {
  mobile?: boolean;
}

// Generate dynamic plans with accurate message calculations
const generatePlanFeatures = (planId: 'starter' | 'premium' | 'ultimate') => {
  const { budgetModels, premiumModels } = getTopModelsForPlan(planId, 3, 3);

  const features = [
    // Budget Models Section
    '📱 Budget Models (High Volume):',
    ...budgetModels.slice(0, 3).map((model) => `• ${generateFeatureText(model)}`),
    '',
    // Premium Models Section
    '🚀 Premium Models (High Quality):',
    ...premiumModels.slice(0, 3).map((model) => `• ${generateFeatureText(model)}`),
    '',
    // Storage & Features
    '💾 Storage & Features:',
    planId === 'starter'
      ? '• File Storage - 1.0 GB'
      : planId === 'premium'
        ? '• File Storage - 2.0 GB'
        : '• File Storage - 4.0 GB',
    planId === 'starter'
      ? '• Vector Storage - 5,000 entries'
      : planId === 'premium'
        ? '• Vector Storage - 10,000 entries'
        : '• Vector Storage - 20,000 entries',
    '• Knowledge Base & File Upload',
    '• Mix & match models based on needs',
  ];

  return features;
};

const plans = [
  {
    computeCredits: '5,000,000 / Month',
    description: 'Perfect for occasional AI users and students',
    features: generatePlanFeatures('starter'),
    highlight: 'Most Popular for Students',
    id: 'starter',
    monthlyPriceVND: 39_000,
    name: 'Starter',
    yearlyDiscount: '17% off',
    yearlyPriceVND: 390_000,
  },
  {
    computeCredits: '15,000,000 / Month',
    description: 'Designed for professional users and content creators',
    features: generatePlanFeatures('premium'),
    highlight: 'Best Value for Professionals',
    id: 'premium',
    monthlyPriceVND: 129_000,
    name: 'Premium',
    popular: true,
    yearlyDiscount: '17% off',
    yearlyPriceVND: 1_290_000,
  },
  {
    computeCredits: '35,000,000 / Month',
    description: 'For enterprises, developers, and AI researchers',
    features: generatePlanFeatures('ultimate'),
    highlight: 'Maximum AI Power',
    id: 'ultimate',
    monthlyPriceVND: 349_000,
    name: 'Ultimate',
    yearlyDiscount: '17% off',
    yearlyPriceVND: 3_490_000,
  },
];

const PlansSection = memo<PlansSectionProps>(({ mobile }) => {
  const { t } = useTranslation('setting');
  const { styles } = useStyles();
  const router = useRouter();
  const { trackUpgradeClick } = useTikTokTracking();

  const handleUpgrade = (planId: string) => {
    // Find the plan details for tracking
    const plan = plans.find(p => p.id === planId);

    // Track ViewContent event for plan selection
    if (plan) {
      trackViewContent(planId, plan.name, plan.monthlyPriceVND);
      trackUpgradeClick(plan.name, 'Plans Section');
    }

    // Navigate to checkout page for better UX
    router.push(`/subscription/checkout?plan=${planId}`);
  };

  return (
    <Flexbox gap={24} width="100%">
      <Flexbox align="center" gap={8} horizontal>
        <Title level={3} style={{ margin: 0 }}>
          {t('subscription.plans.title', { ns: 'setting' })}
        </Title>
        <Badge count="New Pricing" style={{ backgroundColor: '#52c41a' }} />
      </Flexbox>

      <div
        style={{
          display: 'grid',
          gap: mobile ? 16 : 24,
          gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
        }}
      >
        {plans.map((plan) => (
          <Card
            className={`${styles.planCard} ${plan.popular ? 'popular' : ''}`}
            key={plan.id}
            style={{ padding: mobile ? 16 : 24 }}
          >
            {plan.popular && <div className={styles.popularBadge}>Most Popular</div>}

            <Flexbox gap={16}>
              {/* Plan Header */}
              <Flexbox gap={8}>
                <Title level={4} style={{ margin: 0 }}>
                  {plan.name}
                </Title>
                <Text type="secondary">{plan.description}</Text>
                {plan.highlight && (
                  <Badge count={plan.highlight} style={{ backgroundColor: '#1890ff' }} />
                )}
              </Flexbox>

              {/* Pricing */}
              <Flexbox gap={4}>
                <div>
                  <span className={styles.price}>{plan.monthlyPriceVND.toLocaleString()}</span>
                  <span className={styles.priceUnit}> VND/month</span>
                </div>
                <Text className={styles.discount}>
                  {plan.yearlyDiscount} • {plan.yearlyPriceVND.toLocaleString()} VND/year
                </Text>
              </Flexbox>

              <Divider style={{ margin: '8px 0' }} />

              {/* Compute Credits */}
              <Flexbox gap={4}>
                <Text strong>Compute Credits:</Text>
                <Text>{plan.computeCredits}</Text>
              </Flexbox>

              {/* Features */}
              <Flexbox gap={8}>
                {plan.features.map((feature, index) => {
                  // Handle section headers (without bullet points)
                  if (feature.includes(':') && !feature.startsWith('•')) {
                    return (
                      <Text key={index} strong style={{ marginTop: index > 0 ? 8 : 0 }}>
                        {feature}
                      </Text>
                    );
                  }

                  // Handle empty lines for spacing
                  if (feature === '') {
                    return <div key={index} style={{ height: 4 }} />;
                  }

                  // Handle feature items
                  return (
                    <div className={styles.feature} key={index}>
                      <Check size={16} />
                      <Text>{feature.replace('• ', '')}</Text>
                    </div>
                  );
                })}
              </Flexbox>

              {/* CTA Button */}
              <Button
                block
                onClick={() => handleUpgrade(plan.id)}
                size="large"
                style={{ marginTop: 16 }}
                type={plan.popular ? 'primary' : 'default'}
              >
                {plan.popular ? 'Choose Premium' : `Choose ${plan.name}`}
              </Button>
            </Flexbox>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <Flexbox gap={8} style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 12 }} type="secondary">
          💡 <strong>Mix & match models:</strong> Use budget models for simple tasks, premium models
          for complex work.
        </Text>
        <Text style={{ fontSize: 12 }} type="secondary">
          🔄 <strong>Flexible usage:</strong> Switch between models anytime based on your needs.
        </Text>
        <Text style={{ fontSize: 12 }} type="secondary">
          💰 <strong>73% cheaper</strong> than ChatGPT Plus and Claude Pro.
        </Text>
      </Flexbox>
    </Flexbox>
  );
});

PlansSection.displayName = 'PlansSection';

export default PlansSection;
