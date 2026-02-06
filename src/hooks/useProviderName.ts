import { DEFAULT_MODEL_PROVIDER_LIST } from '@/config/modelProviders';

/**
 * Returns a label for provider name.
 * To enhance privacy and simplify UI, infrastructure-specific provider names like
 * "Vertex AI", "Vercel AI Gateway", and "Groq" are masked as generic "Dịch vụ AI".
 * Brand providers like "OpenAI" or "Anthropic" remain visible.
 */
export const useProviderName = (provider: string) => {
  const infrastructureProviders = ['vercelaigateway', 'vertexai', 'groq'];

  if (infrastructureProviders.includes(provider)) {
    return 'Dịch vụ AI';
  }

  // Fallback to the provider's display name from the config
  const providerCard = DEFAULT_MODEL_PROVIDER_LIST.find((p) => p.id === provider);
  return providerCard?.name || provider;
};
