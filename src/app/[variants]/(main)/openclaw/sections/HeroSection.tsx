'use client';

import { Bot, Send, Zap } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';
import { Button, Input, Typography, message } from 'antd';

const { Title, Paragraph, Text } = Typography;

const CHANNEL_ICONS = [
  { channel: 'Telegram', free: true, icon: Send },
  { channel: 'WhatsApp', free: false, icon: Send },
  { channel: 'Slack', free: false, icon: Send },
  { channel: 'Discord', free: false, icon: Send },
  { channel: 'REST API', free: false, icon: Send },
];

const useStyles = createStyles(({ css, token }) => ({
  badge: css`
    padding: 2px 8px;

    font-size: 11px;
    color: ${token.colorSuccessText};

    background: ${token.colorSuccessBg};
    border-radius: 4px;
  `,
  badgePaid: css`
    padding: 2px 8px;

    font-size: 11px;
    color: ${token.colorTextSecondary};

    background: ${token.colorFillSecondary};
    border-radius: 4px;
  `,
  channelCard: css`
    cursor: default;

    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;

    padding: 12px 16px;

    border-radius: 8px;

    &:hover {
      background: ${token.colorFillQuaternary};
    }
  `,
  channelsRow: css`
    flex-wrap: wrap;
  `,
  container: css`
    padding: 48px 32px;
    border-radius: 16px;
    background: linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgElevated} 100%);
  `,
  deployBox: css`
    padding: 24px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
  `,
  deployButton: css`
    height: 48px;
    font-size: 16px;
    font-weight: 600;
  `,
  socialProof: css`
    font-size: 13px;
    color: ${token.colorTextSecondary};
  `,
  subtitle: css`
    font-size: 18px;
    color: ${token.colorTextSecondary};
  `,
  title: css`
    margin: 0 !important;
    font-size: 36px;
    background: linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryHover});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    @media (max-width: 768px) {
      font-size: 28px;
    }
  `,
}));

const HeroSection = memo(() => {
  const { t } = useTranslation('openclaw');
  const { styles } = useStyles();
  const [token, setToken] = useState('');
  const [deploying, setDeploying] = useState(false);

  const handleDeploy = () => {
    if (!token.trim()) {
      message.warning(t('hero.tokenRequired'));
      return;
    }
    setDeploying(true);
    // TODO: Implement actual deploy logic
    setTimeout(() => {
      message.success(t('hero.deploySuccess'));
      setDeploying(false);
    }, 2000);
  };

  return (
    <Flexbox align="center" className={styles.container} gap={32}>
      <Flexbox align="center" gap={16}>
        <Bot size={48} />
        <Title className={styles.title} level={1}>
          {t('hero.title')}
        </Title>
        <Paragraph className={styles.subtitle}>{t('hero.subtitle')}</Paragraph>
      </Flexbox>

      <Flexbox className={styles.channelsRow} gap={16} horizontal justify="center">
        {CHANNEL_ICONS.map(({ channel, free }) => (
          <Flexbox align="center" className={styles.channelCard} gap={4} key={channel}>
            <Send size={20} />
            <Text>{channel}</Text>
            <span className={free ? styles.badge : styles.badgePaid}>
              {free ? 'FREE' : '$5/mo'}
            </span>
          </Flexbox>
        ))}
      </Flexbox>

      <Flexbox className={styles.deployBox} gap={16}>
        <Flexbox align="center" gap={8} horizontal>
          <Zap size={20} />
          <Text strong>{t('hero.deployTitle')}</Text>
        </Flexbox>
        <Paragraph type="secondary">{t('hero.tokenLabel')}</Paragraph>
        <Input
          onChange={(e) => setToken(e.target.value)}
          placeholder="123456789:ABCdefGHIjklmnop..."
          size="large"
          value={token}
        />
        <Text type="secondary">{t('hero.tokenHint')}</Text>
        <Button
          className={styles.deployButton}
          loading={deploying}
          onClick={handleDeploy}
          size="large"
          type="primary"
        >
          <Zap size={18} />
          {t('hero.deployButton')}
        </Button>
      </Flexbox>

      <Text className={styles.socialProof}>{t('hero.socialProof')}</Text>
    </Flexbox>
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;
