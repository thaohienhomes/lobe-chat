'use client';

import { Clock, Code, Lock, MessageCircle } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';
import { Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    flex: 1;
    min-width: 240px;
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
  grid: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  `,
  solution: css`
    padding: 16px 24px;
    font-size: 16px;
    font-weight: 600;
    color: #3b82f6;
    text-align: center;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 10px;
  `,
}));

const PAIN_POINTS = [
  { icon: Clock, key: 'support247' },
  { icon: MessageCircle, key: 'wantAI' },
  { icon: Code, key: 'complexSetup' },
  { icon: Lock, key: 'security' },
];

const PainPointsSection = memo(() => {
  const { t } = useTranslation('openclaw');
  const { styles } = useStyles();

  return (
    <Flexbox gap={24}>
      <Title level={3}>{t('painPoints.title')}</Title>

      <div className={styles.grid}>
        {PAIN_POINTS.map(({ icon: Icon, key }) => (
          <Flexbox className={styles.card} gap={8} key={key}>
            <Icon size={24} />
            <Text strong>{t(`painPoints.${key}.title`)}</Text>
            <Paragraph type="secondary">{t(`painPoints.${key}.desc`)}</Paragraph>
          </Flexbox>
        ))}
      </div>

      <div className={styles.solution}>{t('painPoints.solution')}</div>
    </Flexbox>
  );
});

PainPointsSection.displayName = 'PainPointsSection';

export default PainPointsSection;
