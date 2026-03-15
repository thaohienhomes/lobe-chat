'use client';

import { Highlighter } from '@lobehub/ui';
import { Result } from 'antd';
import { memo, useCallback } from 'react';

import { VisualizerRenderer } from '@/features/visualizer';
import VisualizerErrorBoundary from '@/features/visualizer/VisualizerErrorBoundary';
import { useVisualizerTheme } from '@/features/visualizer/useVisualizerTheme';
import { useChatStore } from '@/store/chat';

/** Maximum widget code size in bytes (500KB) */
const MAX_WIDGET_CODE_SIZE = 500 * 1024;

interface VisualizerWidgetProps {
  isStreaming?: boolean;
  loadingMessages: string[];
  messageId: string;
  title: string;
  widgetCode: string;
}

/**
 * Wraps VisualizerRenderer with theme + sendPrompt wiring for use as a tool render.
 *
 * - Theme: derived from current antd tokens via useVisualizerTheme
 * - sendPrompt: forwards widget interaction to chat input
 * - isStreaming: when true, scripts are deferred and srcdoc updates are debounced
 * - isComplete: inverse of isStreaming — scripts execute only when complete
 * - ErrorBoundary: catches widget crashes and shows fallback UI
 * - Size limit: rejects widget code > 500KB for safety
 */
const VisualizerWidget = memo<VisualizerWidgetProps>(
  ({ widgetCode, title, loadingMessages, messageId, isStreaming = false }) => {
    const theme = useVisualizerTheme();

    const handleSendPrompt = useCallback(
      (text: string) => {
        // Update the chat input with the text from the widget
        useChatStore.getState().updateInputMessage(text);
      },
      [],
    );

    const handleInteraction = useCallback(
      (data: unknown) => {
        console.debug('[Visualizer] Widget interaction:', { data, messageId });
      },
      [messageId],
    );

    // Safety check: reject oversized widget code
    if (widgetCode && widgetCode.length > MAX_WIDGET_CODE_SIZE) {
      return (
        <div style={{ padding: 16 }}>
          <Result
            status="warning"
            subTitle={`Widget code is ${(widgetCode.length / 1024).toFixed(0)}KB, exceeding the ${MAX_WIDGET_CODE_SIZE / 1024}KB limit.`}
            title="Widget Too Large"
          />
          <Highlighter language="html" style={{ maxHeight: 200, overflow: 'auto' }}>
            {widgetCode.slice(0, 1000) + '\n\n... (truncated)'}
          </Highlighter>
        </div>
      );
    }

    return (
      <VisualizerErrorBoundary fallbackCode={widgetCode}>
        <VisualizerRenderer
          isComplete={!isStreaming}
          isStreaming={isStreaming}
          loadingMessages={loadingMessages}
          onInteraction={handleInteraction}
          onSendPrompt={handleSendPrompt}
          theme={theme}
          title={title}
          widgetCode={widgetCode}
        />
      </VisualizerErrorBoundary>
    );
  },
);

VisualizerWidget.displayName = 'VisualizerWidget';

export default VisualizerWidget;
