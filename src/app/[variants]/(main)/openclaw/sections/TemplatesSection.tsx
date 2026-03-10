'use client';

import { BookOpen, Dumbbell, Headphones, Home, ShoppingBag, Utensils, Zap } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';
import { Button, Typography } from 'antd';

const { Title, Text, Paragraph } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    flex: 1;
    min-width: 260px;
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
  grid: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  `,
  iconWrap: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 40px;
    height: 40px;

    color: #3b82f6;

    background: rgba(59, 130, 246, 0.1);
    border-radius: 10px;
  `,
}));

const TEMPLATES = [
  { icon: ShoppingBag, key: 'shopAssistant' },
  { icon: BookOpen, key: 'studyBuddy' },
  { icon: Headphones, key: 'csAgent' },
  { icon: Home, key: 'realEstate' },
  { icon: Utensils, key: 'fnbOrderBot' },
  { icon: Dumbbell, key: 'coachBot' },
];

const TemplatesSection = memo(() => {
  const { t } = useTranslation('openclaw');
  const { styles } = useStyles();

  return (
    <Flexbox gap={24}>
      <Title level={3}>{t('templates.title')}</Title>

      <div className={styles.grid}>
        {TEMPLATES.map(({ icon: Icon, key }) => (
          <Flexbox className={styles.card} gap={12} key={key}>
            <Flexbox gap={8} horizontal>
              <div className={styles.iconWrap}>
                <Icon size={20} />
              </div>
              <Flexbox gap={2}>
                <Text strong>{t(`templates.${key}.name`)}</Text>
                <Paragraph style={{ margin: 0 }} type="secondary">
                  {t(`templates.${key}.desc`)}
                </Paragraph>
              </Flexbox>
            </Flexbox>
            <Button block icon={<Zap size={14} />}>
              {t('templates.deployFree')}
            </Button>
          </Flexbox>
        ))}
      </div>
    </Flexbox>
  );
});

TemplatesSection.displayName = 'TemplatesSection';

export default TemplatesSection;
