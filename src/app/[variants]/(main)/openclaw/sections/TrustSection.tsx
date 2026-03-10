'use client';

import { Check, DollarSign, Lock, Wrench } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';
import { Typography } from 'antd';

const { Title, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    padding: 24px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    transition: all 0.25s ease;

    &:hover {
      border-color: ${token.colorBorder};
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
  `,
  checkItem: css`
    color: ${token.colorSuccessText};
  `,
  question: css`
    font-size: 15px;
    font-weight: 600;
  `,
}));

const TRUST_SECTIONS = [
  {
    icon: Lock,
    items: ['encryption', 'noStorage', 'selfHost', 'openSource', 'soc2', 'gdpr'],
    key: 'security',
  },
  {
    icon: DollarSign,
    items: ['freeTier', 'clearPricing', 'cancelAnytime', 'noHiddenFees', 'freeTrial'],
    key: 'pricing',
  },
  {
    icon: Wrench,
    items: ['zeroCode', 'templates', 'viSupport', 'community'],
    key: 'easyUse',
  },
];

const TrustSection = memo(() => {
  const { t } = useTranslation('openclaw');
  const { styles } = useStyles();

  return (
    <Flexbox gap={24}>
      <Title level={3}>{t('trust.title')}</Title>
      <Flexbox gap={16}>
        {TRUST_SECTIONS.map(({ icon: Icon, key, items }) => (
          <Flexbox className={styles.card} gap={16} key={key}>
            <Flexbox gap={8} horizontal>
              <Icon size={20} />
              <Text className={styles.question}>{t(`trust.${key}.question`)}</Text>
            </Flexbox>
            <Flexbox gap={8}>
              {items.map((item) => (
                <Flexbox className={styles.checkItem} gap={8} horizontal key={item}>
                  <Check size={16} />
                  <Text>{t(`trust.${key}.${item}`)}</Text>
                </Flexbox>
              ))}
            </Flexbox>
          </Flexbox>
        ))}
      </Flexbox>
    </Flexbox>
  );
});

TrustSection.displayName = 'TrustSection';

export default TrustSection;
