'use client';

import { Button, Input, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Bot, Code, Gamepad2, Hash, MessageCircle, Send, Zap } from 'lucide-react';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useOpenClawDeploy } from '../hooks/useOpenClawDeploy';

const { Title, Paragraph, Text } = Typography;

const CHANNEL_ICONS = [
  { channel: 'Telegram', free: true, icon: Send },
  { channel: 'WhatsApp', free: false, icon: MessageCircle },
  { channel: 'Slack', free: false, icon: Hash },
  { channel: 'Discord', free: false, icon: Gamepad2 },
  { channel: 'REST API', free: false, icon: Code },
];

const useStyles = createStyles(({ css, token }) => ({
  badge: css`
    padding: 2px 8px;

    font-size: 11px;
    font-weight: 600;
    color: #10b981;

    background: rgba(16, 185, 129, 0.15);
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
    gap: 6px;
    align-items: center;

    padding: 14px 18px;

    border-radius: 10px;
    transition: all 0.2s ease;

    &:hover {
      background: ${token.colorFillQuaternary};
      transform: translateY(-2px);
    }
  `,
  channelsRow: css`
    flex-wrap: wrap;
  `,
  container: css`
    padding: 56px 32px 48px;
    border-radius: 20px;
    background: linear-gradient(
      160deg,
      rgba(59, 130, 246, 0.08) 0%,
      ${token.colorBgElevated} 50%,
      rgba(139, 92, 246, 0.06) 100%
    );

    @media (max-width: 640px) {
      padding: 40px 20px 36px;
    }
  `,
  deployBox: css`
    width: 100%;
    max-width: 480px;
    padding: 28px;

    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 14px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
    transition: box-shadow 0.3s ease;

    &:hover {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    }
  `,
  deployButton: css`
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border: none;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 6px 24px rgba(59, 130, 246, 0.5);
      transform: translateY(-1px);
    }
  `,
  iconGlow: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 72px;
    height: 72px;

    color: #3b82f6;

    background: rgba(59, 130, 246, 0.1);
    border-radius: 20px;
    box-shadow: 0 0 32px rgba(59, 130, 246, 0.2);
  `,
  socialProof: css`
    font-size: 13px;
    color: ${token.colorTextSecondary};
  `,
  subtitle: css`
    max-width: 560px;
    font-size: 18px;
    color: ${token.colorTextSecondary};
    text-align: center;

    @media (max-width: 640px) {
      font-size: 16px;
    }
  `,
  title: css`
    margin: 0 !important;
    font-size: 40px;
    font-weight: 700;
    text-align: center;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    @media (max-width: 768px) {
      font-size: 30px;
    }
  `,
}));

const HeroSection = memo(() => {
  const { t } = useTranslation('openclaw');
  const { styles } = useStyles();
  const { token, setToken, deploying, handleDeploy, setSystemPrompt } = useOpenClawDeploy();

  // Pick up template prompt from sessionStorage (set by TemplatesSection)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('openclaw_template_prompt');
      if (stored) {
        setSystemPrompt(stored);
        sessionStorage.removeItem('openclaw_template_prompt');
      }
    } catch { /* ignore */ }
  }, [setSystemPrompt]);

  return (
    <Flexbox align="center" className={styles.container} gap={32}>
      <Flexbox align="center" gap={20}>
        <div className={styles.iconGlow}>
          <Bot size={36} />
        </div>
        <Title className={styles.title} level={1}>
          {t('hero.title')}
        </Title>
        <Paragraph className={styles.subtitle}>{t('hero.subtitle')}</Paragraph>
      </Flexbox>

      <Flexbox className={styles.channelsRow} gap={16} horizontal justify="center">
        {CHANNEL_ICONS.map(({ channel, free, icon: Icon }) => (
          <Flexbox align="center" className={styles.channelCard} gap={6} key={channel}>
            <Icon size={22} />
            <Text>{channel}</Text>
            <span className={free ? styles.badge : styles.badgePaid}>
              {free ? 'FREE' : '$5/mo'}
            </span>
          </Flexbox>
        ))}
      </Flexbox>

      <Flexbox className={styles.deployBox} gap={16}>
        <Flexbox align="center" gap={8} horizontal>
          <Zap size={20} style={{ color: '#3b82f6' }} />
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
