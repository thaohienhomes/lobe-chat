'use client';

import { Highlighter } from '@lobehub/ui';
import { Result } from 'antd';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { VisualizerRenderer } from '@/features/visualizer';
import VisualizerErrorBoundary from '@/features/visualizer/VisualizerErrorBoundary';
import { useVisualizerTheme } from '@/features/visualizer/useVisualizerTheme';
import { useChatStore } from '@/store/chat';

/** Maximum widget code size in bytes (500KB) */
const MAX_WIDGET_CODE_SIZE = 500 * 1024;
/** Maximum widgets rendered per message */
const MAX_WIDGETS_PER_MESSAGE = 3;

/** Track widget count per message to enforce limit */
const widgetCountByMessage = new Map<string, number>();

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
    const { t } = useTranslation('plugin');

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
            subTitle={t('visualizer.error.tooLargeDesc', {
              limit: MAX_WIDGET_CODE_SIZE / 1024,
              size: (widgetCode.length / 1024).toFixed(0),
            })}
            title={t('visualizer.error.tooLarge')}
          />
          <Highlighter language="html" style={{ maxHeight: 200, overflow: 'auto' }}>
            {widgetCode.slice(0, 1000) + '\n\n... (truncated)'}
          </Highlighter>
        </div>
      );
    }

    // Enforce max widgets per message
    const currentCount = widgetCountByMessage.get(messageId) || 0;
    if (currentCount >= MAX_WIDGETS_PER_MESSAGE) {
      return (
        <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, padding: '8px 12px' }}>
          {t('visualizer.widgetLimit', { max: MAX_WIDGETS_PER_MESSAGE })}
        </div>
      );
    }
    widgetCountByMessage.set(messageId, currentCount + 1);

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
