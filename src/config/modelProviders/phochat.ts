import { ModelProviderCard } from '@/types/llm';

// Phở Chat — Branded AI models with multi-provider failover
// Backend: PhoGatewayService resolves logical model IDs to real providers
// Failover chain: Groq → Cerebras → Cloudflare Workers AI
// NOTE: Raw providers (Groq, TogetherAI, etc.) are hidden from UI picker.
// Models exposed here appear in the picker — raw provider models do not.
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
        {
            contextWindowTokens: 8192,
            description:
                'Gemma 3 27B — Model mã nguồn mở mới nhất của Google với khả năng tool calling mạnh mẽ, hỗ trợ đa ngôn ngữ, và hiệu suất vượt trội so với kích thước. Chạy trên Groq với tốc độ inference cực nhanh.',
            displayName: 'Gemma 3 27B ✨',
            enabled: true,
            functionCall: true,
            id: 'gemma-3-27b-it',
        },
        {
            contextWindowTokens: 131_072,
            description:
                'Llama 4 Scout — Model mixture-of-experts 17Bx16E của Meta, tối ưu cho multi-task inference nhanh. Đã chuyển sang Tier 1 vì chi phí thấp và hiệu suất cao.',
            displayName: 'Llama 4 Scout ⚡',
            enabled: true,
            functionCall: true,
            id: 'llama-4-scout-17b',
        },
        {
            contextWindowTokens: 128_000,
            description:
                'Kimi K2 — Model frontier của MoonshotAI với 1 nghìn tỷ tham số (32B active), xuất sắc trong agentic tasks và tool calling. 128K context, lý tưởng cho coding, reasoning phức tạp.',
            displayName: 'Kimi K2 🌙',
            enabled: true,
            functionCall: true,
            id: 'kimi-k2',
        },
        {
            contextWindowTokens: 128_000,
            description:
                'Mercury 2 — Model AI nhanh nhất thế giới (1000+ tokens/giây). Diffusion LLM sinh tokens song song, lý tưởng cho trả lời tức thì, structured outputs, và tool calling. Miễn phí Tier 1.',
            displayName: 'Mercury 2 ⚡',
            enabled: true,
            functionCall: true,
            id: 'mercury-coder-small-2-2',
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
