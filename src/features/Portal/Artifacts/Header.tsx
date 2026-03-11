import { ArtifactType } from '@lobechat/types';
import { ActionIcon, Icon, Segmented, Text } from '@lobehub/ui';
import { ConfigProvider, Dropdown, type MenuProps } from 'antd';
import { createStyles, cx } from 'antd-style';
import {
  ArrowLeft,
  ClipboardCopy,
  CodeIcon,
  Columns2 as ColumnsIcon,
  Download,
  ExternalLink,
  EyeIcon,
} from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors, chatSelectors } from '@/store/chat/selectors';
import { ArtifactDisplayMode } from '@/store/chat/slices/portal/initialState';
import { oneLineEllipsis } from '@/styles';

const useStyles = createStyles(({ css, token }) => ({
  streamDot: css`
    display: inline-block;
    flex-shrink: 0;

    width: 6px;
    height: 6px;
    border-radius: 50%;

    background: ${token.colorPrimary};

    animation: pulse 1.5s infinite;

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }

      50% {
        opacity: 0.3;
      }
    }
  `,
  streamText: css`
    font-size: 11px;
    color: ${token.colorPrimary};
    white-space: nowrap;
  `,
}));

const Header = () => {
  const { t } = useTranslation('portal');
  const { styles } = useStyles();

  const [
    displayMode,
    artifactType,
    artifactTitle,
    isArtifactTagClosed,
    isGenerating,
    closeArtifact,
  ] = useChatStore((s) => {
    const messageId = chatPortalSelectors.artifactMessageId(s) || '';

    return [
      s.portalArtifactDisplayMode,
      chatPortalSelectors.artifactType(s),
      chatPortalSelectors.artifactTitle(s),
      chatPortalSelectors.isArtifactTagClosed(messageId)(s),
      chatSelectors.isMessageGenerating(messageId)(s),
      s.closeArtifact,
    ];
  });

  // show switch only when artifact is closed and the type is not code
  const showSwitch = isArtifactTagClosed && artifactType !== ArtifactType.Code;
  const isStreaming = isGenerating && !isArtifactTagClosed;

  const getArtifactCode = useCallback(() => {
    const state = useChatStore.getState();
    const messageId = chatPortalSelectors.artifactMessageId(state) || '';
    return chatPortalSelectors.artifactCode(messageId)(state);
  }, []);

  // ── Download handlers ─────────────────────────────────────────────────────

  const handleCopyToClipboard = useCallback(() => {
    const code = getArtifactCode();
    if (!code) return;
    navigator.clipboard.writeText(code);
  }, [getArtifactCode]);

  const handleDownloadCode = useCallback(() => {
    const code = getArtifactCode();
    if (!code) return;

    // Determine file extension based on artifact type
    const extMap: Record<string, string> = {
      [ArtifactType.React]: 'tsx',
      [ArtifactType.Python]: 'py',
      [ArtifactType.SVG]: 'svg',
      [ArtifactType.Mermaid]: 'mmd',
      [ArtifactType.Code]: 'txt',
    };
    const ext = (artifactType && extMap[artifactType]) || 'html';
    const mime = ext === 'html' ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8';

    const blob = new Blob([code], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatPortalSelectors.artifactTitle(useChatStore.getState()) || 'artifact'}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getArtifactCode, artifactType]);

  const handlePrintPDF = useCallback(() => {
    const code = getArtifactCode();
    if (!code) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(code);
    printWindow.document.close();
    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    });
  }, [getArtifactCode]);

  const handleOpenNewTab = useCallback(() => {
    const code = getArtifactCode();
    if (!code) return;
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [getArtifactCode]);

  const downloadMenuItems: MenuProps['items'] = useMemo(
    () =>
      [
        {
          icon: <Icon icon={ClipboardCopy} size={'small'} />,
          key: 'copy',
          label: 'Copy to clipboard',
          onClick: handleCopyToClipboard,
        },
        {
          icon: <Icon icon={Download} size={'small'} />,
          key: 'code',
          label: 'Download file',
          onClick: handleDownloadCode,
        },
        {
          icon: <Icon icon={Download} size={'small'} />,
          key: 'pdf',
          label: 'Download PDF',
          onClick: handlePrintPDF,
        },
        {
          icon: <Icon icon={ExternalLink} size={'small'} />,
          key: 'newtab',
          label: 'Open in new tab',
          onClick: handleOpenNewTab,
        },
      ].filter(Boolean),
    [handleCopyToClipboard, handleDownloadCode, handlePrintPDF, handleOpenNewTab],
  );

  const showDownload = isArtifactTagClosed;

  return (
    <Flexbox align={'center'} flex={1} gap={12} horizontal justify={'space-between'} width={'100%'}>
      <Flexbox align={'center'} gap={4} horizontal style={{ minWidth: 0 }}>
        <ActionIcon icon={ArrowLeft} onClick={() => closeArtifact()} size={'small'} />
        <Text className={cx(oneLineEllipsis)} type={'secondary'}>
          {artifactTitle}
        </Text>
        {isStreaming && (
          <Flexbox align={'center'} gap={4} horizontal style={{ flexShrink: 0 }}>
            <span className={styles.streamDot} />
            <span className={styles.streamText}>Generating...</span>
          </Flexbox>
        )}
      </Flexbox>
      <Flexbox align={'center'} gap={8} horizontal>
        <ConfigProvider
          theme={{
            token: {
              borderRadiusSM: 16,
              borderRadiusXS: 16,
              fontSize: 12,
            },
          }}
        >
          {showSwitch && (
            <Segmented
              onChange={(value) => {
                useChatStore.setState({ portalArtifactDisplayMode: value as ArtifactDisplayMode });
              }}
              options={[
                {
                  icon: <Icon icon={EyeIcon} />,
                  label: t('artifacts.display.preview'),
                  value: ArtifactDisplayMode.Preview,
                },
                {
                  icon: <Icon icon={CodeIcon} />,
                  label: t('artifacts.display.code'),
                  value: ArtifactDisplayMode.Code,
                },
                {
                  icon: <Icon icon={ColumnsIcon} />,
                  label: t('artifacts.display.split', 'Split'),
                  value: ArtifactDisplayMode.Split,
                },
              ]}
              size={'small'}
              value={displayMode}
            />
          )}
        </ConfigProvider>
        {showDownload && (
          <Dropdown menu={{ items: downloadMenuItems }} trigger={['click']}>
            <ActionIcon icon={Download} size={'small'} title={'Download'} />
          </Dropdown>
        )}
      </Flexbox>
    </Flexbox>
  );
};

export default Header;
