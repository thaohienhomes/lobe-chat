'use client';

import { ForwardedRef, memo, useImperativeHandle } from 'react';
import { createStoreUpdater } from 'zustand-utils';

import { ChatInputEditor, useChatInputEditor } from './hooks/useChatInputEditor';
import { PublicState, useStoreApi } from './store';

export interface StoreUpdaterProps extends Partial<PublicState> {
  chatInputEditorRef?: ForwardedRef<ChatInputEditor | null>;
}

const StoreUpdater = memo<StoreUpdaterProps>(
  ({
    chatInputEditorRef,
    mobile,
    sendButtonProps,
    leftActions,
    rightActions,
    onSend,
    onMarkdownContentChange,
    sendMenu,
  }) => {
    const storeApi = useStoreApi();
    const useStoreUpdater = createStoreUpdater(storeApi);
    const editor = useChatInputEditor();

    useStoreUpdater('mobile', mobile ?? undefined);
    useStoreUpdater('sendMenu', sendMenu ?? undefined);
    useStoreUpdater('leftActions', leftActions ?? undefined);
    useStoreUpdater('rightActions', rightActions ?? undefined);

    useStoreUpdater('sendButtonProps', sendButtonProps);
    useStoreUpdater('onSend', onSend);
    useStoreUpdater('onMarkdownContentChange', onMarkdownContentChange);

    useImperativeHandle(chatInputEditorRef, () => editor);

    return null;
  },
);

export default StoreUpdater;
