import { ActionIcon, ActionIconProps, Hotkey } from '@lobehub/ui';
import { Badge } from 'antd';
import { Compass, FolderClosed, MessageSquare, Palette, Video } from 'lucide-react';
import Link from 'next/link';
import { CSSProperties, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useGlobalStore } from '@/store/global';
import { SidebarTabKey } from '@/store/global/initialState';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';
import { HotkeyEnum } from '@/types/hotkey';

const ICON_SIZE: ActionIconProps['size'] = {
  blockSize: 40,
  size: 24,
  strokeWidth: 2,
};

export interface TopActionProps {
  isPinned?: boolean | null;
  tab?: SidebarTabKey;
}

const TopActions = memo<TopActionProps>(({ tab, isPinned }) => {
  const { t } = useTranslation('common');
  const switchBackToChat = useGlobalStore((s) => s.switchBackToChat);
  const { showMarket, enableKnowledgeBase, showAiImage } =
    useServerConfigStore(featureFlagsSelectors);
  const hotkey = useUserStore(settingsSelectors.getHotkeyById(HotkeyEnum.NavigateToChat));

  const isChatActive = tab === SidebarTabKey.Chat && !isPinned;
  const isFilesActive = tab === SidebarTabKey.Files;
  const isDiscoverActive = tab === SidebarTabKey.Discover;
  const isImageActive = tab === SidebarTabKey.Image;

  return (
    <Flexbox gap={8}>
      <Link
        aria-label={t('tab.chat')}
        href={'/chat'}
        onClick={(e) => {
          // If Cmd key is pressed, let the default link behavior happen (open in new tab)
          if (e.metaKey || e.ctrlKey) {
            return;
          }

          // Otherwise, prevent default and switch session within the current tab
          e.preventDefault();
          switchBackToChat(useSessionStore.getState().activeId);
        }}
      >
        <ActionIcon
          active={isChatActive}
          icon={MessageSquare}
          size={ICON_SIZE}
          title={
            <Flexbox align={'center'} gap={8} horizontal justify={'space-between'}>
              <span>{t('tab.chat')}</span>
              <Hotkey inverseTheme keys={hotkey} />
            </Flexbox>
          }
          tooltipProps={{ placement: 'right' }}
        />
      </Link>
      {enableKnowledgeBase && (
        <Link aria-label={t('tab.files')} href={'/files'}>
          <ActionIcon
            active={isFilesActive}
            icon={FolderClosed}
            size={ICON_SIZE}
            title={t('tab.files')}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {showAiImage && (
        <Link aria-label={t('tab.aiImage')} href={'/image'}>
          <ActionIcon
            active={isImageActive}
            icon={Palette}
            size={ICON_SIZE}
            title={t('tab.aiImage')}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {showMarket && (
        <Link aria-label={t('tab.discover')} href={'/discover'}>
          <ActionIcon
            active={isDiscoverActive}
            icon={Compass}
            size={ICON_SIZE}
            title={t('tab.discover')}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {/* Phở Studio Cross-Promotion */}
      <a
        aria-label="Phở Studio"
        href="https://studio.pho.chat"
        rel="noopener noreferrer"
        style={{ display: 'inline-block', position: 'relative' }}
        target="_blank"
      >
        <ActionIcon
          icon={Video}
          size={ICON_SIZE}
          style={
            {
              border: '1px solid rgba(240, 66, 28, 0.6)',
              borderRadius: 8,
              boxShadow: '0 0 12px 2px rgba(240, 66, 28, 0.5)',
            } as CSSProperties
          }
          title="Phở Studio - AI Video Generation"
          tooltipProps={{ placement: 'right' }}
        />
        <Badge
          count="NEW"
          size="small"
          style={{
            backgroundColor: '#F0421C',
            fontSize: 8,
            height: 14,
            lineHeight: '14px',
            padding: '0 4px',
            position: 'absolute',
            right: -8,
            top: -4,
          }}
        />
      </a>
    </Flexbox>
  );
});

export default TopActions;
