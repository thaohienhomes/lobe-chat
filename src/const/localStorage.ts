/**
 * LocalStorage keys used throughout the application
 */

// Pending message storage - used to preserve user message during auth flow
export const PENDING_MESSAGE_KEY = 'PHOCHAT_PENDING_MESSAGE';

// Auth prompt dismissed state - used to track if user dismissed the auth prompt
export const AUTH_PROMPT_DISMISSED_KEY = 'PHOCHAT_AUTH_PROMPT_DISMISSED';

/**
 * Type for pending message data stored in localStorage
 */
export interface PendingMessageData {
  /** Whether the message had files attached (files cannot be preserved) */
  hasFiles: boolean;
  /** The text content of the message */
  message: string;
  /** Timestamp when the message was saved */
  timestamp: number;
}

/**
 * Get pending message from localStorage
 */
export const getPendingMessage = (): PendingMessageData | null => {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(PENDING_MESSAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data) as PendingMessageData;

    // Check if message is still valid (within 30 minutes)
    const THIRTY_MINUTES = 30 * 60 * 1000;
    if (Date.now() - parsed.timestamp > THIRTY_MINUTES) {
      localStorage.removeItem(PENDING_MESSAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(PENDING_MESSAGE_KEY);
    return null;
  }
};

/**
 * Clear pending message from localStorage
 */
export const clearPendingMessage = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PENDING_MESSAGE_KEY);
};

