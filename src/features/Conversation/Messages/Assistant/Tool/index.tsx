'use client';

import { CSSProperties, memo, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import AnimatedCollapsed from '@/components/AnimatedCollapsed';
import { useChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';
import { VisualizerApiNames, VisualizerManifest } from '@/tools/visualizer';

import Inspectors from './Inspector';
import Render from './Render';

export interface InspectorProps {
  apiName: string;
  arguments?: string;
  id: string;
  identifier: string;
  index: number;
  messageId: string;
  payload: object;
  style?: CSSProperties;
  type?: string;
}

const Tool = memo<InspectorProps>(
  ({ arguments: requestArgs, apiName, messageId, id, index, identifier, style, payload, type }) => {
    const [showDetail, setShowDetail] = useState(false);
    const [showPluginRender, setShowPluginRender] = useState(false);
    const isLoading = useChatStore(chatSelectors.isInToolsCalling(messageId, index));

    useEffect(() => {
      if (!type) return;

      // MCP tools: expand while loading, collapse 1.5s after completion
      if (type === 'mcp') {
        setTimeout(
          () => {
            setShowDetail(isLoading);
          },
          isLoading ? 1 : 1500,
        );
        return;
      }

      // Builtin tools (Visualizer, DALL-E, etc.): auto-expand once loading completes
      // so their rendered content (widget, image) is visible by default
      if (type === 'builtin' && !isLoading) {
        setShowDetail(true);
      }
    }, [isLoading, type]);

    // --- Visualizer-specific logic (AFTER all hooks to satisfy Rules of Hooks) ---

    const isVisualizerReadMe =
      identifier === VisualizerManifest.identifier &&
      apiName === VisualizerApiNames.visualizerReadMe;

    const isVisualizerWidget =
      identifier === VisualizerManifest.identifier &&
      apiName === VisualizerApiNames.showWidget;

    // Task 1: Hide visualizer_read_me completely — zero UI footprint
    if (isVisualizerReadMe) {
      return null;
    }

    // Task 2b: When visualizer widget is done loading, show only the chart without Inspector
    if (isVisualizerWidget && !isLoading && showDetail) {
      return (
        <Flexbox gap={8} style={style} width={'100%'}>
          <Render
            apiName={apiName}
            identifier={identifier}
            messageId={messageId}
            requestArgs={requestArgs}
            setShowPluginRender={setShowPluginRender}
            showPluginRender={showPluginRender}
            toolCallId={id}
            toolIndex={index}
          />
        </Flexbox>
      );
    }

    return (
      <Flexbox gap={8} style={style} width={'100%'}>
        <Inspectors
          apiName={apiName}
          arguments={requestArgs}
          // mcp don't have ui render
          hidePluginUI={type === 'mcp'}
          id={id}
          identifier={identifier}
          index={index}
          messageId={messageId}
          payload={payload}
          setShowPluginRender={setShowPluginRender}
          setShowRender={setShowDetail}
          showPluginRender={showPluginRender}
          showRender={showDetail}
        />
        <AnimatedCollapsed open={showDetail}>
          <Render
            apiName={apiName}
            identifier={identifier}
            messageId={messageId}
            requestArgs={requestArgs}
            setShowPluginRender={setShowPluginRender}
            showPluginRender={showPluginRender}
            toolCallId={id}
            toolIndex={index}
          />
        </AnimatedCollapsed>
      </Flexbox>
    );
  },
);

Tool.displayName = 'AssistantTool';

export default Tool;
