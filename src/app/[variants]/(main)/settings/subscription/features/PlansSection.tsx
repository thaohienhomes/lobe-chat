'use client';

import { Button } from '@lobehub/ui';
import { Badge, Card, Divider, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useTikTokTracking } from '@/hooks/useTikTokTracking';
import { trackServerInitiateCheckout, trackServerViewContent } from '@/utils/tiktok-server-events';

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

    color: ${token.colorText};

    background: ${token.colorBgContainer};

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
    color: ${token.colorTextDescription};
  `,
}));

interface PlansSectionProps {
  mobile?: boolean;
}

/**
 * Generate plan features based on PRICING_MASTERPLAN.md.md
 * Uses Phở Points system with tiered model access
 */
const generatePlanFeatures = (planId: 'vn_free' | 'vn_basic' | 'vn_pro') => {
  const features: string[] = [];

  switch (planId) {
  case 'vn_free': {
    features.push(
      '🆓 Tier 1 Models Only:',
      '• GPT-4o-mini, Gemini Flash, Claude Haiku',
      '• 50,000 Phở Points/tháng',
      '',
      '⚠️ Giới hạn:',
      '• Không lưu lịch sử hội thoại',
      '• Không truy cập Tier 2/3 models',
    );
  
  break;
  }
  case 'vn_basic': {
    features.push(
      '🚀 Tier 1 Models (Unlimited):',
      '• GPT-4o-mini, Gemini Flash, Claude Haiku',
      '',
      '⭐ Tier 2 Models (30 msg/ngày):',
      '• GPT-4o, Claude Sonnet, Gemini Pro',
      '',
      '💎 300,000 Phở Points/tháng',
      '💾 Lưu trữ lịch sử hội thoại',
      '📁 Upload file',
    );
  
  break;
  }
  case 'vn_pro': {
    features.push(
      '🚀 Tier 1 & 2 Models (Unlimited):',
      '• GPT-4o-mini, Gemini Flash, Claude Haiku',
      '• GPT-4o, Claude Sonnet, Gemini Pro',
      '',
      '👑 Tier 3 Models (50 msg/ngày):',
      '• Claude Opus, GPT-4 Turbo, O1',
      '',
      '💎 2,000,000 Phở Points/tháng',
      '🎯 Priority support',
      '🔧 Advanced features',
    );
  
  break;
  }
  // No default
  }

  return features;
};

/**
 * Vietnam Plans based on PRICING_MASTERPLAN.md.md
 */
const plans = [
  {
    code: 'vn_free',
    description: 'Trải nghiệm miễn phí với Tier 1 models',
    features: generatePlanFeatures('vn_free'),
    highlight: 'Miễn phí trọn đời',
    id: 'vn_free',
    monthlyPoints: 50_000,
    monthlyPriceVND: 0,
    name: 'Phở Không Người Lái',
    yearlyDiscount: '',
    yearlyPriceVND: 0,
  },
  {
    code: 'vn_basic',
    description: 'Dành cho sinh viên và người dùng cá nhân',
    features: generatePlanFeatures('vn_basic'),
    highlight: 'Phổ biến nhất',
    id: 'vn_basic',
    monthlyPoints: 300_000,
    monthlyPriceVND: 69_000,
    name: 'Phở Tái',
    popular: true,
    yearlyDiscount: 'Tặng 2 tháng',
    yearlyPriceVND: 690_000,
  },
  {
    code: 'vn_pro',
    description: 'Cho người dùng chuyên nghiệp và doanh nghiệp',
    features: generatePlanFeatures('vn_pro'),
    highlight: 'Sức mạnh tối đa',
    id: 'vn_pro',
    monthlyPoints: 2_000_000,
    monthlyPriceVND: 199_000,
    name: 'Phở Đặc Biệt',
    yearlyDiscount: 'Tặng 2 tháng',
    yearlyPriceVND: 1_990_000,
  },
];

const PlansSection = memo<PlansSectionProps>(({ mobile }) => {
  const { t } = useTranslation('setting');
  const { styles, theme: token } = useStyles();
  const router = useRouter();
  const { trackUpgradeClick } = useTikTokTracking();

  const handleUpgrade = async (planId: string) => {
    // Find the plan details for tracking
    const plan = plans.find((p) => p.id === planId);

    // Track ViewContent and InitiateCheckout events for plan selection
    // Using server-side tracking for better reliability (bypasses ad blockers)
    if (plan) {
      console.log('🎯 Tracking plan selection:', { planId, planName: plan.name });

      // Track both ViewContent and InitiateCheckout events
      await Promise.all([
        trackServerViewContent(planId, plan.name, plan.monthlyPriceVND),
        trackServerInitiateCheckout(planId, plan.name, plan.monthlyPriceVND),
      ]).catch((error) => {
        console.error('Failed to track TikTok events:', error);
      });

      // Also track with client-side hook for redundancy
      trackUpgradeClick(plan.name, 'Plans Section');
    }

    // Navigate to checkout page for better UX
    router.push(`/subscription/checkout?plan=${planId}`);
  };

  return (
    <Flexbox gap={24} width="100%">
      <Flexbox align="center" gap={8} horizontal>
        <Title level={3} style={{ color: token.colorText, margin: 0 }}>
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
            variant="borderless"
          >
            {plan.popular && <div className={styles.popularBadge}>Most Popular</div>}

            <Flexbox gap={16}>
              {/* Plan Header */}
              <Flexbox gap={8}>
                <Title level={4} style={{ color: token.colorText, margin: 0 }}>
                  {plan.name}
                </Title>
                <Text style={{ color: token.colorTextDescription }}>{plan.description}</Text>
                {plan.highlight && (
                  <Badge count={plan.highlight} style={{ backgroundColor: '#1890ff' }} />
                )}
              </Flexbox>

              {/* Pricing */}
              <Flexbox gap={4}>
                <div>
                  <span className={styles.price} style={{ color: token.colorText }}>
                    {plan.monthlyPriceVND.toLocaleString()}
                  </span>
                  <span className={styles.priceUnit}> VND/month</span>
                </div>
                <Text className={styles.discount}>
                  {plan.yearlyDiscount} • {plan.yearlyPriceVND.toLocaleString()} VND/year
                </Text>
              </Flexbox>

              <Divider style={{ margin: '8px 0' }} />

              {/* Phở Points */}
              <Flexbox gap={4}>
                <Text strong style={{ color: token.colorText }}>
                  Phở Points:
                </Text>
                <Text style={{ color: token.colorText }}>
                  {plan.monthlyPoints.toLocaleString()} / tháng
                </Text>
              </Flexbox>

              {/* Features */}
              <Flexbox gap={8}>
                {plan.features.map((feature, index) => {
                  // Handle section headers (without bullet points)
                  if (feature.includes(':') && !feature.startsWith('•')) {
                    return (
                      <Text
                        key={index}
                        strong
                        style={{ color: token.colorText, marginTop: index > 0 ? 8 : 0 }}
                      >
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
                      <Text style={{ color: token.colorText }}>{feature.replace('• ', '')}</Text>
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
        <Text style={{ color: token.colorTextDescription, fontSize: 12 }}>
          💡 <strong>Mix & match models:</strong> Use budget models for simple tasks, premium models
          for complex work.
        </Text>
        <Text style={{ color: token.colorTextDescription, fontSize: 12 }}>
          🔄 <strong>Flexible usage:</strong> Switch between models anytime based on your needs.
        </Text>
        <Text style={{ color: token.colorTextDescription, fontSize: 12 }}>
          💰 <strong>73% cheaper</strong> than ChatGPT Plus and Claude Pro.
        </Text>
      </Flexbox>
    </Flexbox>
  );
});

PlansSection.displayName = 'PlansSection';

export default PlansSection;
