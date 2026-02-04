'use client';

import { Markdown } from '@lobehub/ui';
import Link from 'next/link';
import { Flexbox } from 'react-layout-kit';

const blogContent = `
![Gemini 2.0 Flash](/images/blog/gemini-flash.png)

## Gemini 2.0 Flash Thinking - Bước Đột Phá Trong AI Suy Luận

Google vừa ra mắt **Gemini 2.0 Flash Thinking** - mô hình AI với khả năng suy luận vượt trội, mở ra kỷ nguyên mới cho nghiên cứu và ứng dụng AI.

---

## 🧠 Tính Năng Thinking Mode

### Cách Thức Hoạt Động

Gemini 2.0 Flash Thinking sử dụng kỹ thuật **Chain-of-Thought reasoning** nâng cao:

1. **Phân tích vấn đề** - Chia nhỏ câu hỏi phức tạp
2. **Suy luận từng bước** - Xử lý logic tuần tự
3. **Tự kiểm tra** - Validate kết quả trước khi trả lời
4. **Streaming thoughts** - Hiển thị quá trình suy nghĩ real-time

### So Sánh Với Các Model Khác

| Model | Thinking Mode | Speed | Accuracy |
|-------|--------------|-------|----------|
| Gemini 2.0 Flash Thinking | ✅ Native | Nhanh | 92% |
| Claude 3.5 Sonnet | ⚠️ Extended | Trung bình | 89% |
| GPT-4o | ❌ | Nhanh | 87% |
| DeepSeek R1 | ✅ Native | Chậm | 90% |

---

## 🔬 Ứng Dụng Trong Nghiên Cứu

### Y Sinh Học
- Phân tích cơ chế bệnh học phức tạp
- Đề xuất hướng nghiên cứu mới
- Tổng hợp literature review

### Data Science
- Giải quyết bài toán thống kê
- Thiết kế experiment
- Phân tích kết quả nghiên cứu

### Lập Trình
- Debug code phức tạp
- Thiết kế architecture
- Code review chi tiết

---

## 💡 Sử Dụng Trên Phở Chat

Phở Chat đã tích hợp **Gemini 2.0 Flash Thinking** với các tính năng đặc biệt:

- **Thinking Collapse** - Ẩn/hiện quá trình suy luận
- **Custom System Prompt** - Tùy chỉnh hướng suy nghĩ
- **Streaming với Animation** - UX mượt mà

### Cách Kích Hoạt

1. Vào **Settings → Model Settings**
2. Chọn **Gemini 2.0 Flash Thinking**
3. Enable **Show Thinking Process**

---

## 🚀 Kết Luận

Gemini 2.0 Flash Thinking đánh dấu bước tiến quan trọng trong AI reasoning. Với tốc độ nhanh và độ chính xác cao, đây là lựa chọn lý tưởng cho các tác vụ nghiên cứu phức tạp.

**Thử ngay trên [Phở Chat](https://pho.chat)!**
`;

export default function GeminiFlashPage() {
  return (
    <html lang="vi">
      <head>
        <title>Gemini 2.0 Flash Thinking - AI Suy Luận Mới | Phở Chat Blog</title>
        <meta
          content="Tìm hiểu về Gemini 2.0 Flash Thinking - mô hình AI với khả năng suy luận vượt trội từ Google"
          name="description"
        />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * { box-sizing: border-box; margin: 0; padding: 0; }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0f1f35 100%);
            min-height: 100vh;
            color: #e0e0e0;
          }
          
          .container { max-width: 900px; margin: 0 auto; padding: 48px 24px; }
          
          .back-link {
            display: inline-flex; align-items: center; gap: 8px;
            color: rgba(255, 255, 255, 0.6); text-decoration: none;
            margin-bottom: 32px; font-size: 0.9rem; transition: color 0.2s;
          }
          .back-link:hover { color: #a855f7; }
          
          .header { margin-bottom: 48px; }
          
          .category-badge {
            display: inline-block; padding: 6px 16px;
            background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
            border-radius: 20px; font-size: 0.85rem; font-weight: 600;
            color: white; margin-bottom: 16px;
          }
          
          .title {
            font-size: 2.25rem; font-weight: 700;
            background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; margin-bottom: 12px;
          }
          
          .date { color: rgba(255, 255, 255, 0.5); font-size: 0.95rem; }
          
          .content {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px; padding: 48px;
          }
          
          .content img {
            width: 100%; border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            margin-bottom: 32px;
          }
          
          h2 { font-size: 1.5rem; color: #fff; margin-top: 40px; margin-bottom: 20px;
               padding-bottom: 10px; border-bottom: 2px solid rgba(6, 182, 212, 0.3); }
          h2:first-child { margin-top: 0; }
          h3 { font-size: 1.15rem; color: #22d3ee; margin-top: 24px; margin-bottom: 12px; }
          p, li { line-height: 1.8; color: rgba(255, 255, 255, 0.8); }
          ul, ol { padding-left: 24px; }
          li { margin: 10px 0; }
          li::marker { color: #06b6d4; }
          strong { color: #fff; }
          code { background: rgba(6, 182, 212, 0.1); padding: 2px 8px; border-radius: 4px; color: #22d3ee; }
          a { color: #22d3ee; text-decoration: none; }
          a:hover { text-decoration: underline; }
          hr { border: none; height: 1px;
               background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.5), transparent);
               margin: 40px 0; }
          table { width: 100%; border-collapse: collapse; margin: 24px 0;
                  background: rgba(0, 0, 0, 0.2); border-radius: 12px; overflow: hidden; }
          th, td { padding: 16px; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
          th { background: rgba(6, 182, 212, 0.2); font-weight: 600; color: #fff; }
          tr:hover { background: rgba(6, 182, 212, 0.05); }
          
          .footer { text-align: center; margin-top: 48px; color: rgba(255, 255, 255, 0.5); }
          .footer a { color: #a855f7; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <Link className="back-link" href="/blog">
            ← Quay lại Blog
          </Link>

          <header className="header">
            <span className="category-badge">🧠 AI News</span>
            <h1 className="title">Gemini 2.0 Flash Thinking</h1>
            <p className="date">3 tháng 2, 2026</p>
          </header>

          <main className="content">
            <Flexbox gap={24}>
              <Markdown>{blogContent}</Markdown>
            </Flexbox>
          </main>

          <footer className="footer">
            <p>
              <a href="https://pho.chat">← Quay lại Phở Chat</a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
