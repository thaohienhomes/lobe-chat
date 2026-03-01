import { AiModelSourceEnum } from 'model-bank';

import { AIProviderStoreState } from '@/store/aiInfra/initialState';
import { ModelSearchImplement } from '@/types/search';

// Phở Chat logical models that support function calling (tool use / plugins).
// These are NOT in the model-bank npm package, so they need to be listed explicitly.
// Keep in sync with src/config/modelProviders/phochat.ts
const PHO_CHAT_FUNCTION_CALL_MODELS = new Set([
  'pho-auto',
  'pho-fast',
  'pho-pro',
  'pho-smart',
  'pho-vision',
  'gemma-3-27b-it',
  'llama-4-scout-17b',
  'kimi-k2',
  'kimi-k2.5',
  'mercury-coder-small-2-2',
]);

const aiProviderChatModelListIds = (s: AIProviderStoreState) =>
  s.aiProviderModelList.filter((item) => item.type === 'chat').map((item) => item.id);
// List
const enabledAiProviderModelList = (s: AIProviderStoreState) =>
  s.aiProviderModelList.filter((item) => item.enabled);

const disabledAiProviderModelList = (s: AIProviderStoreState) =>
  s.aiProviderModelList.filter((item) => !item.enabled);

const filteredAiProviderModelList = (s: AIProviderStoreState) => {
  const keyword = s.modelSearchKeyword.toLowerCase().trim();

  return s.aiProviderModelList.filter(
    (model) =>
      model.id.toLowerCase().includes(keyword) ||
      model.displayName?.toLowerCase().includes(keyword),
  );
};

const totalAiProviderModelList = (s: AIProviderStoreState) => s.aiProviderModelList.length;

const isEmptyAiProviderModelList = (s: AIProviderStoreState) => totalAiProviderModelList(s) === 0;

const getModelCard = (model: string, provider: string) => (s: AIProviderStoreState) =>
  s.builtinAiModelList.find((item) => item.id === model && item.providerId === provider);

const hasRemoteModels = (s: AIProviderStoreState) =>
  s.aiProviderModelList.some((m) => m.source === AiModelSourceEnum.Remote);

const isModelEnabled = (id: string) => (s: AIProviderStoreState) =>
  enabledAiProviderModelList(s).some((i) => i.id === id);

const isModelLoading = (id: string) => (s: AIProviderStoreState) =>
  s.aiModelLoadingIds.includes(id);

const getAiModelById = (id: string) => (s: AIProviderStoreState) =>
  s.aiProviderModelList.find((i) => i.id === id);

const getEnabledModelById = (id: string, provider: string) => (s: AIProviderStoreState) =>
  s.enabledAiModels?.find((i) => i.id === id && (provider ? provider === i.providerId : true));

const isModelSupportToolUse = (id: string, provider: string) => (s: AIProviderStoreState) => {
  // First, check enabledAiModels (server-side data)
  const enabledModel = getEnabledModelById(id, provider)(s);
  if (enabledModel?.abilities?.functionCall) {
    return true;
  }

  // Fallback 2: check builtinAiModelList (static config from model-bank npm package)
  // This handles cases where provider isn't fully configured but model has functionCall in config
  const builtinModel = s.builtinAiModelList?.find(
    (m) => m.id === id && (provider ? m.providerId === provider : true),
  );

  if (builtinModel?.abilities?.functionCall) {
    return true;
  }

  // Fallback 3: phochat logical models — NOT in model-bank npm package.
  // Check model ID against explicit set of phochat function-calling models.
  // provider is 'phochat' when selected from the Phở Chat section in model picker.
  const isPhochatProvider = !provider || provider === 'phochat';
  if (isPhochatProvider && PHO_CHAT_FUNCTION_CALL_MODELS.has(id)) {
    return true;
  }

  // Fallback 4: Cross-provider search — find the model in ANY provider's data.
  // This handles Vercel AI Gateway models whose IDs contain provider prefixes
  // (e.g. 'anthropic/claude-sonnet-4-20250514' under provider 'vercelaigateway').
  // The config may register functionCall under a different provider entry.
  const crossProviderMatch = s.enabledAiModels?.find((m) => m.id === id);
  if (crossProviderMatch?.abilities?.functionCall) {
    return true;
  }
  const crossProviderBuiltin = s.builtinAiModelList?.find((m) => m.id === id);
  if (crossProviderBuiltin?.abilities?.functionCall) {
    return true;
  }

  // Fallback 5: All Vercel AI Gateway models support tool calling.
  // These are premium models (Claude, GPT, Gemini, etc.) routed through
  // Vercel's unified gateway — all of them support function calling natively.
  if (provider === 'vercelaigateway') {
    return true;
  }

  // Fallback 6: Known model prefixes that always support function calling.
  // Models from major providers inherently support tool use.
  const FC_PREFIXES = ['anthropic/', 'openai/', 'google/', 'deepseek/', 'xai/', 'meta-llama/'];
  if (FC_PREFIXES.some((prefix) => id.startsWith(prefix))) {
    return true;
  }

  return false;
};

const isModelSupportFiles = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.abilities?.files;
};

const isModelSupportVision = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.abilities?.vision || false;
};

const isModelSupportVideo = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.abilities?.video;
};

const isModelSupportReasoning = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.abilities?.reasoning;
};

const isModelHasContextWindowToken =
  (id: string, provider: string) => (s: AIProviderStoreState) => {
    const model = getEnabledModelById(id, provider)(s);

    return typeof model?.contextWindowTokens === 'number';
  };

const modelContextWindowTokens = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.contextWindowTokens;
};

const modelExtendParams = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.settings?.extendParams;
};

const isModelHasExtendParams = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const controls = modelExtendParams(id, provider)(s);

  return !!controls && controls.length > 0;
};

const modelBuiltinSearchImpl = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.settings?.searchImpl;
};

const isModelHasBuiltinSearch = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const searchImpl = modelBuiltinSearchImpl(id, provider)(s);

  return !!searchImpl;
};

const isModelHasBuiltinSearchConfig =
  (id: string, provider: string) => (s: AIProviderStoreState) => {
    const searchImpl = modelBuiltinSearchImpl(id, provider)(s);

    return (
      !!searchImpl &&
      [ModelSearchImplement.Tool, ModelSearchImplement.Params].includes(
        searchImpl as ModelSearchImplement,
      )
    );
  };

export const aiModelSelectors = {
  aiProviderChatModelListIds,
  disabledAiProviderModelList,
  enabledAiProviderModelList,
  filteredAiProviderModelList,
  getAiModelById,
  getEnabledModelById,
  getModelCard,
  hasRemoteModels,
  isEmptyAiProviderModelList,
  isModelEnabled,
  isModelHasBuiltinSearch,
  isModelHasBuiltinSearchConfig,
  isModelHasContextWindowToken,
  isModelHasExtendParams,
  isModelLoading,
  isModelSupportFiles,
  isModelSupportReasoning,
  isModelSupportToolUse,
  isModelSupportVideo,
  isModelSupportVision,
  modelBuiltinSearchImpl,
  modelContextWindowTokens,
  modelExtendParams,
  totalAiProviderModelList,
};
