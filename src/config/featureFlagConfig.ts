/**
 * Feature Flag Configuration for Language Model Providers
 *
 * This file defines the mapping between providers and their feature flags.
 * Use these flags in PostHog to control provider visibility.
 */

// Provider Group Definitions
export const PROVIDER_GROUPS = {
  aggregators: {
    description: 'Multi-model API gateways',
    flag: 'llm-group-aggregators',
    providers: ['openrouter', 'vercelaigateway', 'togetherai', 'fireworksai'],
  },
  china: {
    description: 'China-based AI providers',
    flag: 'llm-group-china',
    providers: ['qwen', 'zhipu', 'deepseek', 'baichuan', 'moonshot', 'hunyuan', 'spark', 'wenxin'],
  },
  fast: {
    description: 'Speed-optimized inference providers',
    flag: 'llm-group-fast',
    providers: ['groq', 'cerebras', 'sambanova'],
  },
  openSource: {
    description: 'Self-hosted and open-source models',
    flag: 'llm-group-open-source',
    providers: ['ollama', 'vllm', 'huggingface', 'xinference'],
  },
  premium: {
    description: 'High-quality, paid API providers',
    flag: 'llm-group-premium',
    providers: ['openai', 'anthropic', 'google', 'vertexai'],
  },
} as const;

// Individual Provider Flag Mapping
export const PROVIDER_FLAGS: Record<string, string> = {
  anthropic: 'llm-provider-anthropic',
  azure: 'llm-provider-azure',
  bedrock: 'llm-provider-bedrock',
  deepseek: 'llm-provider-deepseek',
  google: 'llm-provider-google',
  groq: 'llm-provider-groq',
  mistral: 'llm-provider-mistral',
  ollama: 'llm-provider-ollama',
  openai: 'llm-provider-openai',
  openrouter: 'llm-provider-openrouter',
  perplexity: 'llm-provider-perplexity',
  vertexai: 'llm-provider-vertexai',
  // Add more as needed
};

/**
 * Get the feature flag name for a provider.
 * Returns undefined if no specific flag is configured (provider is always visible).
 */
export const getProviderFlag = (providerId: string): string | undefined => {
  return PROVIDER_FLAGS[providerId.toLowerCase()];
};

/**
 * Get the group flag for a provider (if it belongs to a group).
 */
export const getProviderGroupFlag = (providerId: string): string | undefined => {
  const id = providerId.toLowerCase();
  for (const group of Object.values(PROVIDER_GROUPS)) {
    if ((group.providers as readonly string[]).includes(id)) {
      return group.flag;
    }
  }
  return undefined;
};
