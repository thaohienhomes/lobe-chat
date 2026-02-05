import { genUserLLMConfig } from './genUserLLMConfig';

/**
 * Default LLM Configuration for pho.chat
 *
 * UPDATED Feb 2026: Now using Vertex AI as primary provider
 * - Default model: gemini-2.5-flash (via Vertex AI)
 * - Vertex AI provides enterprise-grade access to Gemini, Claude, and more
 */
export const DEFAULT_LLM_CONFIG = genUserLLMConfig({
  lmstudio: {
    fetchOnClient: true,
  },
  ollama: {
    enabled: true,
    fetchOnClient: true,
  },
  // Vertex AI as primary provider
  vertexai: {
    enabled: true,
  },
});

/**
 * Default model for pho.chat users
 * Using Vertex AI model ID: gemini-2.5-flash
 * Fast, efficient model with 1M context window
 */
export const DEFAULT_MODEL = 'gemini-2.5-flash';

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
export const DEFAULT_EMBEDDING_PROVIDER = 'openai';

export const DEFAULT_RERANK_MODEL = 'rerank-english-v3.0';
export const DEFAULT_RERANK_PROVIDER = 'cohere';
export const DEFAULT_RERANK_QUERY_MODE = 'full_text';

/**
 * Default provider for pho.chat
 * Vertex AI as primary provider for enterprise AI access
 */
export const DEFAULT_PROVIDER = 'vertexai';
