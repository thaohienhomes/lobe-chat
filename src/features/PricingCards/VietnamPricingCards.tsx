/**
 * Vietnam Pricing Cards Component
 * Displays VND pricing for Vietnamese users via Sepay
 *
 * Based on PRICING_MASTERPLAN.md.md
 */
'use client';

import { Badge, Button, Card, Divider, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Check } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { VN_PLANS } from '@/config/pricing';

/**
 * Vietnam Pricing Cards Component
 * Displays VND pricing for Vietnamese users via Sepay
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
  `,
  feature: css`
    display: flex;
    gap: 8px;
    align-items: center;

    font-size: 14px;
    color: ${token.colorTextSecondary};
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

interface VietnamPricingCardsProps {
  currentPlanId?: string;
  mobile?: boolean;
  onSelectPlan?: (planId: string) => void;
}

const VietnamPricingCards = memo<VietnamPricingCardsProps>(
  ({ mobile, onSelectPlan, currentPlanId }) => {
    const { styles, cx } = useStyles();

    // Order: Free, Basic, Pro (exclude Team for now)
    const plans = [
      { ...VN_PLANS.vn_free, id: 'vn_free', popular: false },
      { ...VN_PLANS.vn_basic, id: 'vn_basic', popular: true },
      { ...VN_PLANS.vn_pro, id: 'vn_pro', popular: false },
    ];

    return (
      <Flexbox gap={24} width="100%">
        <Flexbox align="center" gap={8} horizontal>
          <Title level={3} style={{ margin: 0 }}>
            Bảng Giá Phở Chat
          </Title>
          <Badge count="🇻🇳 Vietnam" style={{ backgroundColor: '#da251d' }} />
        </Flexbox>

        <div
          style={{
            display: 'grid',
            gap: mobile ? 16 : 24,
            gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          {plans.map((plan) => (
            <Card
              className={cx(styles.card, plan.popular && 'popular')}
              key={plan.id}
              style={{ padding: mobile ? 16 : 24 }}
            >
              {plan.popular && <div className={styles.popularBadge}>Phổ Biến Nhất</div>}

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
                      {plan.price === 0 ? 'Miễn Phí' : plan.price.toLocaleString('vi-VN')}
                    </span>
                    {plan.price > 0 && <span className={styles.priceUnit}> VND/tháng</span>}
                  </div>
                  {plan.priceYearly && (
                    <Text type="secondary">
                      Năm: {plan.priceYearly.toLocaleString('vi-VN')} VND (tiết kiệm 17%)
                    </Text>
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
                  type={plan.popular ? 'primary' : 'default'}
                >
                  {currentPlanId === plan.id
                    ? 'Gói Hiện Tại'
                    : plan.price === 0
                      ? 'Bắt Đầu Miễn Phí'
                      : 'Nâng Cấp Ngay'}
                </Button>
              </Flexbox>
            </Card>
          ))}
        </div>
      </Flexbox>
    );
  },
);

VietnamPricingCards.displayName = 'VietnamPricingCards';

export default VietnamPricingCards;
