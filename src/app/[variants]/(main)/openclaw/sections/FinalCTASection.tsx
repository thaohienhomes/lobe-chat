'use client';

import { Zap } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';
import { Button, Collapse, Input, Typography, message } from 'antd';

const { Title, Paragraph, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    padding: 48px 32px;
    text-align: center;
    background: linear-gradient(
      160deg,
      rgba(59, 130, 246, 0.08) 0%,
      ${token.colorBgElevated} 50%,
      rgba(139, 92, 246, 0.06) 100%
    );
    border-radius: 20px;

    @media (max-width: 640px) {
      padding: 36px 20px;
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
  faqAnswer: css`
    color: ${token.colorTextSecondary};
  `,
  urgency: css`
    font-size: 18px;
    font-weight: 600;
    color: ${token.colorText};
  `,
}));

const FinalCTASection = memo(() => {
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
    setTimeout(() => {
      message.success(t('hero.deploySuccess'));
      setDeploying(false);
    }, 2000);
  };

  const faqItems = [
    {
      children: <Text className={styles.faqAnswer}>{t('faq.noCode.a')}</Text>,
      key: 'noCode',
      label: t('faq.noCode.q'),
    },
    {
      children: <Text className={styles.faqAnswer}>{t('faq.aiModel.a')}</Text>,
      key: 'aiModel',
      label: t('faq.aiModel.q'),
    },
    {
      children: <Text className={styles.faqAnswer}>{t('faq.limits.a')}</Text>,
      key: 'limits',
      label: t('faq.limits.q'),
    },
    {
      children: <Text className={styles.faqAnswer}>{t('faq.cancel.a')}</Text>,
      key: 'cancel',
      label: t('faq.cancel.q'),
    },
  ];

  return (
    <Flexbox gap={32}>
      <Flexbox align="center" className={styles.container} gap={24}>
        <Title level={3}>{t('finalCTA.title')}</Title>
        <Paragraph className={styles.urgency}>{t('finalCTA.urgency')}</Paragraph>

        <Flexbox gap={12} style={{ maxWidth: 480, width: '100%' }}>
          <Input
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste Telegram Bot Token..."
            size="large"
            value={token}
          />
          <Button
            className={styles.deployButton}
            icon={<Zap size={18} />}
            loading={deploying}
            onClick={handleDeploy}
            size="large"
            type="primary"
          >
            {t('hero.deployButton')}
          </Button>
          <Text type="secondary">{t('finalCTA.noCreditCard')}</Text>
        </Flexbox>
      </Flexbox>

      <Flexbox gap={16}>
        <Title level={4}>FAQ</Title>
        <Collapse expandIconPosition="end" ghost items={faqItems} />
      </Flexbox>
    </Flexbox>
  );
});

FinalCTASection.displayName = 'FinalCTASection';

export default FinalCTASection;
