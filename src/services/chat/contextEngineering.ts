import { INBOX_SESSION_ID, isDesktop, isServerMode } from '@lobechat/const';
import {
  type AgentState,
  ContextEngine,
  HistorySummaryProvider,
  HistoryTruncateProcessor,
  InboxGuideProvider,
  InputTemplateProcessor,
  MessageCleanupProcessor,
  MessageContentProcessor,
  PlaceholderVariablesProcessor,
  SystemRoleInjector,
  ToolCallProcessor,
  ToolMessageReorder,
  ToolSystemRoleProvider,
} from '@lobechat/context-engine';
import { historySummaryPrompt } from '@lobechat/prompts';
import { ChatMessage, OpenAIChatMessage } from '@lobechat/types';

import { INBOX_GUIDE_SYSTEMROLE } from '@/const/guide';
import { getToolStoreState } from '@/store/tool';
import { toolSelectors } from '@/store/tool/selectors';
import { VARIABLE_GENERATORS } from '@/utils/client/parserPlaceholder';
import { genToolCallingName } from '@/utils/toolCall';

import { isCanUseFC, isCanUseVideo, isCanUseVision } from './helper';

/**
 * Default Phở Chat personality prompt.
 * Applied when the user hasn't configured a custom system role for their agent.
 * Designed to make responses feel more human, warm, and Perplexity-like.
 */
const PHO_CHAT_DEFAULT_SYSTEM_PROMPT = `You are Phở Chat — a helpful, warm, and knowledgeable AI assistant. Your personality is friendly and conversational, like a smart friend who genuinely enjoys helping.

<response_guidelines>
- Be concise but thorough. Start with a direct answer, then add helpful context.
- Use clear structure: headings, bullet points, or numbered lists when it helps readability.
- When explaining complex topics, use analogies or examples the user can relate to.
- Show genuine interest in the user's question — acknowledge their context when relevant.
- Match the user's language (Vietnamese, English, or mixed) naturally.
- For factual claims, mention your confidence level or note when information might be outdated.
</response_guidelines>

<follow_up>
End your responses with 1-2 natural follow-up suggestions when appropriate. Frame them as helpful next steps, not generic questions. Examples:
- "Bạn có muốn tôi giải thích thêm về phần [X] không?"
- "Nếu cần, tôi có thể giúp bạn [specific action] nha."
- "Would you like me to dive deeper into [specific aspect]?"
Skip follow-ups for simple factual answers or when the conversation naturally concludes.
</follow_up>

<tone>
- Warm but professional — not overly casual or robotic
- Use emoji sparingly (1-2 per response max) for warmth, not decoration
- Avoid filler phrases like "Certainly!", "Of course!", "Great question!"
- Be direct and authentic
</tone>`;


interface ContextEngineeringContext {
  enableHistoryCount?: boolean;
  historyCount?: number;
  historySummary?: string;
  inputTemplate?: string;
  isWelcomeQuestion?: boolean;
  messages: ChatMessage[];
  model: string;
  provider: string;
  sessionId?: string;
  systemRole?: string;
  tools?: string[];
}

export const contextEngineering = async ({
  messages = [],
  tools,
  model,
  provider,
  systemRole,
  inputTemplate,
  enableHistoryCount,
  historyCount,
  historySummary,
  sessionId,
  isWelcomeQuestion,
}: ContextEngineeringContext): Promise<OpenAIChatMessage[]> => {
  // If user hasn't set a custom system role, use Phở Chat's default personality
  const effectiveSystemRole = systemRole?.trim()
    ? systemRole
    : PHO_CHAT_DEFAULT_SYSTEM_PROMPT;

  const pipeline = new ContextEngine({
    pipeline: [
      // 1. History truncation (MUST be first, before any message injection)
      new HistoryTruncateProcessor({ enableHistoryCount, historyCount }),

      // --------- Create system role injection providers

      // 2. System role injection (agent's system role or Phở Chat default)
      new SystemRoleInjector({ systemRole: effectiveSystemRole }),

      // 3. Inbox guide system role injection
      new InboxGuideProvider({
        inboxGuideSystemRole: INBOX_GUIDE_SYSTEMROLE,
        inboxSessionId: INBOX_SESSION_ID,
        isWelcomeQuestion: isWelcomeQuestion,
        sessionId: sessionId,
      }),

      // 4. Tool system role injection
      new ToolSystemRoleProvider({
        getToolSystemRoles: (tools) => toolSelectors.enabledSystemRoles(tools)(getToolStoreState()),
        isCanUseFC,
        model,
        provider,
        tools,
      }),

      // 5. History summary injection
      new HistorySummaryProvider({
        formatHistorySummary: historySummaryPrompt,
        historySummary: historySummary,
      }),

      // Create message processing processors

      // 6. Input template processing
      new InputTemplateProcessor({
        inputTemplate,
      }),

      // 7. Placeholder variables processing
      new PlaceholderVariablesProcessor({ variableGenerators: VARIABLE_GENERATORS }),

      // 8. Message content processing
      new MessageContentProcessor({
        fileContext: { enabled: isServerMode, includeFileUrl: !isDesktop },
        isCanUseVideo,
        isCanUseVision,
        model,
        provider,
      }),

      // 9. Tool call processing
      new ToolCallProcessor({ genToolCallingName, isCanUseFC, model, provider }),

      // 10. Tool message reordering
      new ToolMessageReorder(),

      // 11. Message cleanup (final step, keep only necessary fields)
      new MessageCleanupProcessor(),
    ],
  });

  const initialState: AgentState = { messages, model, provider, systemRole, tools };

  const result = await pipeline.process({
    initialState,
    maxTokens: 10_000_000,
    messages,
    model,
  });

  return result.messages;
};
