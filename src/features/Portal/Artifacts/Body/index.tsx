import { Highlighter } from '@lobehub/ui';
import { Skeleton } from 'antd';
import { createStyles, useTheme } from 'antd-style';
import { Loader2 } from 'lucide-react';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors, chatSelectors } from '@/store/chat/selectors';
import { ArtifactDisplayMode } from '@/store/chat/slices/portal/initialState';
import { ArtifactType } from '@/types/artifact';

import Renderer from './Renderer';

const ARTIFACT_CODE_FONT_SIZE = 12;

// Artifact types that have a live Preview (not pure code)
const PREVIEWABLE_ARTIFACT_TYPES = new Set<string>([
  ArtifactType.React,
  ArtifactType.Mermaid,
  ArtifactType.SVG,
  ArtifactType.InteractiveImage,
  ArtifactType.GenerativeDiagram,
  ArtifactType.ContentVisualizer,
  ArtifactType.AIRendering,
  // text/html falls through to default HTMLRenderer — match by string
  'text/html',
]);

const useStyles = createStyles(({ css, token }) => ({
  placeholderBox: css`
    padding-block: 32px;
    padding-inline: 24px;

    font-size: 13px;
    color: ${token.colorTextTertiary};
    text-align: center;
  `,
  skeletonWrap: css`
    width: 100%;
    padding: 24px;
  `,
  spinIcon: css`
    color: ${token.colorPrimary};
    animation: spin 1.2s linear infinite;

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
}));

// ── Skeleton Loader ─────────────────────────────────────────────────────────
const ArtifactSkeleton = memo(() => {
  const { styles } = useStyles();
  return (
    <Center flex={1} gap={16} height={'100%'}>
      <Loader2 className={styles.spinIcon} size={28} />
      <span style={{ color: 'inherit', fontSize: 13, opacity: 0.7 }}>Generating artifact...</span>
      <div className={styles.skeletonWrap}>
        <Skeleton active paragraph={{ rows: 6 }} title={false} />
      </div>
    </Center>
  );
});

// ── Streaming placeholder for preview panel ─────────────────────────────────
const StreamingPreviewPlaceholder = memo(() => {
  const { styles } = useStyles();
  return (
    <Center className={styles.placeholderBox} flex={1} gap={8} height={'100%'}>
      <Loader2 className={styles.spinIcon} size={20} />
      <span>Preview will appear when generation completes</span>
    </Center>
  );
});

const ArtifactsUI = memo(() => {
  const token = useTheme();
  const [
    messageId,
    displayMode,
    isMessageGenerating,
    artifactType,
    artifactContent,
    artifactCodeLanguage,
    isArtifactTagClosed,
  ] = useChatStore((s) => {
    const messageId = chatPortalSelectors.artifactMessageId(s) || '';

    return [
      messageId,
      s.portalArtifactDisplayMode,
      chatSelectors.isMessageGenerating(messageId)(s),
      chatPortalSelectors.artifactType(s),
      chatPortalSelectors.artifactCode(messageId)(s) || s.portalArtifact?.content || '',
      chatPortalSelectors.artifactCodeLanguage(s),
      chatPortalSelectors.isArtifactTagClosed(messageId)(s),
    ];
  });

  const isPreviewable = artifactType ? PREVIEWABLE_ARTIFACT_TYPES.has(artifactType) : false;

  // ── Task 1.2: Loading state — show skeleton when content is minimal ───────
  const isLoadingSkeleton =
    isMessageGenerating && artifactContent.length < 50 && !isArtifactTagClosed;

  // ── Claude-style UX: Split during generation → Preview after ─────────────
  // Track previous isArtifactTagClosed to detect the false→true transition
  const prevTagClosedRef = useRef<boolean>(isArtifactTagClosed);

  useEffect(() => {
    if (!isPreviewable || !artifactType) return;

    const wasStreaming = !prevTagClosedRef.current; // tag was open (still generating)
    const isNowClosed = isArtifactTagClosed; // tag just closed

    if (wasStreaming && isNowClosed) {
      // Artifact just finished generating → switch to full Preview
      useChatStore.setState(
        { portalArtifactDisplayMode: ArtifactDisplayMode.Preview },
        false,
        'autoSwitchToPreview',
      );
    }

    prevTagClosedRef.current = isArtifactTagClosed;
  }, [isArtifactTagClosed, artifactType, isPreviewable]);

  const language = useMemo(() => {
    switch (artifactType) {
      case ArtifactType.React: {
        return 'tsx';
      }

      case ArtifactType.Code: {
        return artifactCodeLanguage;
      }

      case ArtifactType.Python: {
        return 'python';
      }

      case ArtifactType.InteractiveImage: {
        return 'json';
      }

      default: {
        return 'html';
      }
    }
  }, [artifactType, artifactCodeLanguage]);

  // make sure the message and id is valid (but allow manual-preview)
  const isManualPreview = messageId === 'manual-preview';
  if (!messageId && !isManualPreview) return;

  // ── Task 1.2: Show skeleton if content hasn't started yet ─────────────────
  if (isLoadingSkeleton) {
    return (
      <Flexbox
        className={'portal-artifact'}
        flex={1}
        height={'100%'}
        style={{ overflow: 'hidden' }}
      >
        <ArtifactSkeleton />
      </Flexbox>
    );
  }

  // For manual previews, consider the artifact as "closed" (ready to render)
  const effectivelyTagClosed = isManualPreview || isArtifactTagClosed;

  // InteractiveImage always renders preview (no code view needed)
  const isInteractiveImage = artifactType === ArtifactType.InteractiveImage;

  // Split mode: show code + preview side-by-side (available while streaming too)
  const isSplitMode = displayMode === ArtifactDisplayMode.Split;

  // During streaming of a previewable artifact: auto-use Split so user sees both code + preview
  // (matches Claude.ai behaviour — code streams on left, preview renders on right)
  const effectiveSplitMode =
    isSplitMode || (isMessageGenerating && !isArtifactTagClosed && isPreviewable);

  // ── Task 1.6: During streaming, don't live-render in split preview (causes flicker) ──
  const isStreamingSplit = isMessageGenerating && !isArtifactTagClosed && isPreviewable;

  // show code when the artifact is not closed or the display mode is code or the artifact type is code
  const showCode =
    !isInteractiveImage &&
    (!effectivelyTagClosed ||
      displayMode === ArtifactDisplayMode.Code ||
      artifactType === ArtifactType.Code);

  if (effectiveSplitMode) {
    return (
      <Flexbox
        className={'portal-artifact'}
        flex={1}
        gap={0}
        height={'100%'}
        horizontal
        style={{ overflow: 'hidden' }}
      >
        {/* Code Panel — left */}
        <Flexbox
          flex={1}
          paddingInline={8}
          style={{
            borderRight: `1px solid ${token.colorSplit}`,
            overflow: 'auto',
          }}
        >
          <Highlighter
            language={language || 'txt'}
            style={{ fontSize: ARTIFACT_CODE_FONT_SIZE, height: '100%', overflow: 'auto' }}
          >
            {artifactContent}
          </Highlighter>
        </Flexbox>
        {/* Preview Panel — right */}
        <Flexbox flex={1} paddingInline={8} style={{ overflow: 'auto' }}>
          {isStreamingSplit ? (
            <StreamingPreviewPlaceholder />
          ) : (
            <Renderer content={artifactContent} type={artifactType} />
          )}
        </Flexbox>
      </Flexbox>
    );
  }

  return (
    <Flexbox
      className={'portal-artifact'}
      flex={1}
      gap={8}
      height={'100%'}
      paddingInline={12}
      style={{ overflow: 'hidden' }}
    >
      {showCode ? (
        <Highlighter
          language={language || 'txt'}
          style={{ fontSize: ARTIFACT_CODE_FONT_SIZE, height: '100%', overflow: 'auto' }}
        >
          {artifactContent}
        </Highlighter>
      ) : (
        <Renderer content={artifactContent} type={artifactType} />
      )}
    </Flexbox>
  );
});

export default ArtifactsUI;
