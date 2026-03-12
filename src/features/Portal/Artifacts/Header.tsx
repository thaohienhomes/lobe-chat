import { ArtifactType } from '@lobechat/types';
import { ActionIcon, Icon, Segmented, Text } from '@lobehub/ui';
import { ConfigProvider, Dropdown, type MenuProps, message } from 'antd';
import { createStyles, cx } from 'antd-style';
import {
  ArrowLeft,
  ClipboardCopy,
  CodeIcon,
  Columns2 as ColumnsIcon,
  Download,
  ExternalLink,
  EyeIcon,
  FileText,
  Image,
  Share2,
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

// ── File extension map ────────────────────────────────────────────────────
const EXT_MAP: Record<string, string> = {
  [ArtifactType.Code]: 'txt',
  [ArtifactType.Mermaid]: 'mmd',
  [ArtifactType.Python]: 'py',
  [ArtifactType.React]: 'tsx',
  [ArtifactType.SVG]: 'svg',
};

// ── Helper: trigger browser download ─────────────────────────────────────
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Helper: get artifact title for filenames ─────────────────────────────
function getTitle() {
  return chatPortalSelectors.artifactTitle(useChatStore.getState()) || 'artifact';
}

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
    message.success('Copied to clipboard');
  }, [getArtifactCode]);

  const handleDownloadCode = useCallback(() => {
    const code = getArtifactCode();
    if (!code) return;
    const ext = (artifactType && EXT_MAP[artifactType]) || 'html';
    const mime = ext === 'html' ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8';
    triggerDownload(new Blob([code], { type: mime }), `${getTitle()}.${ext}`);
  }, [getArtifactCode, artifactType]);

  const handleDownloadMarkdown = useCallback(() => {
    const code = getArtifactCode();
    if (!code) return;
    triggerDownload(new Blob([code], { type: 'text/markdown;charset=utf-8' }), `${getTitle()}.md`);
  }, [getArtifactCode]);

  const handlePrintPDF = useCallback(() => {
    const code = getArtifactCode();
    if (!code) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(code);
    printWindow.document.close();
    printWindow.addEventListener('load', () => {
      setTimeout(() => printWindow.print(), 500);
    });
  }, [getArtifactCode]);

  const handleOpenNewTab = useCallback(() => {
    const code = getArtifactCode();
    if (!code) return;
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    window.open(URL.createObjectURL(blob), '_blank');
  }, [getArtifactCode]);

  // ── PNG export for SVG & Mermaid ──────────────────────────────────────────
  const handleDownloadPNG = useCallback(() => {
    const code = getArtifactCode();
    if (!code) return;

    // For SVG artifacts: render SVG string directly to canvas
    if (artifactType === ArtifactType.SVG) {
      const svgBlob = new Blob([code], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new window.Image();
      img.addEventListener('load', () => {
        const canvas = document.createElement('canvas');
        // Use higher resolution for crisp exports
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) triggerDownload(blob, `${getTitle()}.png`);
        }, 'image/png');
        URL.revokeObjectURL(url);
      });
      img.src = url;
      return;
    }

    // For Mermaid artifacts: find the rendered SVG in the portal DOM (may be in iframe)
    if (artifactType === ArtifactType.Mermaid) {
      const portalEl = document.querySelector('.portal-artifact');
      let svgEl: SVGSVGElement | null = null;

      // First, try direct DOM
      svgEl = portalEl?.querySelector('svg') || null;

      // If not found, search inside iframes (Renderer uses iframe for preview)
      if (!svgEl && portalEl) {
        const iframes = portalEl.querySelectorAll('iframe');
        for (const iframe of iframes) {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              svgEl = iframeDoc.querySelector('svg');
              if (svgEl) break;
            }
          } catch {
            // Cross-origin iframe — skip
          }
        }
      }

      if (!svgEl) {
        message.warning('No rendered diagram found. Try switching to Preview mode first.');
        return;
      }

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgEl);
      // Get dimensions from the SVG's viewBox or bounding rect
      const bbox = svgEl.getBoundingClientRect();
      const width = svgEl.getAttribute('width')
        ? Number.parseInt(svgEl.getAttribute('width')!, 10)
        : bbox.width || 800;
      const height = svgEl.getAttribute('height')
        ? Number.parseInt(svgEl.getAttribute('height')!, 10)
        : bbox.height || 600;

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new window.Image();
      img.addEventListener('load', () => {
        const canvas = document.createElement('canvas');
        const scale = 2;
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) triggerDownload(blob, `${getTitle()}.png`);
        }, 'image/png');
        URL.revokeObjectURL(url);
      });
      img.src = url;
    }
  }, [getArtifactCode, artifactType]);

  // ── Build conditional menu ────────────────────────────────────────────────
  const isSvgOrMermaid = artifactType === ArtifactType.SVG || artifactType === ArtifactType.Mermaid;
  const isPreviewable = artifactType !== ArtifactType.Code && artifactType !== ArtifactType.Python;

  const downloadMenuItems: MenuProps['items'] = useMemo(
    () =>
      [
        {
          icon: <Icon icon={ClipboardCopy} size={'small'} />,
          key: 'copy',
          label: 'Copy to clipboard',
          onClick: handleCopyToClipboard,
        },
        { type: 'divider' as const },
        {
          icon: <Icon icon={Download} size={'small'} />,
          key: 'code',
          label: `Download .${(artifactType && EXT_MAP[artifactType]) || 'html'}`,
          onClick: handleDownloadCode,
        },
        {
          icon: <Icon icon={FileText} size={'small'} />,
          key: 'md',
          label: 'Download .md',
          onClick: handleDownloadMarkdown,
        },
        isSvgOrMermaid && {
          icon: <Icon icon={Image} size={'small'} />,
          key: 'png',
          label: 'Download PNG',
          onClick: handleDownloadPNG,
        },
        isPreviewable && {
          icon: <Icon icon={Download} size={'small'} />,
          key: 'pdf',
          label: 'Download PDF',
          onClick: handlePrintPDF,
        },
        { type: 'divider' as const },
        isPreviewable && {
          icon: <Icon icon={ExternalLink} size={'small'} />,
          key: 'newtab',
          label: 'Open in new tab',
          onClick: handleOpenNewTab,
        },
      ].filter(Boolean) as MenuProps['items'],
    [
      handleCopyToClipboard,
      handleDownloadCode,
      handleDownloadMarkdown,
      handlePrintPDF,
      handleOpenNewTab,
      handleDownloadPNG,
      artifactType,
      isSvgOrMermaid,
      isPreviewable,
    ],
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
        {showDownload && (
          <ActionIcon
            icon={Share2}
            onClick={() => {
              const state = useChatStore.getState();
              const msgId = chatPortalSelectors.artifactMessageId(state) || '';
              const code = chatPortalSelectors.artifactCode(msgId)(state);
              if (!code) return;
              const payload = JSON.stringify({
                content: code,
                title: artifactTitle || 'Untitled',
                type: artifactType || 'text/html',
              });
              // Unicode-safe base64url encode
              const bytes = new TextEncoder().encode(payload);
              const binStr = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
              const encoded = btoa(binStr)
                .replaceAll('+', '-')
                .replaceAll('/', '_')
                .replaceAll('=', '');
              const url = `${window.location.origin}/artifact?d=${encoded}`;
              navigator.clipboard
                .writeText(url)
                .then(() => {
                  message.success('Share link copied!');
                })
                .catch(() => {
                  // Fallback: select text for manual copy
                  const ta = document.createElement('textarea');
                  ta.value = url;
                  document.body.append(ta);
                  ta.select();
                  document.execCommand('copy');
                  ta.remove();
                  message.success('Share link copied!');
                });
            }}
            size={'small'}
            title={'Share'}
          />
        )}
      </Flexbox>
    </Flexbox>
  );
};

export default Header;
