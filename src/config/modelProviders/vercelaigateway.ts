import { ModelProviderCard } from '@/types/llm';

// Vercel AI Gateway - Unified access to 100+ AI models
// Docs: https://vercel.com/docs/ai-gateway
// API Keys: https://vercel.com/ai-gateway/api-keys
// Models: https://vercel.com/ai-gateway/models
const VercelAIGateway: ModelProviderCard = {
  apiKeyUrl: 'https://vercel.com/dashboard/ai-gateway',
  chatModels: [
    // --- Anthropic Models ---
    {
      contextWindowTokens: 200_000,
      description: 'Claude 4.5 Sonnet - Best balance of intelligence and speed',
      displayName: 'Claude 4.5 Sonnet',
      enabled: true,
      functionCall: true,
      id: 'anthropic/claude-sonnet-4.5',
      maxOutput: 8192,
      vision: true,
    },
    {
      contextWindowTokens: 200_000,
      description: 'Claude 4.5 Haiku - Fast and efficient for simple tasks',
      displayName: 'Claude 4.5 Haiku',
      enabled: true,
      functionCall: true,
      id: 'anthropic/claude-haiku-4.5',
      maxOutput: 8192,
      vision: true,
    },
    // --- Google Models ---
    {
      contextWindowTokens: 1_000_000,
      description: 'Gemini 2.5 Flash - Fast multimodal with Google Search grounding',
      displayName: 'Gemini 2.5 Flash',
      enabled: true,
      functionCall: true,
      id: 'google/gemini-2.5-flash',
      maxOutput: 8192,
      vision: true,
    },
    {
      contextWindowTokens: 2_000_000,
      description: 'Gemini 2.5 Pro - Advanced reasoning with 2M context',
      displayName: 'Gemini 2.5 Pro',
      enabled: true,
      functionCall: true,
      id: 'google/gemini-2.5-pro',
      maxOutput: 8192,
      reasoning: true,
      vision: true,
    },
    {
      contextWindowTokens: 1_000_000,
      description: 'Gemini 2.0 Flash - Fast and efficient',
      displayName: 'Gemini 2.0 Flash',
      enabled: true,
      functionCall: true,
      id: 'google/gemini-2.0-flash',
      maxOutput: 8192,
      vision: true,
    },
    // --- OpenAI Models ---
    {
      contextWindowTokens: 128_000,
      description: 'GPT-5.2 - Latest OpenAI flagship model',
      displayName: 'GPT-5.2',
      enabled: true,
      functionCall: true,
      id: 'openai/gpt-5.2',
      maxOutput: 16_384,
      vision: true,
    },
    {
      contextWindowTokens: 128_000,
      description: 'GPT-4.1 - Balanced performance and cost',
      displayName: 'GPT-4.1',
      enabled: true,
      functionCall: true,
      id: 'openai/gpt-4.1',
      maxOutput: 16_384,
      vision: true,
    },
    {
      contextWindowTokens: 128_000,
      description: 'GPT-4o - Optimized for vision and multimodal',
      displayName: 'GPT-4o',
      enabled: true,
      functionCall: true,
      id: 'openai/gpt-4o',
      maxOutput: 16_384,
      vision: true,
    },
    // --- DeepSeek Models ---
    {
      contextWindowTokens: 128_000,
      description: 'DeepSeek R1 - Advanced reasoning model',
      displayName: 'DeepSeek R1',
      enabled: true,
      id: 'deepseek/deepseek-r1',
      maxOutput: 8192,
      reasoning: true,
    },
    {
      contextWindowTokens: 128_000,
      description: 'DeepSeek V3 - Fast and cost-effective',
      displayName: 'DeepSeek V3',
      enabled: true,
      functionCall: true,
      id: 'deepseek/deepseek-chat',
      maxOutput: 8192,
    },
    // --- xAI Models ---
    {
      contextWindowTokens: 128_000,
      description: 'Grok 4 - Latest xAI model with real-time knowledge',
      displayName: 'Grok 4',
      enabled: true,
      functionCall: true,
      id: 'xai/grok-4',
      maxOutput: 16_384,
      vision: true,
    },
    // --- Meta Models ---
    {
      contextWindowTokens: 128_000,
      description: 'Llama 4 70B - Open-weight large model by Meta',
      displayName: 'Llama 4 70B',
      enabled: true,
      functionCall: true,
      id: 'meta-llama/llama-4-70b-instruct',
      maxOutput: 8192,
    },
  ],
  checkModel: 'google/gemini-2.5-flash',
  description:
    'Vercel AI Gateway cung cấp quyền truy cập thống nhất vào 100+ mô hình AI từ OpenAI, Anthropic, Google, Meta, xAI và nhiều nhà cung cấp khác. Hỗ trợ auto-fallback, giám sát chi phí, và không markup phí tokens.',
  id: 'vercelaigateway',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://vercel.com/ai-gateway/models',
  name: 'Vercel AI Gateway',
  settings: {
    disableBrowserRequest: true, // CORS error
    responseAnimation: 'smooth',
    showModelFetcher: true,
  },
  url: 'https://vercel.com/ai-gateway',
};

export default VercelAIGateway;
