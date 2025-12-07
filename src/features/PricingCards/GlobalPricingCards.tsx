/**
 * Global Pricing Cards Component
 * Displays USD pricing for international users via Polar.sh
 *
 * Based on PRICING_MASTERPLAN.md.md
 */
'use client';

import { Badge, Button, Card, Divider, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Check, Sparkles } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { GLOBAL_PLANS } from '@/config/pricing';

/**
 * Global Pricing Cards Component
 * Displays USD pricing for international users via Polar.sh
 *
 * Based on PRICING_MASTERPLAN.md.md
 */

const { Title, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    position: relative;
    border-radius: 16px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 10%);
    }

    &.popular {
      border: 2px solid ${token.colorPrimary};
    }

    &.lifetime {
      border: 2px solid #faad14;
      background: linear-gradient(135deg, #fffbe6 0%, #fff 100%);
    }
  `,
  feature: css`
    display: flex;
    gap: 8px;
    align-items: center;

    font-size: 14px;
    color: ${token.colorTextSecondary};
  `,
  lifetimeBadge: css`
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

    background: linear-gradient(135deg, #faad14 0%, #fa8c16 100%);
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
    color: ${token.colorText};
  `,
  priceUnit: css`
    font-size: 14px;
    color: ${token.colorTextSecondary};
  `,
}));

interface GlobalPricingCardsProps {
  currentPlanId?: string;
  mobile?: boolean;
  onSelectPlan?: (planId: string) => void;
}

const GlobalPricingCards = memo<GlobalPricingCardsProps>(
  ({ mobile, onSelectPlan, currentPlanId }) => {
    const { styles, cx } = useStyles();

    // Order: Starter, Standard, Premium, Lifetime
    const plans = [
      { ...GLOBAL_PLANS.gl_starter, id: 'gl_starter', isLifetime: false, popular: false },
      { ...GLOBAL_PLANS.gl_standard, id: 'gl_standard', isLifetime: false, popular: true },
      { ...GLOBAL_PLANS.gl_premium, id: 'gl_premium', isLifetime: false, popular: false },
      { ...GLOBAL_PLANS.gl_lifetime, id: 'gl_lifetime', isLifetime: true, popular: false },
    ];

    return (
      <Flexbox gap={24} width="100%">
        <Flexbox align="center" gap={8} horizontal>
          <Title level={3} style={{ margin: 0 }}>
            Pricing Plans
          </Title>
          <Badge count="🌍 Global" style={{ backgroundColor: '#1890ff' }} />
        </Flexbox>

        <div
          style={{
            display: 'grid',
            gap: mobile ? 16 : 24,
            gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          {plans.map((plan) => (
            <Card
              className={cx(styles.card, plan.popular && 'popular', plan.isLifetime && 'lifetime')}
              key={plan.id}
              style={{ padding: mobile ? 16 : 24 }}
            >
              {plan.popular && <div className={styles.popularBadge}>Most Popular</div>}
              {plan.isLifetime && (
                <div className={styles.lifetimeBadge}>
                  <Sparkles size={12} style={{ marginRight: 4 }} />
                  Limited Offer
                </div>
              )}

              <Flexbox gap={16}>
                <Flexbox gap={8}>
                  <Title level={4} style={{ margin: 0 }}>
                    {plan.displayName}
                  </Title>
                  <Text type="secondary">{plan.keyLimits}</Text>
                </Flexbox>

                <Flexbox gap={4}>
                  <div>
                    <span className={styles.price}>
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    </span>
                    <span className={styles.priceUnit}>
                      {plan.isLifetime ? ' one-time' : plan.price > 0 ? '/month' : ''}
                    </span>
                  </div>
                  {plan.priceYearly && (
                    <Text type="secondary">${plan.priceYearly}/year (save 17%)</Text>
                  )}
                </Flexbox>

                <Divider style={{ margin: '8px 0' }} />

                <Flexbox gap={8}>
                  {plan.features.map((feature, idx) => (
                    <div className={styles.feature} key={idx}>
                      <Check size={16} style={{ color: '#52c41a' }} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </Flexbox>

                <Button
                  block
                  disabled={currentPlanId === plan.id}
                  onClick={() => onSelectPlan?.(plan.id)}
                  size="large"
                  type={plan.popular || plan.isLifetime ? 'primary' : 'default'}
                >
                  {currentPlanId === plan.id
                    ? 'Current Plan'
                    : plan.price === 0
                      ? 'Get Started'
                      : plan.isLifetime
                        ? 'Get Lifetime Access'
                        : 'Upgrade Now'}
                </Button>
              </Flexbox>
            </Card>
          ))}
        </div>
      </Flexbox>
    );
  },
);

GlobalPricingCards.displayName = 'GlobalPricingCards';

export default GlobalPricingCards;
