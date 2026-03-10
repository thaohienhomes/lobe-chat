'use client';

import { message } from 'antd';
import { Button, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { BookOpen, Dumbbell, Headphones, Home, ShoppingBag, Utensils, Zap } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { BOT_TEMPLATES } from '../data/templates';

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

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  coach: Dumbbell,
  cs_agent: Headphones,
  fnb_order: Utensils,
  real_estate: Home,
  shop_assistant: ShoppingBag,
  study_buddy: BookOpen,
};

const TemplatesSection = memo(() => {
  const { t } = useTranslation('openclaw');
  const { styles } = useStyles();

  const handleTemplateClick = useCallback((templateId: string) => {
    // Store template choice, scroll to hero deploy box
    const template = BOT_TEMPLATES.find((tmpl) => tmpl.id === templateId);
    if (template) {
      // Store in sessionStorage so HeroSection can pick it up
      try {
        sessionStorage.setItem('openclaw_template_prompt', template.systemPrompt);
      } catch { /* ignore */ }
    }
    // Scroll to top of page (hero section)
    const wrapper = document.querySelector('[data-openclaw-wrapper]');
    if (wrapper) {
      wrapper.scrollTo({ behavior: 'smooth', top: 0 });
    }
    message.info('Paste your Telegram bot token above to deploy with this template!');
  }, []);

  return (
    <Flexbox gap={24}>
      <Title level={3}>{t('templates.title')}</Title>

      <div className={styles.grid}>
        {BOT_TEMPLATES.map((tmpl) => {
          const Icon = ICON_MAP[tmpl.id] || ShoppingBag;
          return (
            <Flexbox className={styles.card} gap={12} key={tmpl.id}>
              <Flexbox gap={8} horizontal>
                <div className={styles.iconWrap}>
                  <Icon size={20} />
                </div>
                <Flexbox gap={2}>
                  <Text strong>{t(tmpl.nameKey)}</Text>
                  <Paragraph style={{ margin: 0 }} type="secondary">
                    {t(tmpl.descKey)}
                  </Paragraph>
                </Flexbox>
              </Flexbox>
              <Button block icon={<Zap size={14} />} onClick={() => handleTemplateClick(tmpl.id)}>
                {t('templates.deployFree')}
              </Button>
            </Flexbox>
          );
        })}
      </div>
    </Flexbox>
  );
});

TemplatesSection.displayName = 'TemplatesSection';

export default TemplatesSection;
