// Logical model mapping service

export interface LogicalModelConfig {
  id: string;
  providers: {
    modelId: string;
    provider: string;
  }[];
}

class PhoGatewayService {
  private logicalModels: Record<string, LogicalModelConfig> = {
    // Legacy compatibility
    'llama-3.1-8b-instant': {
      id: 'llama-3.1-8b-instant',
      providers: [
        { modelId: 'llama-3.1-8b-instant', provider: 'groq' },
        { modelId: '@cf/meta/llama-3.1-8b-instruct', provider: 'cloudflare' },
        { modelId: 'google/gemini-2.0-flash', provider: 'vercelaigateway' },
      ],
    },

    'pho-fast': {
      id: 'pho-fast',
      providers: [
        { modelId: 'llama-3.1-8b-instant', provider: 'groq' },
        { modelId: 'llama3.1-8b', provider: 'cerebras' },
        { modelId: 'google/gemini-2.0-flash', provider: 'vercelaigateway' },
      ],
    },

    'pho-pro': {
      id: 'pho-pro',
      providers: [
        { modelId: 'llama-3.3-70b-versatile', provider: 'groq' },
        { modelId: 'google/gemini-2.5-flash', provider: 'vercelaigateway' },
      ],
    },

    'pho-smart': {
      id: 'pho-smart',
      providers: [
        { modelId: 'llama3.1-70b', provider: 'cerebras' },
        { modelId: 'llama-3.3-70b-versatile', provider: 'groq' },
        { modelId: 'google/gemini-2.5-flash', provider: 'vercelaigateway' },
      ],
    },

    'pho-vision': {
      id: 'pho-vision',
      providers: [{ modelId: 'google/gemini-2.5-flash', provider: 'vercelaigateway' }],
    },

    // ── New Open Models (Tier 1/2) ─────────────────────────────────────────
    // These are exposed in the phochat picker via phochat.ts logical entries.

    'gemma-3-27b-it': {
      id: 'gemma-3-27b-it',
      providers: [
        { modelId: 'gemma-3-27b-it', provider: 'groq' },
        { modelId: 'google/gemini-2.0-flash', provider: 'vercelaigateway' }, // fallback
      ],
    },

    'llama-4-scout-17b': {
      id: 'llama-4-scout-17b',
      providers: [
        { modelId: 'meta-llama/llama-4-scout-17b-16e-instruct', provider: 'groq' },
        { modelId: 'google/gemini-2.0-flash', provider: 'vercelaigateway' }, // fallback
      ],
    },

    'kimi-k2': {
      id: 'kimi-k2',
      providers: [
        { modelId: 'moonshotai/Kimi-K2-Instruct', provider: 'togetherai' },
        { modelId: 'google/gemini-2.5-flash', provider: 'vercelaigateway' }, // fallback
      ],
    },
  };

  /**
   * Resolve a model ID to a list of prioritized providers
   */
  resolveProviderList(modelId: string, provider?: string) {
    // If it's a logical model ID, return its configured list
    if (this.logicalModels[modelId]) {
      return this.logicalModels[modelId].providers;
    }

    // Default: Return the requested provider/model as the only option
    // (Existing behavior fallback)
    return [{ modelId, provider: provider || 'openai' }];
  }

  /**
   * Get a failover list for a specific model+provider combo
   * Used for backward compatibility with specific model IDs
   */
  getFailoverList(modelId: string, provider: string) {
    // If we have a logical mapping for this specific model ID, return it
    if (this.logicalModels[modelId]) {
      return this.logicalModels[modelId].providers;
    }

    // Default failover strategies for known providers
    switch (provider) {
      case 'groq':
      case 'cerebras':
      case 'fireworksai':
      case 'togetherai': {
        return [
          { modelId, provider },
          { modelId: this.mapToCloudflare(modelId), provider: 'cloudflare' },
        ];
      }
      default: {
        return [{ modelId, provider }];
      }
    }
  }

  /**
   * Check if a provider is explicitly disabled (e.g. for re-routing)
   */
  isProviderDisabled(provider: string): boolean {
    const DISABLED_PROVIDERS = new Set<string>([]);
    return DISABLED_PROVIDERS.has(provider);
  }

  /**
   * Remap a provider and model if necessary.
   *
   * Two responsibilities:
   * 1. Logical models (pho-pro, pho-fast, etc.) → resolve to their primary
   *    configured provider so the runtime gets the right API key.
   *    The modelId is kept as the logical name so resolveProviderList()
   *    can still return the full failover chain later.
   * 2. Real vendor models from disabled direct providers (google, openai, …)
   *    → redirect to Vercel AI Gateway with a provider-prefixed modelId.
   */
  remapProvider(provider: string, modelId: string): { modelId: string; provider: string } {
    // ── 1. Logical model resolution ──────────────────────────────
    // If the requested model is a logical model (e.g. 'pho-pro'),
    // route to its primary provider (e.g. 'groq') so runtime init
    // picks up the correct API key.  Keep modelId as-is so
    // resolveProviderList() can still look it up for failover.
    if (this.logicalModels[modelId]) {
      const primary = this.logicalModels[modelId].providers[0];
      return { modelId, provider: primary.provider };
    }

    // ── 2. Disabled-provider remap ───────────────────────────────
    // Providers that are disabled as direct API connections
    // and should be routed through Vercel AI Gateway instead.
    const REMAP_TO_VERCEL = new Set([
      'google', // No GOOGLE_API_KEY configured
      'openai', // OpenRouter disabled; direct OpenAI not used
      'anthropic', // No ANTHROPIC_API_KEY configured
      'deepseek', // Route through gateway for reliability
      'xai', // No XAI_API_KEY configured
      'vertexai', // VertexAI disabled — use Gateway instead
    ]);

    if (REMAP_TO_VERCEL.has(provider)) {
      // Vercel AI Gateway expects provider-prefixed model IDs
      // e.g., gemini-2.5-flash → google/gemini-2.5-flash
      // For vertexai, remap to google/ prefix
      const gatewayPrefix = provider === 'vertexai' ? 'google' : provider;
      const prefixedModelId = modelId.includes('/') ? modelId : `${gatewayPrefix}/${modelId}`;

      return { modelId: prefixedModelId, provider: 'vercelaigateway' };
    }

    return { modelId, provider };
  }

  private mapToCloudflare(modelId: string): string {
    if (modelId.includes('70b')) return '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
    if (modelId.includes('8b')) return '@cf/meta/llama-3.1-8b-instruct';
    return '@cf/meta/llama-3.1-8b-instruct'; // Default fallback
  }
}

export const phoGatewayService = new PhoGatewayService();
