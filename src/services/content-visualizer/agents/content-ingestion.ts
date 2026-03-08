/**
 * Agent 1: ContentIngestion
 * Fetches, parses, and structures input content into normalized ParsedContent format.
 * Routes to the appropriate parser based on input type.
 */

import type { ContentSource, ParsedContent } from '../types/parsed-content';
import { extractArxivId, parseArxivUrl } from '../parsers/arxiv-parser';
import { parsePdf } from '../parsers/pdf-parser';
import { fromLlmOutput, parseText, TEXT_STRUCTURING_PROMPT, TOPIC_GENERATION_PROMPT } from '../parsers/text-parser';
import { parseUrl } from '../parsers/url-parser';

/**
 * User input for the content ingestion pipeline.
 */
export interface ContentIngestionInput {
  /** File path for uploaded PDFs */
  filePath?: string;
  /** Language preference */
  language?: 'en' | 'vi' | string;
  /** Raw text content */
  text?: string;
  /** Topic prompt for content generation */
  topic?: string;
  /** URL to fetch content from (arXiv, web article, etc.) */
  url?: string;
}

/**
 * LLM call function signature — injected by the orchestrator.
 * Allows the agent to remain decoupled from any specific LLM SDK.
 */
export type LlmCallFn = (systemPrompt: string, userMessage: string) => Promise<string>;

/**
 * Detect content source type from user input.
 */
function detectSourceType(input: ContentIngestionInput): ContentSource {
  if (input.topic) return 'topic';
  if (input.filePath?.endsWith('.pdf')) return 'pdf';
  if (input.url) {
    if (extractArxivId(input.url)) return 'arxiv';
    return 'url';
  }
  return 'text';
}

/**
 * Parse LLM JSON response, stripping markdown code fences if present.
 */
function parseLlmJson<T>(response: string): T {
  const cleaned = response
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

/**
 * ContentIngestion agent: routes input to the appropriate parser
 * and returns normalized ParsedContent.
 *
 * @param input - User-provided content input
 * @param llmCall - Optional LLM function for text/topic parsing (injected by orchestrator)
 * @returns Structured ParsedContent ready for downstream agents
 */
export async function runContentIngestion(
  input: ContentIngestionInput,
  llmCall?: LlmCallFn,
): Promise<ParsedContent> {
  const sourceType = detectSourceType(input);

  switch (sourceType) {
    case 'arxiv': {
      return parseArxivUrl(input.url!);
    }

    case 'pdf': {
      return parsePdf(input.filePath!);
    }

    case 'url': {
      return parseUrl(input.url!);
    }

    case 'topic': {
      if (!llmCall) {
        throw new Error('LLM call function required for topic-based content generation');
      }
      const response = await llmCall(
        TOPIC_GENERATION_PROMPT,
        `Generate educational content about: ${input.topic}\nLanguage: ${input.language || 'en'}`,
      );
      const structured = parseLlmJson<{
        abstract?: string;
        difficulty: 'advanced' | 'beginner' | 'intermediate';
        language: string;
        sections: Array<{ content: string; title: string }>;
        title: string;
      }>(response);
      return fromLlmOutput(structured, 'topic');
    }

    case 'text': {
      const rawText = input.text;
      if (!rawText) throw new Error('No text content provided');

      // Use LLM for better structuring if available
      if (llmCall) {
        try {
          const response = await llmCall(TEXT_STRUCTURING_PROMPT, rawText);
          const structured = parseLlmJson<{
            abstract?: string;
            difficulty: 'advanced' | 'beginner' | 'intermediate';
            language: string;
            sections: Array<{ content: string; title: string }>;
            title: string;
          }>(response);
          return fromLlmOutput(structured, 'text');
        } catch {
          // Fall back to heuristic parsing
          return parseText(rawText);
        }
      }

      return parseText(rawText);
    }
  }
}
