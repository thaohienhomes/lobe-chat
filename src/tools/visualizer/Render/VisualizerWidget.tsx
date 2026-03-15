'use client';

import { memo, useCallback } from 'react';

import { VisualizerRenderer } from '@/features/visualizer';
import { useVisualizerTheme } from '@/features/visualizer/useVisualizerTheme';
import { useChatStore } from '@/store/chat';

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

    return (
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
    );
  },
);

VisualizerWidget.displayName = 'VisualizerWidget';

export default VisualizerWidget;

