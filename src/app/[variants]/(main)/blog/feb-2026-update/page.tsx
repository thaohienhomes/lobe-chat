import { Markdown } from '@lobehub/ui';
import { Flexbox } from 'react-layout-kit';

const blogContent = `
# ✨ Phở Auto & Models Mới — Cập nhật Tháng 2/2026

*27 tháng 02, 2026 — Chúc mừng Ngày Thầy Thuốc Việt Nam 🩺💖*

---

## 🎯 Phở Auto — Tự Động Chọn Model

**Phở Auto** là tính năng mới giúp bạn không cần phải chọn model AI thủ công nữa. Hệ thống sẽ phân tích câu hỏi của bạn và tự động chọn model phù hợp nhất!

### Cách hoạt động:
- **Phân tích câu hỏi** — Đánh giá độ phức tạp và loại câu hỏi
- **7 chuyên mục** — Lập trình, Toán học, Y khoa, Phân tích, Sáng tạo, Dịch thuật, Chung
- **Tự động chọn tier** — Dựa trên gói đăng ký của bạn

### Cách sử dụng:
Chỉ cần chọn **"Phở Auto ✨"** từ model picker, và hệ thống sẽ tự động chọn model tốt nhất!

---

## 🤖 Models Mới Tháng 2/2026

### GPT-5.3 Codex (OpenAI)
- Model coding mới nhất, nhanh hơn 25% so với phiên bản trước
- Tier 2 — 150 points/message

### Grok 4.2 (xAI)
- Kiến trúc 4-agent, giảm 65% hallucination
- Tier 2 — 150 points/message

### Kimi K2.5 (MoonshotAI)
- Agent Swarm công nghệ mới với 100 agents đồng thời
- Có ở cả Tier 1 (qua Groq) và Tier 2 (qua Gateway)

### Mercury 2 (InceptionLabs)
- ⚡ AI nhanh nhất thế giới — 1000+ tokens/giây
- Công nghệ Diffusion-based, sinh token song song
- Tier 1 — phù hợp cho câu hỏi nhanh

### Claude Opus 4.6 & Sonnet 4.6 (Anthropic)
- Nâng cấp từ Claude 4, 1M context beta
- Agentic coding xuất sắc, hỗ trợ dự án lớn
- Sonnet: Tier 2 | Opus: Tier 3

### Gemini 3.1 Pro Preview (Google)
- ARC-AGI-2 đạt 77.1%, suy luận nâng cao
- 2M context window
- Tier 3 — model cao cấp

---

## 🗑️ Models Đã Ngừng

| Model | Lý do |
|-------|-------|
| GPT-4o | OpenAI ngừng hỗ trợ từ 13/02/2026 |
| GPT-4.1 | OpenAI ngừng hỗ trợ từ 13/02/2026 |
| Claude 4 Sonnet (old) | Thay bằng Sonnet 4.6 |
| Claude 4 Opus (old) | Thay bằng Opus 4.6 |

---

## 📊 Bảng So Sánh Nhanh

| Model | Tier | Points | Tốc độ | Chất lượng |
|-------|------|--------|--------|------------|
| Mercury 2 | 1 | 5 | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ |
| Kimi K2.5 (Groq) | 1 | 5 | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ |
| GPT-5.3 Codex | 2 | 150 | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ |
| Grok 4.2 | 2 | 150 | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ |
| Kimi K2.5 (Gateway) | 2 | 150 | ⚡⚡⚡ | ⭐⭐⭐⭐ |
| Claude Sonnet 4.6 | 2 | 150 | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ |
| Claude Opus 4.6 | 3 | 1000 | ⚡⚡ | ⭐⭐⭐⭐⭐ |
| Gemini 3.1 Pro | 3 | 1000 | ⚡⚡ | ⭐⭐⭐⭐⭐ |

---

## 🚀 Bắt Đầu Ngay

1. Truy cập **[pho.chat](https://pho.chat)**
2. Chọn **"Phở Auto ✨"** từ model picker
3. Bắt đầu trò chuyện — AI sẽ tự chọn model tốt nhất!

---

*Phở Chat — Nền tảng AI thông minh cho người Việt* 🍜
`;

export default function Feb2026UpdatePage() {
    return (
        <Flexbox
            padding={24}
            style={{
                background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
                minHeight: '100vh',
            }}
        >
            <Flexbox
                style={{
                    backdropFilter: 'blur(10px)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 16,
                    margin: '0 auto',
                    maxWidth: 900,
                    padding: 32,
                }}
            >
                <Markdown>{blogContent}</Markdown>
            </Flexbox>
        </Flexbox>
    );
}
