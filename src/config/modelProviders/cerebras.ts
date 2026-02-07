import { ModelProviderCard } from '@/types/llm';

const Cerebras: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 128_000,
      description: 'Llama 3.1 8B - Ultra-fast inference on Cerebras CS-3',
      displayName: 'Llama 3.1 8B',
      enabled: true,
      id: 'llama3.1-8b',
      maxOutput: 8192,
    },
    {
      contextWindowTokens: 128_000,
      description: 'Llama 3.1 70B - High quality with fastest-in-class inference',
      displayName: 'Llama 3.1 70B',
      enabled: true,
      id: 'llama3.1-70b',
      maxOutput: 8192,
    },
  ],
  checkModel: 'llama3.1-8b',
  description:
    'Cerebras cung cấp tốc độ suy luận nhanh nhất thế giới, sử dụng chip CS-3 chuyên dụng. Tối ưu cho phản hồi tức thì, tạo mã lệnh thời gian thực, và tác vụ AI cần tốc độ cao.',
  id: 'cerebras',
  modelsUrl: 'https://inference-docs.cerebras.ai/models/overview',
  name: 'Cerebras',
  settings: {
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://cerebras.ai',
};

export default Cerebras;
