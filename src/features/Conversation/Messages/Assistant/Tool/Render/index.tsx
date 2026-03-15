import isEqual from 'fast-deep-equal';
import dynamic from 'next/dynamic';
import { parse } from 'partial-json';
import { Suspense, memo } from 'react';

import { LOADING_FLAT } from '@/const/message';
import { useChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';

import Arguments from './Arguments';
import CustomRender from './CustomRender';
import ErrorResponse from './ErrorResponse';

const VisualizerWidget = dynamic(
  () => import('@/tools/visualizer/Render/VisualizerWidget'),
  { ssr: false },
);

/** Safely parse a partial JSON string, returning an object or empty. */
const safeParsePartialJson = (str?: string): Record<string, any> => {
  if (!str) return {};
  try {
    const obj = parse(str);
    return typeof obj === 'object' && obj !== null ? obj : {};
  } catch {
    return {};
  }
};

/** Minimum widget_code length to show streaming preview */
const MIN_STREAMING_CODE_LEN = 50;

interface RenderProps {
  apiName?: string;
  identifier?: string;
  messageId: string;
  requestArgs?: string;
  setShowPluginRender: (show: boolean) => void;
  showPluginRender: boolean;
  toolCallId: string;
  toolIndex: number;
}

const Render = memo<RenderProps>(
  ({
    toolCallId,
    toolIndex,
    messageId,
    requestArgs,
    showPluginRender,
    setShowPluginRender,
    identifier,
    apiName,
  }) => {
    const loading = useChatStore(chatSelectors.isToolCallStreaming(messageId, toolIndex));
    const toolMessage = useChatStore(chatSelectors.getMessageByToolCallId(toolCallId), isEqual);

    // ── Streaming preview for Visualizer ──────────────────────────────────────
    // During tool_calls streaming, the assistant message's tools[] contain
    // partial args (including partial widget_code). We parse them and show
    // a streaming VisualizerWidget preview instead of the default Arguments.
    if (loading && identifier === 'pho-visualizer' && apiName === 'show_widget') {
      const partialArgs = safeParsePartialJson(requestArgs);
      if (
        typeof partialArgs.widget_code === 'string' &&
        partialArgs.widget_code.length > MIN_STREAMING_CODE_LEN
      ) {
        return (
          <VisualizerWidget
            isStreaming
            loadingMessages={partialArgs.loading_messages || []}
            messageId={messageId}
            title={partialArgs.title || 'visualization'}
            widgetCode={partialArgs.widget_code}
          />
        );
      }
    }

    // 如果处于 loading 或者找不到 toolMessage 则展示 Arguments
    if (loading || !toolMessage) return <Arguments arguments={requestArgs} />;

    if (!!toolMessage) {
      if (toolMessage.error) {
        return <ErrorResponse {...toolMessage.error} id={messageId} plugin={toolMessage.plugin} />;
      }

      // 如果是 LOADING_FLAT 则说明还在加载中
      // 而 standalone 模式的插件 content 应该始终是 LOADING_FLAT
      if (toolMessage.content === LOADING_FLAT && toolMessage.plugin?.type !== 'standalone')
        return <Arguments arguments={requestArgs} shine />;

      return (
        <Suspense fallback={<Arguments arguments={requestArgs} shine />}>
          <CustomRender
            {...toolMessage}
            requestArgs={requestArgs}
            setShowPluginRender={setShowPluginRender}
            showPluginRender={showPluginRender}
          />
        </Suspense>
      );
    }
  },
);

Render.displayName = 'ToolRender';

export default Render;
