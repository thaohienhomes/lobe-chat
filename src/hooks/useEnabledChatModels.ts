import { useMemo } from 'react';

import PhoChatConfig from '@/config/modelProviders/phochat';
import { getModelTier } from '@/config/pricing';
import VercelAIGatewayConfig from '@/config/modelProviders/vercelaigateway';
import { usePostHogFeatureFlags } from '@/hooks/usePostHogFeatureFlags';
import { AiProviderSourceEnum, EnabledProviderWithModels } from '@/types/aiProvider';
import { ModelProviderCard } from '@/types/llm';
import { PHO_AUTO_MODEL_ID } from '@/utils/autoRouter';

/**
 * New model IDs that should display a "MỚI" (NEW) badge in the picker.
 * Remove entries once the launch period ends.
 */
export const NEW_MODEL_IDS = new Set([
  'openai/gpt-5.3-codex',
  'xai/grok-4.2',
  'moonshot/kimi-k2.5',
  'kimi-k2.5',
  'mercury-coder-small-2-2',
  'anthropic/claude-opus-4-6',
  'anthropic/claude-sonnet-4-6',
  'google/gemini-3.1-pro-preview',
]);

/**
 * Models that should show a speed indicator in the picker.
 * Map of modelId → display speed label.
 */
export const SPEED_MODELS: Record<string, string> = {
  'mercury-coder-small-2-2': '1000+',
};

/**
 * Short descriptions for models, shown as subtitle in picker.
 * Vietnamese language for local brand, English for international models.
 */
export const MODEL_DESCRIPTIONS: Record<string, string> = {
  // Phở Auto — virtual model for smart routing
  [PHO_AUTO_MODEL_ID]: 'Tự động chọn model phù hợp nhất',

  'anthropic/claude-4-opus': 'Anthropic · Suy luận cao cấp',





  'anthropic/claude-4.5-sonnet': 'Anthropic · Sáng tạo',





  'anthropic/claude-haiku-3.5': 'Anthropic · Nhẹ & nhanh',




  // Premium models (vercelaigateway)
  'anthropic/claude-opus-4-6-20250219': 'Anthropic · Mạnh nhất',




  'anthropic/claude-sonnet-4-20250514': 'Anthropic · Cân bằng',



  'anthropic/claude-sonnet-4-6-20250219': 'Anthropic · Tốc độ + chất lượng',



  'deepseek/deepseek-chat': 'DeepSeek · Coding & Math',



  'deepseek/deepseek-reasoner': 'DeepSeek · Reasoning sâu',


  // Open models
  'gemma-3-27b-it': 'Google · Tool calling',

  'google/gemini-2.0-flash': 'Google · Đa năng & nhanh',

  'google/gemini-2.5-flash': 'Google · Reasoning nhanh',

  'google/gemini-2.5-pro': 'Google · Reasoning mạnh',

  'google/gemini-3.1-pro': 'Google · 2M context · Multimodal',

  'kimi-k2': 'MoonshotAI · 1T params · Coding',

  'llama-4-scout-17b': 'Meta · MoE 17Bx16E',

  'mercury-coder-small-2-2': 'AI nhanh nhất thế giới · Diffusion LLM',

  'openai/gpt-4.1': 'OpenAI · Coding xuất sắc',

  'openai/gpt-4o': 'OpenAI · Đa năng',

  'openai/gpt-5.2': 'OpenAI · Flagship',

  'openai/o4-mini': 'OpenAI · Reasoning nhanh',
  // Phở Chat branded
  'pho-fast': 'Trả lời tức thì',
  'pho-pro': 'Viết nội dung · Phân tích',
  'pho-smart': 'Suy luận phức tạp',
  'pho-vision': 'Phân tích hình ảnh',
  'xai/grok-3': 'xAI · Flagship',
  'xai/grok-3-mini': 'xAI · Reasoning nhanh',
};

interface TierModelChild {
  abilities: { functionCall: boolean; reasoning: boolean; vision: boolean };
  contextWindowTokens?: number;
  displayName: string;
  id: string;
  /** Original provider ID needed for updateAgentConfig routing */
  originProvider: string;
}

export interface TierGroup extends Omit<EnabledProviderWithModels, 'children'> {
  children: TierModelChild[];
  /** Tier number: 1=Free, 2=Pro, 3=Flagship */
  tierGroup: number;
}

/**
 * Helper: convert a provider config into flat model list with provider tracking.
 */
const flattenProvider = (
  config: ModelProviderCard,
  providerId: string,
): TierModelChild[] => {
  return (config.chatModels || [])
    .filter((m) => m.enabled !== false)
    .map((model) => ({
      abilities: {
        functionCall: model.functionCall ?? false,
        reasoning: model.reasoning ?? false,
        vision: model.vision ?? false,
      },
      contextWindowTokens: model.contextWindowTokens,
      displayName: model.displayName || model.id,
      id: model.id,
      originProvider: providerId,
    }));
};

/**
 * Hook to get all chat models for the model picker, grouped by TIER.
 *
 * Architecture: 3 tiered groups
 *   1. ⚡ Free (Tier 1): No daily limit — Phở Fast, Mercury 2, Gemma, Llama, etc.
 *   2. 🔮 Pro (Tier 2): 20 msgs/day — Phở Pro, Smart, Vision, Claude Sonnet, GPT-4o, etc.
 *   3. 👑 Flagship (Tier 3): 5 msgs/day — Claude Opus 4.6, Gemini 3.1 Pro, GPT-5.2, etc.
 *
 * Raw providers (Groq, Cerebras, Together AI) are HIDDEN from the picker.
 * They still function as failover targets within phoGatewayService chains.
 */
export const useEnabledChatModels = (): TierGroup[] => {
  const { isFeatureEnabled, ready } = usePostHogFeatureFlags();

  const providers = useMemo((): TierGroup[] => {
    // Collect all models from both providers
    const allModels: TierModelChild[] = [];

    // Phở Chat models
    allModels.push(...flattenProvider(PhoChatConfig, 'phochat'));

    // Vercel AI Gateway models (if enabled)
    if (isFeatureEnabled('llm-provider-vercelaigateway')) {
      allModels.push(...flattenProvider(VercelAIGatewayConfig as ModelProviderCard, 'vercelaigateway'));
    }

    // Group by tier
    const tier1: TierModelChild[] = [];
    const tier2: TierModelChild[] = [];
    const tier3: TierModelChild[] = [];

    for (const model of allModels) {
      const tier = getModelTier(model.id);
      if (tier === 1) tier1.push(model);
      else if (tier === 2) tier2.push(model);
      else tier3.push(model);
    }

    const result: TierGroup[] = [];

    // ✨ Phở Auto: always first, always available
    result.push({
      children: [{
        abilities: { functionCall: true, reasoning: true, vision: true },
        displayName: 'Phở Auto ✨',
        id: PHO_AUTO_MODEL_ID,
        originProvider: 'phochat',
      }],
      id: 'tier-auto',
      name: '✨ Tự Động',
      source: AiProviderSourceEnum.Builtin,
      tierGroup: 0,
    });

    if (tier1.length > 0) {
      result.push({
        children: tier1,
        id: 'tier-free',
        name: '⚡ Nhanh & Miễn Phí',
        source: AiProviderSourceEnum.Builtin,
        tierGroup: 1,
      });
    }

    if (tier2.length > 0) {
      result.push({
        children: tier2,
        id: 'tier-pro',
        name: '🔮 Chuyên Nghiệp',
        source: AiProviderSourceEnum.Builtin,
        tierGroup: 2,
      });
    }

    if (tier3.length > 0) {
      result.push({
        children: tier3,
        id: 'tier-flagship',
        name: '👑 Flagship',
        source: AiProviderSourceEnum.Builtin,
        tierGroup: 3,
      });
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isFeatureEnabled]);

  return providers;
};
