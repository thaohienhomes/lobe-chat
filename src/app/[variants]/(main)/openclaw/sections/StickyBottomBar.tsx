'use client';

import { Bot, Zap } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';
import { Button, Input, message } from 'antd';
import { Typography } from 'antd';

const { Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  bar: css`
    position: fixed;
    z-index: 1000;
    inset-block-end: 0;
    inset-inline: 0;

    padding: 12px 24px;

    background: ${token.colorBgElevated};
    border-block-start: 1px solid ${token.colorBorderSecondary};
    box-shadow: 0 -4px 16px ${token.colorBgLayout};

    transition: transform 0.3s ease;
  `,
  hidden: css`
    transform: translateY(100%);
  `,
  visible: css`
    transform: translateY(0);
  `,
}));

interface StickyBottomBarProps {
  visible: boolean;
}

const StickyBottomBar = memo<StickyBottomBarProps>(({ visible }) => {
  const { t } = useTranslation('openclaw');
  const { styles, cx } = useStyles();
  const [token, setToken] = useState('');

  const handleDeploy = () => {
    if (!token.trim()) {
      message.warning(t('hero.tokenRequired'));
      return;
    }
    message.success(t('hero.deploySuccess'));
  };

  return (
    <div className={cx(styles.bar, visible ? styles.visible : styles.hidden)}>
      <Flexbox align="center" gap={12} horizontal justify="center">
        <Flexbox align="center" gap={6} horizontal>
          <Bot size={18} />
          <Text strong>{t('sticky.label')}</Text>
        </Flexbox>
        <Input
          onChange={(e) => setToken(e.target.value)}
          placeholder={t('sticky.placeholder')}
          style={{ maxWidth: 280 }}
          value={token}
        />
        <Button icon={<Zap size={14} />} onClick={handleDeploy} type="primary">
          {t('sticky.deploy')}
        </Button>
      </Flexbox>
    </div>
  );
});

StickyBottomBar.displayName = 'StickyBottomBar';

export default StickyBottomBar;
