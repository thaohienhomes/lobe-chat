import { ModelProviderCard } from '@/types/llm';

// InceptionLabs Mercury — Diffusion LLM with 1000+ tokens/sec
// API: OpenAI-compatible (https://api.inceptionlabs.ai/v1)
// Docs: https://docs.inceptionlabs.ai
// Supports: Structured outputs, Tool use, JSON mode, RAG
const InceptionLabs: ModelProviderCard = {
    chatModels: [
        {
            contextWindowTokens: 128_000,
            description:
                'Mercury 2 — Mô hình AI nhanh nhất thế giới (1000+ tokens/giây). Diffusion LLM sinh tokens song song, lý tưởng cho trả lời tức thì, structured outputs, và tool calling.',
            displayName: 'Mercury 2 ⚡',
            enabled: true,
            functionCall: true,
            id: 'mercury-coder-small-2-2',
            maxOutput: 8192,
            releasedAt: '2026-02-01',
        },
        {
            contextWindowTokens: 128_000,
            description:
                'Mercury Coder Small — Model nhỏ gọn với tốc độ 700+ tokens/giây, tối ưu cho coding workloads và structured outputs.',
            displayName: 'Mercury Coder Small',
            enabled: true,
            functionCall: true,
            id: 'mercury-coder-small-2',
            maxOutput: 8192,
            releasedAt: '2025-03-01',
        },
    ],
    description:
        'InceptionLabs Mercury — Mô hình AI nhanh nhất thế giới dựa trên công nghệ Diffusion LLM. Sinh tokens song song (1000+ tok/s), hỗ trợ structured outputs, tool calling, và JSON mode. OpenAI-compatible API.',
    id: 'inceptionlabs',
    modelList: { showModelFetcher: false },
    name: 'InceptionLabs',
    settings: {
        disableBrowserRequest: true,
        sdkType: 'openai',
    },
    url: 'https://inceptionlabs.ai',
};

export default InceptionLabs;
