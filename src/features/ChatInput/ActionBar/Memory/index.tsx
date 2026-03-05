import { useTheme } from 'antd-style';
import { Brain, BrainCircuit } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsMobile } from '@/hooks/useIsMobile';
import { useAgentStore } from '@/store/agent';
import { agentChatConfigSelectors } from '@/store/agent/slices/chat';

import Action from '../components/Action';
import Controls from './Controls';

const Memory = memo(() => {
  const { t } = useTranslation('chat');
  const [isEnabled, memoryConfig, updateAgentChatConfig] = useAgentStore((s) => [
    agentChatConfigSelectors.isMemoryEnabled(s),
    agentChatConfigSelectors.memoryConfig(s),
    s.updateAgentChatConfig,
  ]);
  const theme = useTheme();
  const isMobile = useIsMobile();

  return (
    <Action
      color={isEnabled ? theme.colorInfo : undefined}
      icon={isEnabled ? BrainCircuit : Brain}
      onClick={
        isMobile
          ? undefined
          : async (e) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              await updateAgentChatConfig({
                memory: { ...memoryConfig, enabled: !isEnabled },
              });
            }
      }
      popover={{
        content: <Controls />,
        maxWidth: 320,
        minWidth: 320,
        placement: 'topLeft',
        styles: {
          body: {
            padding: 4,
          },
        },
        trigger: isMobile ? ['click'] : ['hover'],
      }}
      showTooltip={false}
      title={t('memory.title')}
    />
  );
});

Memory.displayName = 'Memory';

export default Memory;
