import { ModelProvider } from '@lobechat/model-runtime';
import { ProviderConfig } from '@lobechat/types';
import { extractEnabledModels, transformToAiModelList } from '@lobechat/utils';
import * as AiModels from 'model-bank';
import { AiFullModelCard } from 'model-bank';

import { getLLMConfig } from '@/envs/llm';

interface ProviderSpecificConfig {
  enabled?: boolean;
  enabledKey?: string;
  fetchOnClient?: boolean;
  modelListKey?: string;
  withDeploymentName?: boolean;
}

/**
 * This function generates provider configs where:
 * - enabled = true only if the provider has an API key
 * - Other providers are disabled by default (enabled = false)
 */
export const genServerAiProvidersConfig = async (
  specificConfig: Record<any, ProviderSpecificConfig>,
) => {
  const llmConfig = getLLMConfig() as Record<string, any>;

  // 并发处理所有 providers
  const providerConfigs = await Promise.all(
    Object.values(ModelProvider).map(async (provider) => {
      const providerUpperCase = provider.toUpperCase();
      const aiModels = AiModels[provider as keyof typeof AiModels] as AiFullModelCard[];

      // Gracefully handle missing provider models instead of throwing
      if (!aiModels) {
        console.warn(
          `[genServerAiProvidersConfig] Provider [${provider}] not found in aiModels, skipping...`,
        );
        return {
          config: { enabled: false, enabledModels: [], serverModelLists: [] },
          provider,
        };
      }

      const providerConfig = specificConfig[provider as keyof typeof specificConfig] || {};
      const modelString =
        process.env[providerConfig.modelListKey ?? `${providerUpperCase}_MODEL_LIST`];

      // 并发处理 extractEnabledModels 和 transformToAiModelList
      const [enabledModels, serverModelLists] = await Promise.all([
        extractEnabledModels(provider, modelString, providerConfig.withDeploymentName || false),
        transformToAiModelList({
          defaultModels: aiModels || [],
          modelString,
          providerId: provider,
          withDeploymentName: providerConfig.withDeploymentName || false,
        }),
      ]);

      // Determine if provider should be enabled
      // Priority: specificConfig.enabled > env var ENABLED_<PROVIDER>
      const isEnabled =
        typeof providerConfig.enabled !== 'undefined'
          ? providerConfig.enabled
          : llmConfig[providerConfig.enabledKey || `ENABLED_${providerUpperCase}`];

      return {
        config: {
          enabled: isEnabled,
          enabledModels,
          serverModelLists,
          ...(providerConfig.fetchOnClient !== undefined && {
            fetchOnClient: providerConfig.fetchOnClient,
          }),
        },
        provider,
      };
    }),
  );

  // 将结果转换为对象
  const config = {} as Record<string, ProviderConfig>;
  for (const { provider, config: providerConfig } of providerConfigs) {
    config[provider] = providerConfig;
  }

  return config;
};
