/**
 * Global Pricing Cards Component
 * Displays USD pricing for international users via Polar.sh
 *
 * Based on PRICING_MASTERPLAN.md.md
 */
'use client';

import { Button, Card, Divider, Typography } from 'antd';
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

const useStyles = createStyles(({ css, token, isDarkMode }) => ({
  card: css`
    position: relative;
    border-radius: 16px;
    transition: all 0.3s ease;
    border: 1px solid ${token.colorBorder};

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
      border-color: ${token.colorPrimary};
    }

    &.popular {
      border: 2px solid ${token.colorPrimary};
      background: ${isDarkMode ? token.colorFillQuaternary : token.colorBgContainer};
    }

    &.lifetime {
      border: 2px solid ${token.colorWarning};
      /* Dark gold/amber gradient that works in both modes but optimized for dark */
      background: ${isDarkMode
      ? `linear-gradient(135deg, ${token.colorWarningBg} 0%, ${token.colorBgContainer} 100%)`
      : `linear-gradient(135deg, ${token.colorWarningBgHover} 0%, #fff 100%)`
    };
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
    color: ${token.colorTextLightSolid};

    background: linear-gradient(135deg, ${token.colorWarning} 0%, ${token.colorWarningActive} 100%);
    box-shadow: 0 4px 10px rgba(250, 173, 20, 0.3);
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
    color: ${token.colorBgContainer};

    background: ${token.colorText};
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
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
        </Flexbox>

        <div
          style={{
            display: 'grid',
            gap: mobile ? 16 : 16, // Reduce gap slightly to help fit 4 columns
            // Use 220px minmax to help fit 4 cards on standard laptop screens (e.g. 1024px width)
            // 220 * 4 + 16 * 3 = 880 + 48 = 928px < 1024px.
            gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
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
                      {plan.price === 0 ? 'Free' : `$${plan.price.toFixed(2)}`}
                    </span>
                    <span className={styles.priceUnit}>
                      {plan.isLifetime ? ' one-time' : plan.price > 0 ? '/month' : ''}
                    </span>
                  </div>
                  {plan.priceYearly && (
                    <Text type="secondary">${plan.priceYearly.toFixed(2)}/year (save 17%)</Text>
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
