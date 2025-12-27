import { genUserLLMConfig } from './genUserLLMConfig';

/**
 * Default LLM Configuration for pho.chat
 *
 * Per PRICING_MASTERPLAN.md and src/config/pricing.ts:
 * - Free tier (Phở Không Người Lái) uses OpenRouter as primary provider
 * - Default model: openai/gpt-4o-mini (Tier 1 model via OpenRouter)
 * - OpenRouter aggregates multiple providers with unified API
 */
export const DEFAULT_LLM_CONFIG = genUserLLMConfig({
  lmstudio: {
    fetchOnClient: true,
  },
  ollama: {
    enabled: true,
    fetchOnClient: true,
  },
  // OpenRouter as primary provider for free tier
  openrouter: {
    enabled: true,
  },
});

/**
 * Default model for free tier users
 * Using OpenRouter model ID format: openai/gpt-4o-mini
 * This is a Tier 1 model available to all users including free tier
 */
export const DEFAULT_MODEL = 'openai/gpt-4o-mini';

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
export const DEFAULT_EMBEDDING_PROVIDER = 'openai';

export const DEFAULT_RERANK_MODEL = 'rerank-english-v3.0';
export const DEFAULT_RERANK_PROVIDER = 'cohere';
export const DEFAULT_RERANK_QUERY_MODE = 'full_text';

/**
 * Default provider for pho.chat
 * OpenRouter as primary provider to aggregate multiple AI providers
 * Configured via OPENROUTER_API_KEY environment variable
 */
export const DEFAULT_PROVIDER = 'openrouter';
