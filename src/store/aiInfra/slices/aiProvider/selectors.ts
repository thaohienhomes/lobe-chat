import { DEFAULT_MODEL_PROVIDER_LIST, isProviderDisableBrowserRequest } from '@/config/modelProviders';
import { AIProviderStoreState } from '@/store/aiInfra/initialState';
import { AiProviderRuntimeConfig } from '@/types/aiProvider';
import { GlobalLLMProviderKey } from '@/types/user/settings';

// List - no strict filtering needed as providers are controlled via DEFAULT_MODEL_PROVIDER_LIST
const enabledAiProviderList = (s: AIProviderStoreState) =>
  s.aiProviderList
    .filter((item) => item.enabled)
    .sort((a, b) => a.sort! - b.sort!);

// Disabled list
const disabledAiProviderList = (s: AIProviderStoreState) =>
  s.aiProviderList.filter((item) => !item.enabled);

const enabledImageModelList = (s: AIProviderStoreState) => s.enabledImageModelList || [];

const isProviderEnabled = (id: string) => (s: AIProviderStoreState) =>
  enabledAiProviderList(s).some((i) => i.id === id);

const isProviderLoading = (id: string) => (s: AIProviderStoreState) =>
  s.aiProviderLoadingIds.includes(id);

const activeProviderConfig = (s: AIProviderStoreState) => s.aiProviderDetail;

// Detail

const isAiProviderConfigLoading = (id: string) => (s: AIProviderStoreState) =>
  s.activeAiProvider !== id;

const providerWhitelist = new Set(['ollama', 'lmstudio']);

const activeProviderKeyVaults = (s: AIProviderStoreState) => activeProviderConfig(s)?.keyVaults;

const isActiveProviderEndpointNotEmpty = (s: AIProviderStoreState) => {
  const vault = activeProviderKeyVaults(s);
  return !!vault?.baseURL || !!vault?.endpoint;
};

const isActiveProviderApiKeyNotEmpty = (s: AIProviderStoreState) => {
  const vault = activeProviderKeyVaults(s);
  return !!vault?.apiKey || !!vault?.accessKeyId || !!vault?.secretAccessKey;
};

const providerConfigById =
  (id: string) =>
    (s: AIProviderStoreState): AiProviderRuntimeConfig | undefined => {
      if (!id) return undefined;

      return s.aiProviderRuntimeConfig?.[id];
    };

const isProviderConfigUpdating = (id: string) => (s: AIProviderStoreState) =>
  s.aiProviderConfigUpdatingIds.includes(id);

/**
 * @description The conditions to enable client fetch
 * 1. If no baseUrl and apikey input, force on Server.
 * 2. If only contains baseUrl, force on Client
 * 3. Follow the user settings.
 * 4. On Server, by default.
 */
const isProviderFetchOnClient =
  (provider: GlobalLLMProviderKey | string) => (s: AIProviderStoreState) => {
    const config = providerConfigById(provider)(s);

    // If the provider already disable browser request in model config, force on Server.
    if (isProviderDisableBrowserRequest(provider)) return false;

    // If the provider in the whitelist, follow the user settings
    if (providerWhitelist.has(provider) && typeof config?.fetchOnClient !== 'undefined')
      return config?.fetchOnClient;

    // 1. If no baseUrl and apikey input, force on Server.
    const isProviderEndpointNotEmpty = !!config?.keyVaults.baseURL;
    const isProviderApiKeyNotEmpty = !!config?.keyVaults.apiKey;
    if (!isProviderEndpointNotEmpty && !isProviderApiKeyNotEmpty) return false;

    // 2. If only contains baseUrl, force on Client
    if (isProviderEndpointNotEmpty && !isProviderApiKeyNotEmpty) return true;

    // 3. Follow the user settings.
    if (typeof config?.fetchOnClient !== 'undefined') return config?.fetchOnClient;

    // 4. On Server, by default.
    return false;
  };

const providerKeyVaults = (provider: string | undefined) => (s: AIProviderStoreState) => {
  if (!provider) return undefined;

  return s.aiProviderRuntimeConfig?.[provider]?.keyVaults;
};

// Helper to get searchMode from static config
const getStaticProviderSearchMode = (provider: string): string | undefined => {
  const staticConfig = DEFAULT_MODEL_PROVIDER_LIST.find((p) => p.id === provider);
  return staticConfig?.settings?.searchMode;
};

const isProviderHasBuiltinSearch = (provider: string) => (s: AIProviderStoreState) => {
  const config = providerConfigById(provider)(s);

  // First check runtime config, then fallback to static config
  return !!config?.settings?.searchMode || !!getStaticProviderSearchMode(provider);
};

const isProviderHasBuiltinSearchConfig = (id: string) => (s: AIProviderStoreState) => {
  const providerCfg = providerConfigById(id)(s);

  // Check runtime config first
  const runtimeSearchMode = providerCfg?.settings?.searchMode;
  if (runtimeSearchMode) {
    return runtimeSearchMode !== 'internal';
  }

  // Fallback to static config
  const staticSearchMode = getStaticProviderSearchMode(id);
  return !!staticSearchMode && staticSearchMode !== 'internal';
};

const isProviderEnableResponseApi = (id: string) => (s: AIProviderStoreState) => {
  const providerCfg = providerConfigById(id)(s);

  const enableResponseApi = providerCfg?.config?.enableResponseApi;

  if (typeof enableResponseApi === 'boolean') return enableResponseApi;

  return false;
};

const isInitAiProviderRuntimeState = (s: AIProviderStoreState) => !!s.isInitAiProviderRuntimeState;

export const aiProviderSelectors = {
  activeProviderConfig,
  disabledAiProviderList,
  enabledAiProviderList,
  enabledImageModelList,
  isActiveProviderApiKeyNotEmpty,
  isActiveProviderEndpointNotEmpty,
  isAiProviderConfigLoading,
  isInitAiProviderRuntimeState,
  isProviderConfigUpdating,
  isProviderEnableResponseApi,
  isProviderEnabled,
  isProviderFetchOnClient,
  isProviderHasBuiltinSearch,
  isProviderHasBuiltinSearchConfig,
  isProviderLoading,
  providerConfigById,
  providerKeyVaults,
};
