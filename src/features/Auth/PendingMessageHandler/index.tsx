'use client';

import { App } from 'antd';
import { memo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { clearPendingMessage, getPendingMessage } from '@/const/localStorage';
import { useChatStore } from '@/store/chat';
import { useUserStore } from '@/store/user';

/**
 * PendingMessageHandler
 *
 * This component handles restoring pending messages after a user authenticates.
 * When an unauthenticated user tries to send a message, it's saved to localStorage.
 * After successful authentication, this component:
 * 1. Checks for a pending message in localStorage
 * 2. Populates the chat input with the message
 * 3. Shows a notification to the user
 * 4. Clears the pending message from storage
 */
const PendingMessageHandler = memo(() => {
  const { t } = useTranslation('auth');
  const { message: messageApi } = App.useApp();
  const hasProcessed = useRef(false);

  const [isSignedIn, isLoaded] = useUserStore((s) => [s.isSignedIn, s.isLoaded]);
  const updateInputMessage = useChatStore((s) => s.updateInputMessage);

  useEffect(() => {
    // Only process once per mount and only when auth is loaded and user is signed in
    if (hasProcessed.current || !isLoaded || !isSignedIn) return;

    const pendingMessage = getPendingMessage();
    if (!pendingMessage) return;

    // Mark as processed to prevent duplicate handling
    hasProcessed.current = true;

    // Restore the message to the input
    updateInputMessage(pendingMessage.message);

    // Clear the pending message from storage
    clearPendingMessage();

    // Show notification to user
    if (pendingMessage.hasFiles) {
      // If there were files, notify user they need to re-attach
      messageApi.info({
        content: t('pendingMessage.restoredWithFiles', {
          defaultValue:
            'Your message has been restored. Please re-attach any files you wanted to send.',
        }),
        duration: 5,
      });
    } else {
      messageApi.success({
        content: t('pendingMessage.restored', {
          defaultValue: 'Your message has been restored. Press send to continue.',
        }),
        duration: 3,
      });
    }
  }, [isLoaded, isSignedIn, updateInputMessage, messageApi, t]);

  // This component doesn't render anything
  return null;
});

PendingMessageHandler.displayName = 'PendingMessageHandler';

export default PendingMessageHandler;

