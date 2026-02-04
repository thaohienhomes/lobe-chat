/**
 * User Memory Chat Integration
 * Handles automatic memory extraction from chat messages with LLM support
 */
import { StateCreator } from 'zustand/vanilla';

import { lambdaClient } from '@/libs/trpc/client';
import { quickAgenticCheck } from '@/services/agentic';
import {
  MEMORY_EXTRACTION_PROMPT,
  hasMemoryPotential,
  parseMemoryExtractionResponse,
} from '@/services/userMemory/memoryExtraction';
import { useAgenticStore } from '@/store/agentic';
import { chatSelectors } from '@/store/chat/selectors';
import { ChatStore } from '@/store/chat/store';

/**
 * Fallback extraction without LLM
 * Stores raw message content as context memories
 */
async function fallbackExtraction(
  messages: Array<{ content?: string }>,
  topicId: string | undefined,
  get: () => ChatStore,
): Promise<void> {
  const messageContents = messages.map((m) => m.content || '').filter((c) => c.length > 30);

  if (messageContents.length === 0) return;

  const activeTopicId = get().activeTopicId;

  await lambdaClient.userMemory.batchCreate.mutate(
    messageContents.slice(0, 3).map((content) => ({
      category: 'context' as const,
      content: content.slice(0, 200),
      importance: 3,
      sourceTopicId: topicId || activeTopicId || undefined,
    })),
  );
}

export interface UserMemoryAction {
  /**
   * Check if message should trigger agentic mode
   */
  checkAgenticTrigger: (message: string) => boolean;

  /**
   * Extract and save memories from recent messages using LLM
   */
  extractMemoriesFromChat: (topicId?: string) => Promise<void>;

  /**
   * Get user memories for context injection
   */
  getUserMemoriesForPrompt: () => Promise<string>;
}

export const userMemoryAction: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  UserMemoryAction
> = (_set, get) => ({
  checkAgenticTrigger: (message) => {
    const shouldTrigger = quickAgenticCheck(message);

    if (shouldTrigger) {
      // Update agentic store
      useAgenticStore.getState().setIsPlanning(true);
    }

    return shouldTrigger;
  },

  extractMemoriesFromChat: async (topicId) => {
    try {
      // Use selector to get current messages
      const messages = chatSelectors.activeBaseChats(get());

      // Get user messages only
      const userMessages = messages.filter((m: { role: string }) => m.role === 'user');

      // Need at least 2 user messages to extract memories
      if (userMessages.length < 2) return;

      // Get last 10 user messages for extraction
      const recentUserMessages = userMessages.slice(-10);

      // Quick check: do any messages have memory potential?
      const messagesWithPotential = recentUserMessages.filter((m: { content?: string }) =>
        hasMemoryPotential(m.content || ''),
      );

      if (messagesWithPotential.length === 0) {
        console.log('[UserMemory] No memory-worthy content detected');
        return;
      }

      // Call LLM for extraction via internal API
      const response = await fetch('/api/memory/extract', {
        body: JSON.stringify({
          messages: messagesWithPotential
            .map((m: { content?: string }) => m.content || '')
            .join('\n\n'),
          prompt: MEMORY_EXTRACTION_PROMPT,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        // Fallback to simple extraction if LLM call fails
        console.warn('[UserMemory] LLM extraction failed, using fallback');
        await fallbackExtraction(messagesWithPotential, topicId, get);
        return;
      }

      const extractionResult = await response.text();

      // Parse and save memories
      const memories = parseMemoryExtractionResponse(extractionResult);

      if (memories.length > 0) {
        const activeTopicId = get().activeTopicId;
        await lambdaClient.userMemory.batchCreate.mutate(
          memories.map((m) => ({
            ...m,
            sourceTopicId: topicId || activeTopicId || undefined,
          })),
        );
        console.log(`[UserMemory] Saved ${memories.length} memories`);
      }
    } catch (error) {
      console.error('[UserMemory] Extraction failed:', error);
    }
  },

  getUserMemoriesForPrompt: async () => {
    try {
      return await lambdaClient.userMemory.getForPrompt.query({ limit: 10 });
    } catch {
      return '';
    }
  },
});
