'use client';

import { Check, Star, Zap } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';
import { Button, Segmented, Typography } from 'antd';

const { Title, Text, Paragraph } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  bestBadge: css`
    position: absolute;
    top: -12px;
    right: 16px;

    display: flex;
    gap: 4px;
    align-items: center;

    padding: 4px 12px;

    font-size: 12px;
    font-weight: 600;
    color: #fff;

    background: linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryHover});
    border-radius: 20px;
  `,
  card: css`
    position: relative;
    flex: 1;
    min-width: 250px;
    padding: 28px 24px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
  `,
  cardHighlight: css`
    position: relative;
    flex: 1;
    min-width: 250px;
    padding: 28px 24px;
    background: ${token.colorBgContainer};
    border: 2px solid ${token.colorPrimary};
    border-radius: 12px;
    box-shadow: 0 0 24px ${token.colorPrimaryBg};
  `,
  feature: css`
    color: ${token.colorTextSecondary};
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  `,
  price: css`
    font-size: 36px;
    font-weight: 700;
    line-height: 1;
    color: ${token.colorText};
  `,
  saveTag: css`
    padding: 2px 8px;

    font-size: 12px;
    font-weight: 600;
    color: ${token.colorSuccessText};

    background: ${token.colorSuccessBg};
    border-radius: 4px;
  `,
  vnPrice: css`
    padding: 16px 24px;
    font-size: 13px;
    color: ${token.colorTextSecondary};
    text-align: center;
    background: ${token.colorFillQuaternary};
    border-radius: 8px;
  `,
}));

interface PlanConfig {
  buttonText: string;
  buttonType: 'default' | 'primary';
  features: string[];
  highlight?: boolean;
  key: string;
  monthlyPrice: string;
  period: string;
  yearlyPrice: string;
  yearlySave: string;
}

const PLANS: PlanConfig[] = [
  {
    buttonText: 'deployFree',
    buttonType: 'default',
    features: ['oneTelegram', 'hundredMsg', 'watermark', 'defaultAI'],
    key: 'free',
    monthlyPrice: '$0',
    period: '/forever',
    yearlyPrice: '$0',
    yearlySave: '',
  },
  {
    buttonText: 'startTrial',
    buttonType: 'default',
    features: ['threeChannels', 'thousandMsg', 'noWatermark', 'customPrompt', 'selfHost'],
    key: 'starter',
    monthlyPrice: '$5',
    period: '/mo',
    yearlyPrice: '$48',
    yearlySave: '$12',
  },
  {
    buttonText: 'startTrial',
    buttonType: 'primary',
    features: [
      'unlimitedChannels',
      'unlimitedMsg',
      'noWatermark',
      'customPrompt',
      'managedHosting',
      'autoScaling',
      'prioritySupport',
      'sla',
    ],
    highlight: true,
    key: 'premium',
    monthlyPrice: '$19',
    period: '/mo',
    yearlyPrice: '$182',
    yearlySave: '$46',
  },
];

const PricingSection = memo(() => {
  const { t } = useTranslation('openclaw');
  const { styles } = useStyles();
  const [billing, setBilling] = useState<string>('yearly');

  return (
    <Flexbox gap={24}>
      <Flexbox align="center" gap={16}>
        <Title level={3}>{t('pricing.title')}</Title>
        <Segmented
          onChange={(value) => setBilling(value as string)}
          options={[
            { label: t('pricing.monthly'), value: 'monthly' },
            { label: `${t('pricing.yearly')} - Save 20%`, value: 'yearly' },
          ]}
          value={billing}
        />
      </Flexbox>

      <div className={styles.grid}>
        {PLANS.map((plan) => (
          <Flexbox
            className={plan.highlight ? styles.cardHighlight : styles.card}
            gap={20}
            key={plan.key}
          >
            {plan.highlight && (
              <div className={styles.bestBadge}>
                <Star size={14} />
                BEST VALUE
              </div>
            )}

            <Flexbox gap={8}>
              <Text strong>{t(`pricing.plans.${plan.key}.name`)}</Text>
              <Flexbox align="baseline" gap={4} horizontal>
                <span className={styles.price}>
                  {billing === 'yearly' && plan.key !== 'free' ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <Text type="secondary">
                  {plan.key === 'free'
                    ? t('pricing.forever')
                    : billing === 'yearly'
                      ? `/${t('pricing.year')}`
                      : `/${t('pricing.month')}`}
                </Text>
              </Flexbox>
              {billing === 'yearly' && plan.yearlySave && (
                <span className={styles.saveTag}>Save {plan.yearlySave}</span>
              )}
            </Flexbox>

            <Flexbox gap={8}>
              {plan.features.map((feature) => (
                <Flexbox className={styles.feature} gap={8} horizontal key={feature}>
                  <Check size={16} />
                  <Text>{t(`pricing.features.${feature}`)}</Text>
                </Flexbox>
              ))}
            </Flexbox>

            <Button block size="large" type={plan.buttonType}>
              {plan.key === 'free' ? <Zap size={16} /> : null}
              {t(`pricing.${plan.buttonText}`)}
            </Button>
          </Flexbox>
        ))}
      </div>

      <div className={styles.vnPrice}>
        <Text>VN: Free | 99k/thang | 399k/thang | Nam: 950k | 3.8tr</Text>
        <br />
        <Text type="secondary">{t('pricing.paymentMethods')}</Text>
      </div>

      <Flexbox align="center">
        <Text type="secondary">{t('pricing.trialNote')}</Text>
      </Flexbox>
    </Flexbox>
  );
});

PricingSection.displayName = 'PricingSection';

export default PricingSection;
