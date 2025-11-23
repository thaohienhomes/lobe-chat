import { Button, CopyButton, Input } from '@lobehub/ui';
import { message } from 'antd';
import { LinkIcon, Loader2 } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useIsMobile } from '@/hooks/useIsMobile';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { useSessionStore } from '@/store/session';
import { sessionMetaSelectors } from '@/store/session/selectors';

const ShareLink = memo(() => {
  const { t } = useTranslation(['chat', 'common']);
  const isMobile = useIsMobile();
  const [shareUrl, setShareUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const currentAgentMeta = useSessionStore(sessionMetaSelectors.currentAgentMeta);
  const currentAgentConfig = useAgentStore(agentSelectors.currentAgentConfig);
  const activeId = useSessionStore((s) => s.activeId);

  const generateShareLink = async () => {
    setLoading(true);
    try {
      // Call API to create shareable link
      const response = await fetch('/api/share/create', {
        body: JSON.stringify({
          config: currentAgentConfig,
          meta: currentAgentMeta,
          sessionId: activeId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const data = await response.json();
      const fullUrl = `${window.location.origin}/api/share/${data.id}`;
      setShareUrl(fullUrl);
    } catch (error) {
      console.error('Error generating share link:', error);
      message.error(t('shareModal.linkGenerationFailed', { ns: 'chat' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-generate link when component mounts
    generateShareLink();
  }, []);

  return (
    <Flexbox gap={16} style={{ padding: isMobile ? 0 : '16px 0' }}>
      <Flexbox gap={8}>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
          {t('shareModal.linkDescription', {
            defaultValue:
              'Share this link with others. They will get a new conversation with the same configuration (agent, model, system role, etc.)',
            ns: 'chat',
          })}
        </div>
      </Flexbox>

      <Flexbox align={'center'} gap={8} horizontal width={'100%'}>
        <Input
          placeholder={loading ? t('shareModal.generating', { ns: 'chat' }) : ''}
          readOnly
          style={{ flex: 1 }}
          value={shareUrl}
          variant={'filled'}
        />
        <CopyButton
          content={shareUrl}
          icon={LinkIcon}
          placement="left"
          size={{ blockSize: 36, size: 16 }}
        />
      </Flexbox>

      {loading && (
        <Flexbox align={'center'} gap={8} horizontal justify={'center'}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
            {t('shareModal.generating', { defaultValue: 'Generating share link...', ns: 'chat' })}
          </span>
        </Flexbox>
      )}

      <Flexbox gap={8}>
        <Button
          block
          disabled={!shareUrl || loading}
          icon={LinkIcon}
          onClick={generateShareLink}
          size={isMobile ? undefined : 'large'}
        >
          {t('shareModal.regenerateLink', { defaultValue: 'Regenerate Link', ns: 'chat' })}
        </Button>
      </Flexbox>

      <Flexbox gap={4} style={{ marginTop: 8 }}>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          💡 {t('shareModal.linkTip', { defaultValue: 'Tip', ns: 'chat' })}:
        </div>
        <ul style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0, paddingLeft: 20 }}>
          <li>
            {t('shareModal.linkTip1', {
              defaultValue: 'Recipients will need to log in to use the shared template',
              ns: 'chat',
            })}
          </li>
          <li>
            {t('shareModal.linkTip2', {
              defaultValue: 'Each person gets their own separate conversation',
              ns: 'chat',
            })}
          </li>
          <li>
            {t('shareModal.linkTip3', {
              defaultValue: 'Your conversation history is NOT shared',
              ns: 'chat',
            })}
          </li>
        </ul>
      </Flexbox>
    </Flexbox>
  );
});

export default ShareLink;

