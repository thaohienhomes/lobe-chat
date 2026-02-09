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
            ],
        },


        'pho-fast': {
            id: 'pho-fast',
            providers: [
                { modelId: 'llama-3.1-8b-instant', provider: 'groq' },
                { modelId: 'llama3.1-8b', provider: 'cerebras' },
                { modelId: '@cf/meta/llama-3.1-8b-instruct', provider: 'cloudflare' },
            ],
        },


        'pho-pro': {
            id: 'pho-pro',
            providers: [
                { modelId: 'llama-3.3-70b-versatile', provider: 'groq' },
                { modelId: 'accounts/fireworks/models/llama-v3p1-70b-instruct', provider: 'fireworksai' },
                { modelId: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', provider: 'cloudflare' },
            ],
        },


        'pho-smart': {
            id: 'pho-smart',
            providers: [
                { modelId: 'llama3.1-70b', provider: 'cerebras' },
                { modelId: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', provider: 'togetherai' },
                { modelId: 'llama-3.3-70b-versatile', provider: 'groq' },
            ],
        },


        'pho-vision': {
            id: 'pho-vision',
            providers: [
                { modelId: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo', provider: 'togetherai' },
                { modelId: 'accounts/fireworks/models/llama-v3p2-90b-vision-instruct', provider: 'fireworksai' },
                { modelId: 'google/gemini-2.0-flash', provider: 'vercelaigateway' },
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
     * Remap a provider and model if necessary
     */
    remapProvider(provider: string, modelId: string): { modelId: string, provider: string; } {
        // No current remaps needed as VertexAI and OpenRouter are removed
        return { modelId, provider };
    }

    private mapToCloudflare(modelId: string): string {
        if (modelId.includes('70b')) return '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
        if (modelId.includes('8b')) return '@cf/meta/llama-3.1-8b-instruct';
        return '@cf/meta/llama-3.1-8b-instruct'; // Default fallback
    }
}

export const phoGatewayService = new PhoGatewayService();
