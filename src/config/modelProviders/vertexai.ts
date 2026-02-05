import { ModelProviderCard } from '@/types/llm';

// ref: https://cloud.google.com/vertex-ai/generative-ai/docs/model-garden/explore-models
// NOTE: Partner models (Claude, Llama, DeepSeek, Mistral) require custom backend implementation
// Currently only Google Gemini models are supported via @lobechat/model-runtime
const VertexAI: ModelProviderCard = {
  chatModels: [
    // --- Gemini 3 Family (Preview) ---
    {
      contextWindowTokens: 1_000_000,
      description: 'Gemini 3 Pro (Preview) - Model suy luận tiên tiến nhất cho các quy trình agent tự động',
      displayName: 'Gemini 3 Pro (Preview)',
      enabled: true,
      functionCall: true,
      id: 'gemini-3-pro-preview',
      maxOutput: 65_536,
      vision: true,
    },
    {
      contextWindowTokens: 1_000_000,
      description: 'Gemini 3 Flash (Preview) - Độ trễ suy nghĩ gần như bằng không với khả năng đa phương thức cao',
      displayName: 'Gemini 3 Flash (Preview)',
      enabled: true,
      functionCall: true,
      id: 'gemini-3-flash-preview',
      maxOutput: 65_536,
      vision: true,
    },
    // --- Gemini 2.5 Family ---
    {
      contextWindowTokens: 2_000_000,
      description: 'Gemini 2.5 Pro - Sẵn sàng cho sản phẩm thực tế với khả năng suy luận và phân tích ngữ cảnh dài',
      displayName: 'Gemini 2.5 Pro',
      enabled: true,
      functionCall: true,
      id: 'gemini-2.5-pro',
      maxOutput: 8192,
      reasoning: true,
      vision: true,
    },
    {
      contextWindowTokens: 1_000_000,
      description: 'Gemini 2.5 Flash - Sự cân bằng tốt nhất giữa tốc độ, chi phí và hiệu suất đa phương thức',
      displayName: 'Gemini 2.5 Flash',
      enabled: true,
      functionCall: true,
      id: 'gemini-2.5-flash',
      maxOutput: 8192,
      vision: true,
    },
    {
      contextWindowTokens: 1_000_000,
      description: 'Gemini 2.5 Flash-Lite - Model hiệu suất cao được tối ưu hóa chi phí',
      displayName: 'Gemini 2.5 Flash-Lite',
      enabled: true,
      functionCall: true,
      id: 'gemini-2.5-flash-lite',
      maxOutput: 8192,
      vision: true,
    },
    // --- Gemini 2.0 Family ---
    {
      contextWindowTokens: 1_000_000,
      description: 'Gemini 2.0 Flash - Ổn định, nhanh chóng và tin cậy cho tạo sinh đa phương thức',
      displayName: 'Gemini 2.0 Flash',
      enabled: true,
      functionCall: true,
      id: 'gemini-2.0-flash',
      maxOutput: 8192,
      vision: true,
    },
  ],
  checkModel: 'gemini-2.5-flash',
  description:
    'Google Vertex AI là nền tảng AI thống nhất cấp doanh nghiệp, cung cấp quyền truy cập vào các mô hình Gemini tiên tiến nhất. Hỗ trợ bảo mật cao cấp, grounding với Google Search, và tích hợp sâu vào hệ sinh thái Google Cloud.',
  enabled: true,
  id: 'vertexai',
  modelsUrl: 'https://console.cloud.google.com/vertex-ai/model-garden',
  name: 'Vertex AI',
  settings: {
    disableBrowserRequest: true,
    responseAnimation: 'smooth',
    // Enable Google Search grounding for Gemini models
    // https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/grounding
    searchMode: 'params',
    showModelFetcher: false,
  },
  url: 'https://cloud.google.com/vertex-ai',
};

export default VertexAI;
