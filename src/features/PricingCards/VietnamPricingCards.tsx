/**
 * Vietnam Pricing Cards Component
 * Tab-based layout: Monthly (3 cards) | Yearly (4 cards + Medical Beta)
 *
 * Based on PRICING_MASTERPLAN.md
 */
'use client';

import { Button, Card, Divider, Segmented, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Check } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { VN_PLANS } from '@/config/pricing';

const { Title, Text } = Typography;

// Plan hierarchy for button state logic
const PLAN_RANK: Record<string, number> = {
  free: 0,
  gl_starter: 0,
  medical_beta: 2,
  vn_basic: 1,
  vn_free: 0,
  vn_premium: 2,
  vn_pro: 3,
  vn_ultimate: 4,
};

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    position: relative;
    border: 1px solid ${token.colorBorder};
    border-radius: 16px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      border-color: ${token.colorPrimary};
      box-shadow: 0 12px 24px rgba(0, 0, 0, 10%);
    }

    &.popular {
      border: 2px solid ${token.colorPrimary};
    }

    &.medical {
      border: 2px solid #06b6d4;
    }
  `,
  currentPlanBadge: css`
    position: absolute;
    inset-block-start: -12px;
    inset-inline-start: 50%;
    transform: translateX(-50%);

    padding-block: 4px;
    padding-inline: 16px;
    border-radius: 12px;

    font-size: 12px;
    font-weight: 600;
    color: #fff;

    background: #52c41a;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 10%);
  `,
  feature: css`
    display: flex;
    gap: 8px;
    align-items: flex-start;

    font-size: 13px;
    line-height: 1.4;
    color: ${token.colorTextSecondary};
  `,
  medicalBadge: css`
    position: absolute;
    inset-block-start: -12px;
    inset-inline-start: 50%;
    transform: translateX(-50%);

    padding-block: 4px;
    padding-inline: 16px;
    border-radius: 12px;

    font-size: 12px;
    font-weight: 600;
    color: #fff;

    background: #06b6d4;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 10%);
  `,
  monthlyEquiv: css`
    font-size: 13px;
    color: ${token.colorTextTertiary};
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
    box-shadow: 0 4px 10px rgba(0, 0, 0, 10%);
  `,
  price: css`
    font-size: 28px;
    font-weight: 700;
    color: ${token.colorText};
  `,
  priceUnit: css`
    font-size: 13px;
    color: ${token.colorTextSecondary};
  `,
  savingsBadge: css`
    display: inline-block;

    padding-block: 2px;
    padding-inline: 8px;
    border-radius: 8px;

    font-size: 11px;
    font-weight: 600;
    color: #52c41a;

    background: rgba(82, 196, 26, 10%);
  `,
  tabContainer: css`
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
  `,
}));

interface PlanCardData {
  badge?: 'medical' | 'popular';
  displayName: string;
  features: string[];
  id: string;
  keyLimits: string;
  monthlyEquiv?: string;
  price: number;
  priceUnit: string;
}

interface VietnamPricingCardsProps {
  currentPlanId?: string;
  mobile?: boolean;
  onSelectPlan?: (planId: string) => void;
}

const VietnamPricingCards = memo<VietnamPricingCardsProps>(
  ({ mobile, onSelectPlan, currentPlanId }) => {
    const { styles, cx } = useStyles();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const currentRank = PLAN_RANK[currentPlanId || 'vn_free'] ?? 0;

    // Monthly plans: Bò Viên, Đặc Biệt, Siêu Đặc Biệt
    const monthlyPlans: PlanCardData[] = useMemo(() => [
      {
        badge: 'popular' as const,
        displayName: VN_PLANS.vn_premium.displayName,
        features: VN_PLANS.vn_premium.features,
        id: 'vn_premium',
        keyLimits: VN_PLANS.vn_premium.keyLimits,
        price: VN_PLANS.vn_premium.price,
        priceUnit: 'VND/tháng',
      },
      {
        displayName: VN_PLANS.vn_pro.displayName,
        features: VN_PLANS.vn_pro.features,
        id: 'vn_pro',
        keyLimits: VN_PLANS.vn_pro.keyLimits,
        price: VN_PLANS.vn_pro.price,
        priceUnit: 'VND/tháng',
      },
      {
        displayName: VN_PLANS.vn_ultimate.displayName,
        features: VN_PLANS.vn_ultimate.features,
        id: 'vn_ultimate',
        keyLimits: VN_PLANS.vn_ultimate.keyLimits,
        price: VN_PLANS.vn_ultimate.price,
        priceUnit: 'VND/tháng',
      },
    ], []);

    // Yearly plans: Bò Viên, Medical Beta, Đặc Biệt, Siêu Đặc Biệt
    const yearlyPlans: PlanCardData[] = useMemo(() => [
      {
        badge: 'popular' as const,
        displayName: VN_PLANS.vn_premium.displayName,
        features: VN_PLANS.vn_premium.features,
        id: 'vn_premium',
        keyLimits: VN_PLANS.vn_premium.keyLimits,
        monthlyEquiv: `~${Math.round((VN_PLANS.vn_premium.priceYearly || 0) / 12).toLocaleString('vi-VN')}/tháng`,
        price: VN_PLANS.vn_premium.priceYearly || VN_PLANS.vn_premium.price * 12,
        priceUnit: 'VND/năm',
      },
      {
        badge: 'medical' as const,
        displayName: VN_PLANS.medical_beta.displayName,
        features: VN_PLANS.medical_beta.features,
        id: 'medical_beta',
        keyLimits: VN_PLANS.medical_beta.keyLimits,
        monthlyEquiv: '~83.000/tháng',
        price: VN_PLANS.medical_beta.price,
        priceUnit: 'VND/năm',
      },
      {
        displayName: VN_PLANS.vn_pro.displayName,
        features: VN_PLANS.vn_pro.features,
        id: 'vn_pro',
        keyLimits: VN_PLANS.vn_pro.keyLimits,
        monthlyEquiv: `~${Math.round((VN_PLANS.vn_pro.priceYearly || 0) / 12).toLocaleString('vi-VN')}/tháng`,
        price: VN_PLANS.vn_pro.priceYearly || VN_PLANS.vn_pro.price * 12,
        priceUnit: 'VND/năm',
      },
      {
        displayName: VN_PLANS.vn_ultimate.displayName,
        features: VN_PLANS.vn_ultimate.features,
        id: 'vn_ultimate',
        keyLimits: VN_PLANS.vn_ultimate.keyLimits,
        monthlyEquiv: `~${Math.round((VN_PLANS.vn_ultimate.priceYearly || 0) / 12).toLocaleString('vi-VN')}/tháng`,
        price: VN_PLANS.vn_ultimate.priceYearly || VN_PLANS.vn_ultimate.price * 12,
        priceUnit: 'VND/năm',
      },
    ], []);

    const plans = billingCycle === 'monthly' ? monthlyPlans : yearlyPlans;

    const getButtonProps = (planId: string) => {
      const planRank = PLAN_RANK[planId] ?? 0;
      const isCurrentPlan = currentPlanId === planId;
      // Medical Beta and vn_premium are same rank — only exact match shows "current"
      const isLowerPlan = planRank < currentRank;

      if (isCurrentPlan) {
        return { children: 'Gói Hiện Tại ✓', disabled: true, type: 'default' as const };
      }
      if (isLowerPlan) {
        return { children: 'Đã vượt', disabled: true, type: 'default' as const };
      }
      return { children: 'Nâng Cấp Ngay', disabled: false, type: 'default' as const };
    };

    const renderBadge = (plan: PlanCardData) => {
      if (currentPlanId === plan.id) {
        return <div className={styles.currentPlanBadge}>Gói Hiện Tại</div>;
      }
      if (plan.badge === 'popular') {
        return <div className={styles.popularBadge}>Phổ Biến Nhất</div>;
      }
      if (plan.badge === 'medical') {
        return <div className={styles.medicalBadge}>Y Tế 🏥</div>;
      }
      return null;
    };

    return (
      <Flexbox gap={24} width="100%">
        <Flexbox align="center" gap={12} horizontal justify="space-between" wrap="wrap">
          <Title level={3} style={{ margin: 0 }}>
            Bảng Giá Phở Chat
          </Title>
          <div className={styles.tabContainer}>
            <Segmented
              onChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}
              options={[
                { label: 'Tháng', value: 'monthly' },
                {
                  label: (
                    <Flexbox align="center" gap={6} horizontal>
                      Năm <span className={styles.savingsBadge}>-17%</span>
                    </Flexbox>
                  ),
                  value: 'yearly',
                },
              ]}
              value={billingCycle}
            />
          </div>
        </Flexbox>

        <div
          style={{
            display: 'grid',
            gap: mobile ? 16 : 16,
            gridTemplateColumns: mobile
              ? '1fr'
              : billingCycle === 'monthly'
                ? 'repeat(3, 1fr)'
                : 'repeat(4, 1fr)',
          }}
        >
          {plans.map((plan) => {
            const btnProps = getButtonProps(plan.id);
            const isPopular = plan.badge === 'popular' && currentPlanId !== plan.id;
            const isMedical = plan.badge === 'medical' && currentPlanId !== plan.id;

            return (
              <Card
                className={cx(
                  styles.card,
                  isPopular && 'popular',
                  isMedical && 'medical',
                )}
                key={plan.id}
                style={{ padding: mobile ? 16 : 20 }}
              >
                {renderBadge(plan)}

                <Flexbox gap={14}>
                  <Flexbox gap={4}>
                    <Title level={5} style={{ margin: 0 }}>
                      {plan.displayName}
                    </Title>
                    <Text style={{ fontSize: 12 }} type="secondary">{plan.keyLimits}</Text>
                  </Flexbox>

                  <Flexbox gap={2}>
                    <div>
                      <span className={styles.price}>
                        {plan.price.toLocaleString('vi-VN')}
                      </span>
                      <span className={styles.priceUnit}> {plan.priceUnit}</span>
                    </div>
                    {plan.monthlyEquiv && (
                      <Text className={styles.monthlyEquiv}>
                        {plan.monthlyEquiv}
                      </Text>
                    )}
                  </Flexbox>

                  <Divider style={{ margin: '4px 0' }} />

                  <Flexbox gap={6}>
                    {plan.features.map((feature, idx) => (
                      <div className={styles.feature} key={idx}>
                        <Check size={14} style={{ color: '#52c41a', flexShrink: 0, marginTop: 2 }} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </Flexbox>

                  <Button
                    block
                    disabled={btnProps.disabled}
                    onClick={() => onSelectPlan?.(plan.id)}
                    size="large"
                    type={isPopular ? 'primary' : btnProps.type}
                  >
                    {btnProps.children}
                  </Button>
                </Flexbox>
              </Card>
            );
          })}
        </div>
      </Flexbox>
    );
  },
);

VietnamPricingCards.displayName = 'VietnamPricingCards';

export default VietnamPricingCards;
