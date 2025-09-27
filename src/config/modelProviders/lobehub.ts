import { ModelProviderCard } from '@/types/llm';

const LobeHub: ModelProviderCard = {
  chatModels: [],
  description:
    'pho.chat Cloud 通过官方部署的 API 来实现 AI 模型的调用，并采用 Credits 计算积分的方式来衡量 AI 模型的用量，对应大模型使用的 Tokens。',
  enabled: true,
  id: 'lobehub',
  modelsUrl: 'https://pho.chat/docs/usage/subscription/model-pricing',
  name: 'pho.chat',
  settings: {
    modelEditable: false,
    showAddNewModel: false,
    showModelFetcher: false,
  },
  showConfig: false,
  url: 'https://pho.chat',
};

export default LobeHub;

export const planCardModels = ['gpt-4o-mini', 'deepseek-reasoner', 'claude-3-5-sonnet-latest'];
