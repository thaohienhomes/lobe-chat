'use client';

import { Quote } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';
import { Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  quote: css`
    padding: 20px 24px;
    font-style: italic;
    background: ${token.colorBgContainer};
    border-inline-start: 3px solid ${token.colorPrimary};
    border-radius: 0 12px 12px 0;
  `,
  stat: css`
    flex: 1;
    min-width: 120px;
    padding: 24px;
    text-align: center;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
  `,
  statNumber: css`
    font-size: 32px;
    font-weight: 700;
    color: ${token.colorPrimary};
  `,
  statsRow: css`
    flex-wrap: wrap;
  `,
}));

const STATS = [
  { key: 'botsLive', value: '2,847' },
  { key: 'messagesProcessed', value: '156K' },
  { key: 'uptime', value: '99.9%' },
];

const TESTIMONIALS = ['testimonial1', 'testimonial2'];

const SocialProofSection = memo(() => {
  const { t } = useTranslation('openclaw');
  const { styles } = useStyles();

  return (
    <Flexbox gap={24}>
      <Title level={3}>{t('social.title')}</Title>

      <Flexbox className={styles.statsRow} gap={16} horizontal>
        {STATS.map(({ key, value }) => (
          <Flexbox className={styles.stat} gap={4} key={key}>
            <Text className={styles.statNumber}>{value}</Text>
            <Text type="secondary">{t(`social.stats.${key}`)}</Text>
          </Flexbox>
        ))}
      </Flexbox>

      <Flexbox gap={16}>
        {TESTIMONIALS.map((key) => (
          <Flexbox className={styles.quote} gap={8} key={key}>
            <Quote size={16} />
            <Paragraph style={{ margin: 0 }}>{t(`social.${key}.text`)}</Paragraph>
            <Text type="secondary">{t(`social.${key}.author`)}</Text>
          </Flexbox>
        ))}
      </Flexbox>
    </Flexbox>
  );
});

SocialProofSection.displayName = 'SocialProofSection';

export default SocialProofSection;
