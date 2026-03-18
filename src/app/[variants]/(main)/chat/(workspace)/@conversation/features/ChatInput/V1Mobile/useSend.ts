import { useCallback, useMemo } from 'react';

import { useAnalyticsSafe } from '@/hooks/useAnalyticsSafe';
import { useGeminiChineseWarning } from '@/hooks/useGeminiChineseWarning';
import { getAgentStoreState } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { chatSelectors, topicSelectors } from '@/store/chat/selectors';
import { fileChatSelectors, useFileStore } from '@/store/file';
import { getUserStoreState } from '@/store/user';
import { SendMessageParams } from '@/types/message';

export type UseSendMessageParams = Pick<
  SendMessageParams,
  'onlyAddUserMessage' | 'isWelcomeQuestion'
>;

export const useSendMessage = () => {
  const [sendMessage, updateInputMessage] = useChatStore((s) => [
    s.sendMessage,
    s.updateInputMessage,
  ]);
  const { analytics } = useAnalyticsSafe();
  const checkGeminiChineseWarning = useGeminiChineseWarning();

  const clearChatUploadFileList = useFileStore((s) => s.clearChatUploadFileList);

  const isUploadingFiles = useFileStore(fileChatSelectors.isUploadingFiles);
  const isSendButtonDisabledByMessage = useChatStore(chatSelectors.isSendButtonDisabledByMessage);

  const canSend = !isUploadingFiles && !isSendButtonDisabledByMessage;

  const send = useCallback(async (params: UseSendMessageParams = {}) => {
    const store = useChatStore.getState();
    if (chatSelectors.isAIGenerating(store)) return;

    // if uploading file or send button is disabled by message, then we should not send the message
    const isUploadingFiles = fileChatSelectors.isUploadingFiles(useFileStore.getState());
    const isSendButtonDisabledByMessage = chatSelectors.isSendButtonDisabledByMessage(
      useChatStore.getState(),
    );

    const canSend = !isUploadingFiles && !isSendButtonDisabledByMessage;
    if (!canSend) return;

    const fileList = fileChatSelectors.chatUploadFileList(useFileStore.getState());
    // if there is no message and no image, then we should not send the message
    if (!store.inputMessage && fileList.length === 0) return;

    // Check for Chinese text warning with Gemini model
    const agentStore = getAgentStoreState();
    const currentModel = agentSelectors.currentAgentModel(agentStore);
    const shouldContinue = await checkGeminiChineseWarning({
      model: currentModel,
      prompt: store.inputMessage,
      scenario: 'chat',
    });

    if (!shouldContinue) return;

    // Context window warning: warn when conversation is very long
    const LONG_CONVERSATION_THRESHOLD = 200;
    const messageCount = chatSelectors.activeBaseChats(store).length;
    if (messageCount >= LONG_CONVERSATION_THRESHOLD) {
      const warningKey = `__ctx_warn_${store.activeId}`;
      const alreadyWarned =
        typeof sessionStorage !== 'undefined' && sessionStorage.getItem(warningKey);

      if (!alreadyWarned) {
        const { Modal } = await import('antd');
        const shouldContinueChat = await new Promise<boolean>((resolve) => {
          Modal.confirm({
            cancelText: 'Tiếp tục',
            content: `Cuộc hội thoại đã có ${messageCount} tin nhắn. Điều này có thể ảnh hưởng đến chất lượng và tốc độ phản hồi AI. Bạn có muốn tạo cuộc hội thoại mới?`,
            okText: 'Tạo hội thoại mới',
            onCancel: () => resolve(true),
            onOk: () => resolve(false),
            title: '⚠️ Cuộc hội thoại dài',
          });
        });

        try {
          sessionStorage.setItem(warningKey, '1');
        } catch {
          // Safari private browsing
        }

        analytics?.track({
          name: 'long_conversation_warning_shown',
          properties: {
            chat_id: store.activeId,
            continued: shouldContinueChat,
            message_count: messageCount,
            platform: 'mobile',
          },
        });

        if (!shouldContinueChat) {
          window.location.href = '/chat';
          return;
        }
      }
    }

    sendMessage({
      files: fileList,
      message: store.inputMessage,
      ...params,
    });

    updateInputMessage('');
    clearChatUploadFileList();

    // 获取分析数据
    const userStore = getUserStoreState();

    // 直接使用现有数据结构判断消息类型
    const hasImages = fileList.some((file) => file.file?.type?.startsWith('image'));
    const messageType = fileList.length === 0 ? 'text' : hasImages ? 'image' : 'file';

    analytics?.track({
      name: 'send_message',
      properties: {
        chat_id: store.activeId || 'unknown',
        current_topic: topicSelectors.currentActiveTopic(store)?.title || null,
        has_attachments: fileList.length > 0,
        history_message_count: chatSelectors.activeBaseChats(store).length,
        message: store.inputMessage,
        message_length: store.inputMessage.length,
        message_type: messageType,
        selected_model: agentSelectors.currentAgentModel(agentStore),
        session_id: store.activeId || 'inbox', // 当前活跃的会话ID
        user_id: userStore.user?.id || 'anonymous',
      },
    });
    // const hasSystemRole = agentSelectors.hasSystemRole(useAgentStore.getState());
    // const agentSetting = useAgentStore.getState().agentSettingInstance;

    // // if there is a system role, then we need to use agent setting instance to autocomplete agent meta
    // if (hasSystemRole && !!agentSetting) {
    //   agentSetting.autocompleteAllMeta();
    // }
  }, []);

  return useMemo(() => ({ canSend, send }), [canSend]);
};
