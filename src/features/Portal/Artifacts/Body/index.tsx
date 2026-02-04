import { Highlighter } from '@lobehub/ui';
import { memo, useEffect, useMemo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors, chatSelectors } from '@/store/chat/selectors';
import { ArtifactDisplayMode } from '@/store/chat/slices/portal/initialState';
import { ArtifactType } from '@/types/artifact';

import Renderer from './Renderer';

const ArtifactsUI = memo(() => {
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

  useEffect(() => {
    // when message generating , check whether the artifact is closed
    // if close, move the display mode to preview
    if (isMessageGenerating && isArtifactTagClosed && displayMode === ArtifactDisplayMode.Code) {
      useChatStore.setState({ portalArtifactDisplayMode: ArtifactDisplayMode.Preview });
    }
  }, [isMessageGenerating, displayMode, isArtifactTagClosed]);

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

      default: {
        return 'html';
      }
    }
  }, [artifactType, artifactCodeLanguage]);

  // make sure the message and id is valid (but allow manual-preview)
  const isManualPreview = messageId === 'manual-preview';
  if (!messageId && !isManualPreview) return;

  // For manual previews, consider the artifact as "closed" (ready to render)
  const effectivelyTagClosed = isManualPreview || isArtifactTagClosed;

  // show code when the artifact is not closed or the display mode is code or the artifact type is code
  const showCode =
    !effectivelyTagClosed ||
    displayMode === ArtifactDisplayMode.Code ||
    artifactType === ArtifactType.Code;

  // Split mode: show both code and preview side-by-side
  const isSplitMode = displayMode === ArtifactDisplayMode.Split && effectivelyTagClosed;

  if (isSplitMode) {
    return (
      <Flexbox
        className={'portal-artifact'}
        flex={1}
        gap={0}
        height={'100%'}
        horizontal
        style={{ overflow: 'hidden' }}
      >
        {/* Code Panel */}
        <Flexbox
          flex={1}
          paddingInline={8}
          style={{
            borderRight: '1px solid rgba(255,255,255,0.1)',
            overflow: 'auto',
          }}
        >
          <Highlighter
            language={language || 'txt'}
            style={{ fontSize: 11, height: '100%', overflow: 'auto' }}
          >
            {artifactContent}
          </Highlighter>
        </Flexbox>
        {/* Preview Panel */}
        <Flexbox flex={1} paddingInline={8} style={{ overflow: 'auto' }}>
          <Renderer content={artifactContent} type={artifactType} />
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
          style={{ fontSize: 12, height: '100%', overflow: 'auto' }}
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
