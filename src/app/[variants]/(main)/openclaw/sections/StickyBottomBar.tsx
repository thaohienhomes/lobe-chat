'use client';

import { Bot, Zap } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';
import { Button, Input, Typography } from 'antd';

import { useOpenClawDeploy } from '../hooks/useOpenClawDeploy';

const { Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  bar: css`
    position: fixed;
    z-index: 1000;
    inset-block-end: 0;
    inset-inline: 0;

    padding: 12px 24px;

    background: rgba(${token.colorBgElevated === '#fff' ? '255, 255, 255' : '20, 20, 20'}, 0.85);
    backdrop-filter: blur(12px);
    border-block-start: 1px solid ${token.colorBorderSecondary};
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);

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
  const { token, setToken, deploying, handleDeploy } = useOpenClawDeploy();

  return (
    <div className={cx(styles.bar, visible ? styles.visible : styles.hidden)}>
      <Flexbox align="center" gap={12} horizontal justify="center">
        <Flexbox align="center" gap={6} horizontal>
          <Bot size={18} style={{ color: '#3b82f6' }} />
          <Text strong>{t('sticky.label')}</Text>
        </Flexbox>
        <Input
          onChange={(e) => setToken(e.target.value)}
          placeholder={t('sticky.placeholder')}
          style={{ maxWidth: 280 }}
          value={token}
        />
        <Button icon={<Zap size={14} />} loading={deploying} onClick={handleDeploy} type="primary">
          {t('sticky.deploy')}
        </Button>
      </Flexbox>
    </div>
  );
});

StickyBottomBar.displayName = 'StickyBottomBar';

export default StickyBottomBar;
