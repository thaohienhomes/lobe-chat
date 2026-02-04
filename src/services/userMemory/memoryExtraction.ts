/**
 * User Memory Extraction Service
 * Server-side LLM-based extraction of user memories from chat messages
 */
import { MemoryCategory } from '@lobechat/database/schemas';

/**
 * Normalize category string to valid MemoryCategory
 */
function normalizeCategory(category: string): MemoryCategory {
  const normalized = category.toLowerCase().replaceAll(/\s+/g, '_');

  const validCategories: MemoryCategory[] = [
    'preference',
    'fact',
    'interest',
    'communication_style',
    'goal',
    'context',
  ];

  if (validCategories.includes(normalized as MemoryCategory)) {
    return normalized as MemoryCategory;
  }

  // Default to context for unknown categories
  return 'context';
}

/**
 * Prompt template for extracting memories from chat messages
 */
export const MEMORY_EXTRACTION_PROMPT = `You are a memory extraction system for a personal AI assistant.
Your task is to identify important information about the USER from their chat messages.

Extract memories in these categories:
- preference: User likes/dislikes (food, activities, communication style)
- fact: Personal facts (name, location, occupation, family)
- interest: Topics they're interested in
- communication_style: How they prefer to communicate
- goal: Their objectives or aspirations
- context: Relevant situational context

Rules:
1. Only extract CLEAR, EXPLICIT information the user has shared
2. Do not infer or assume information
3. Focus on information that would be useful for future conversations
4. Rate importance 1-10 (10 = critical personal info like name)
5. Keep each memory concise (under 200 characters)

Respond in JSON format:
{
  "memories": [
    {
      "category": "preference|fact|interest|communication_style|goal|context",
      "content": "The extracted memory",
      "importance": 1-10
    }
  ]
}

If no meaningful memories can be extracted, return: { "memories": [] }`;

/**
 * Format messages for extraction
 */
export function formatMessagesForExtraction(
  messages: Array<{ content: string; role: string }>,
): string {
  return messages
    .filter((m) => m.role === 'user' && m.content.trim().length > 10)
    .map((m) => `USER: ${m.content}`)
    .join('\n\n');
}

/**
 * Parse memory extraction response from LLM
 */
export function parseMemoryExtractionResponse(response: string): Array<{
  category: MemoryCategory;
  content: string;
  importance: number;
}> {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/{[\S\s]*}/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.memories || !Array.isArray(parsed.memories)) {
      return [];
    }

    // Validate and normalize each memory
    return parsed.memories
      .filter(
        (m: { category?: string; content?: string; importance?: number }) =>
          m.category && m.content && typeof m.importance === 'number',
      )
      .map((m: { category: string; content: string; importance: number }) => ({
        category: normalizeCategory(m.category),
        content: m.content.slice(0, 500), // Limit content length
        importance: Math.min(10, Math.max(1, Math.round(m.importance))),
      }));
  } catch (error) {
    console.error('[MemoryExtraction] Failed to parse response:', error);
    return [];
  }
}

/**
 * Check if a message contains potential memory-worthy information
 * Quick check to avoid unnecessary LLM calls
 */
export function hasMemoryPotential(content: string): boolean {
  // Skip very short messages
  if (content.length < 30) return false;

  // Look for personal information patterns
  const patterns = [
    /\bi\s+(am|like|prefer|love|hate|work|live|want)/i,
    /\bmy\s+(name|job|work|family|wife|husband|child|hobby)/i,
    /\bi('m|'ve)\s+(a|an|been)/i,
    /\bplease\s+(call|remember)/i,
    /\bdon't\s+(like|want|prefer)/i,
    /\balways|never|usually/i,
    /\bfavorite|favourite/i,
    /\bborn\s+in|from\s+\w+/i,
  ];

  return patterns.some((p) => p.test(content));
}
