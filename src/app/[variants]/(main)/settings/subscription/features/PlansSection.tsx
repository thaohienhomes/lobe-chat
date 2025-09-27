'use client';

import { Button } from '@lobehub/ui';
import { Badge, Card, Divider, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Check } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

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
      box-shadow: 0 8px 24px rgba(0, 0, 0, 12%);
    }
  `,

  popularBadge: css`
    position: absolute;
    z-index: 1;
    inset-block-start: -12px;
    inset-inline-start: 50%;
    transform: translateX(-50%);
  `,

  price: css`
    font-size: 32px;
    font-weight: 700;
    color: ${token.colorText};
  `,
}));

interface PlansSectionProps {
  mobile?: boolean;
}

const plans = [
  {
    computeCredits: '5,000,000 / Month',
    description: 'Suitable for users who occasionally use AI features',
    features: [
      'GPT-4o mini - Approx 7,000 messages',
      'DeepSeek R1 - Approx 1,900 messages',
      'See more models in the plan comparison',
      'Use file and knowledge base features in conversations',
      'File Storage - 1.0 GB',
      'Vector Storage - 5,000 entry ≈ 50MB',
      'Global mainstream model custom API services',
    ],
    id: 'starter',
    monthlyPrice: 9.9,
    name: 'Starter',
    yearlyDiscount: '23% off',
    yearlyPrice: 118.8,
  },
  {
    computeCredits: '15,000,000 / Month',
    description: 'Designed for professional users who frequently use AI features',
    features: [
      'GPT-4o mini - Approx 21,100 messages',
      'DeepSeek R1 - Approx 5,800 messages',
      'See more models in the plan comparison',
      'Use file and knowledge base features in conversations',
      'File Storage - 2.0 GB',
      'Vector Storage - 10,000 entry ≈ 100MB',
      'Global mainstream model custom API services',
    ],
    id: 'premium',
    monthlyPrice: 19.9,
    name: 'Premium',
    popular: true,
    yearlyDiscount: '20% off',
    yearlyPrice: 238.8,
  },
  {
    computeCredits: '35,000,000 / Month',
    description: 'For heavy users requiring extensive AI complex conversations',
    features: [
      'GPT-4o mini - Approx 49,100 messages',
      'DeepSeek R1 - Approx 13,400 messages',
      'See more models in the plan comparison',
      'Use file and knowledge base features in conversations',
      'File Storage - 4.0 GB',
      'Vector Storage - 20,000 entry ≈ 200MB',
      'Global mainstream model custom API services',
    ],
    id: 'ultimate',
    monthlyPrice: 39.9,
    name: 'Ultimate',
    yearlyDiscount: '20% off',
    yearlyPrice: 478.8,
  },
];

const handleUpgrade = (planId: string) => {
  // Navigate to payment flow
  window.location.href = `/subscription/checkout?plan=${planId}`;
};

const PlansSection = memo<PlansSectionProps>(({ mobile }) => {
  const { t } = useTranslation('setting');
  const { styles } = useStyles();

  return (
    <Flexbox gap={24}>
      <Flexbox align="center" gap={16} horizontal justify="center">
        <Title level={3} style={{ margin: 0 }}>
          {t('subscription.plans.title')}
        </Title>
        <Badge color="green" text="Maximum discount of 37%" />
      </Flexbox>

      <Flexbox
        gap={24}
        horizontal={!mobile}
        style={{
          flexWrap: mobile ? 'nowrap' : 'wrap',
          justifyContent: 'center',
        }}
      >
        {plans.map((plan) => (
          <Card
            className={`${styles.planCard} ${plan.popular ? 'popular' : ''}`}
            key={plan.id}
            style={{
              flex: mobile ? 'none' : '1',
              maxWidth: mobile ? '280px' : '350px',
              minWidth: mobile ? '280px' : '300px',
            }}
          >
            {plan.popular && (
              <Badge className={styles.popularBadge} color="gold" text="Most Popular" />
            )}

            <Flexbox gap={16} paddingBlock={plan.popular ? 24 : 16}>
              <Flexbox gap={8}>
                <Title level={4} style={{ margin: 0 }}>
                  {plan.name}
                </Title>
                <Text type="secondary">{plan.description}</Text>
              </Flexbox>

              <Flexbox gap={4}>
                <Flexbox align="baseline" gap={8} horizontal>
                  <span className={styles.price}>${plan.monthlyPrice}</span>
                  <Text type="secondary">/ Month (Yearly)</Text>
                </Flexbox>
                <Flexbox align="center" gap={8} horizontal>
                  <span className={styles.originalPrice}>${plan.yearlyPrice} / Year</span>
                  <span className={styles.discount}>{plan.yearlyDiscount}</span>
                </Flexbox>
              </Flexbox>

              <Button
                block
                onClick={() => handleUpgrade(plan.id)}
                size="large"
                type={plan.popular ? 'primary' : 'default'}
              >
                Upgrade
              </Button>

              <Divider style={{ margin: '8px 0' }} />

              <Flexbox gap={8}>
                <Text strong>Compute Credits</Text>
                <Text>{plan.computeCredits}</Text>
              </Flexbox>

              <Flexbox gap={8}>
                {plan.features.map((feature, index) => (
                  <div className={styles.feature} key={index}>
                    <Check size={16} />
                    <Text style={{ fontSize: '14px' }}>{feature}</Text>
                  </div>
                ))}
              </Flexbox>
            </Flexbox>
          </Card>
        ))}
      </Flexbox>
    </Flexbox>
  );
});

PlansSection.displayName = 'PlansSection';

export default PlansSection;
