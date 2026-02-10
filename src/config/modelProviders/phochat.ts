import { ModelProviderCard } from '@/types/llm';

// Phở Chat — Branded AI models with multi-provider failover
// Backend: PhoGatewayService resolves logical model IDs to real providers
// Failover chain: Groq → Cerebras → Cloudflare Workers AI
const PhoChat: ModelProviderCard = {
    chatModels: [
        {
            contextWindowTokens: 131_072,
            description:
                'Model nhanh nhất của Phở Chat. Tối ưu cho trả lời tức thì, brainstorming, và hỏi đáp nhanh. Sử dụng Llama 3.1 8B với failover tự động qua Groq, Cerebras, và Cloudflare Workers AI.',
            displayName: 'Phở Fast ⚡',
            enabled: true,
            id: 'pho-fast',
        },
        {
            contextWindowTokens: 131_072,
            description:
                'Model cân bằng giữa tốc độ và chất lượng. Phù hợp cho viết nội dung, phân tích, và công việc hàng ngày. Sử dụng Llama 3.3 70B với failover qua Groq, Fireworks AI, và Cloudflare Workers AI.',
            displayName: 'Phở Pro 🔥',
            enabled: true,
            functionCall: true,
            id: 'pho-pro',
        },
        {
            contextWindowTokens: 131_072,
            description:
                'Model thông minh nhất của Phở Chat. Dành cho suy luận phức tạp, lập trình nâng cao, và phân tích chuyên sâu. Sử dụng Llama 3.1 70B từ Cerebras và Together AI.',
            displayName: 'Phở Smart 🧠',
            enabled: true,
            id: 'pho-smart',
        },
        {
            contextWindowTokens: 131_072,
            description:
                'Model hỗ trợ hình ảnh và multimodal. Có thể phân tích ảnh, biểu đồ, và tài liệu. Sử dụng Llama 3.2 90B Vision và Gemini 2.0 Flash với failover tự động.',
            displayName: 'Phở Vision 👁️',
            enabled: true,
            id: 'pho-vision',
            vision: true,
        },
    ],
    description:
        'Phở Chat AI — Mô hình AI thông minh với tự động chuyển đổi đa nhà cung cấp. Tối ưu cho người dùng Việt Nam với độ trễ thấp và độ tin cậy cao nhờ failover qua Groq, Cerebras, và Cloudflare Workers AI.',
    id: 'phochat',
    name: 'Phở Chat',
    settings: {
        disableBrowserRequest: true,
        sdkType: 'openai',
    },
    url: 'https://pho.chat',
};

export default PhoChat;
