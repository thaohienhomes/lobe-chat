'use client';

import { Brain, LayoutDashboard, Network, Zap } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';
import { Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    padding: 24px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    transition: all 0.25s ease;

    &:hover {
      border-color: rgba(59, 130, 246, 0.5);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
  `,
  iconWrap: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 48px;
    height: 48px;

    color: ${token.colorPrimary};

    background: ${token.colorPrimaryBg};
    border-radius: 12px;
  `,
}));

const FEATURES = [
  { icon: Zap, key: 'quickDeploy' },
  { icon: Brain, key: 'smartAI' },
  { icon: Network, key: 'multiChannel' },
  { icon: LayoutDashboard, key: 'dashboard' },
];

const FeaturesSection = memo(() => {
  const { t } = useTranslation('openclaw');
  const { styles } = useStyles();

  return (
    <Flexbox gap={24}>
      <Title level={3}>{t('features.title')}</Title>
      <Flexbox gap={16}>
        {FEATURES.map(({ icon: Icon, key }) => (
          <Flexbox className={styles.card} gap={12} horizontal key={key}>
            <div className={styles.iconWrap}>
              <Icon size={24} />
            </div>
            <Flexbox gap={4}>
              <Text strong>{t(`features.${key}.title`)}</Text>
              <Paragraph type="secondary">{t(`features.${key}.desc`)}</Paragraph>
            </Flexbox>
          </Flexbox>
        ))}
      </Flexbox>
    </Flexbox>
  );
});

FeaturesSection.displayName = 'FeaturesSection';

export default FeaturesSection;
