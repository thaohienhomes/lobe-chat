import { Icon } from '@lobehub/ui';
import { Divider, Segmented } from 'antd';
import { createStyles } from 'antd-style';
import { Brain, BrainCircuit } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Center, Flexbox } from 'react-layout-kit';

import { useAgentStore } from '@/store/agent';
import { agentChatConfigSelectors } from '@/store/agent/slices/chat';

const useStyles = createStyles(({ css, token }) => ({
  active: css`
    background: ${token.colorFillTertiary};
  `,
  description: css`
    font-size: 12px;
    color: ${token.colorTextDescription};
  `,
  icon: css`
    border: 1px solid ${token.colorFillTertiary};
    border-radius: ${token.borderRadius}px;
    background: ${token.colorBgElevated};
  `,
  option: css`
    cursor: pointer;

    width: 100%;
    padding-block: 8px;
    padding-inline: 8px;
    border-radius: ${token.borderRadius}px;

    transition: background-color 0.2s;

    &:hover {
      background: ${token.colorFillTertiary};
    }
  `,
  title: css`
    font-size: 14px;
    font-weight: 500;
    color: ${token.colorText};
  `,
}));

const ToggleItem = memo<{ enabled: boolean }>(({ enabled }) => {
  const { cx, styles } = useStyles();
  const { t } = useTranslation('chat');

  const [isEnabled, memoryConfig, updateAgentChatConfig] = useAgentStore((s) => [
    agentChatConfigSelectors.isMemoryEnabled(s),
    agentChatConfigSelectors.memoryConfig(s),
    s.updateAgentChatConfig,
  ]);

  const isActive = enabled === isEnabled;
  const icon = enabled ? BrainCircuit : Brain;
  const label = enabled ? t('memory.on.title') : t('memory.off.title');
  const description = enabled ? t('memory.on.desc') : t('memory.off.desc');

  return (
    <Flexbox
      align={'flex-start'}
      className={cx(styles.option, isActive && styles.active)}
      gap={12}
      horizontal
      onClick={async () => {
        await updateAgentChatConfig({ memory: { ...memoryConfig, enabled } });
      }}
    >
      <Center className={styles.icon} flex={'none'} height={32} width={32}>
        <Icon icon={icon} />
      </Center>
      <Flexbox flex={1}>
        <div className={styles.title}>{label}</div>
        <div className={styles.description}>{description}</div>
      </Flexbox>
    </Flexbox>
  );
});

const Controls = memo(() => {
  const { t } = useTranslation('chat');
  const [isEnabled, effort, memoryConfig, updateAgentChatConfig] = useAgentStore((s) => [
    agentChatConfigSelectors.isMemoryEnabled(s),
    agentChatConfigSelectors.memoryEffort(s),
    agentChatConfigSelectors.memoryConfig(s),
    s.updateAgentChatConfig,
  ]);

  return (
    <Flexbox gap={4}>
      <ToggleItem enabled />
      <ToggleItem enabled={false} />
      {isEnabled && (
        <>
          <Divider style={{ margin: '4px 0' }} />
          <Flexbox gap={8} paddingInline={8}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{t('memory.effort.title')}</div>
            <Segmented
              block
              onChange={(value) => {
                updateAgentChatConfig({
                  memory: { ...memoryConfig, effort: value as 'low' | 'medium' | 'high' },
                });
              }}
              options={[
                { label: t('memory.effort.low.title'), value: 'low' },
                { label: t('memory.effort.medium.title'), value: 'medium' },
                { label: t('memory.effort.high.title'), value: 'high' },
              ]}
              value={effort}
            />
            <div style={{ fontSize: 12, opacity: 0.6 }}>{t('memory.effort.desc')}</div>
          </Flexbox>
        </>
      )}
    </Flexbox>
  );
});

export default Controls;
